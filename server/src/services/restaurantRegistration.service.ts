import { Types } from 'mongoose';
import { Restaurant, RestaurantVerification, IRestaurant } from '../models';
import { userRepository } from '../repositories/user.repository';
import { roleRepository } from '../repositories/role.repository';
import { tokenService } from './token.service';
import { otpService } from './otp.service';
import { hashPassword } from '../utils/password.utils';
import { slugify } from '../helpers/tenant.helper';
import { generateSecureToken, hashSecureToken } from '../helpers';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { ConflictError, BadRequestError, NotFoundError } from '../utils/errors';
import { ERROR_MESSAGES, ROLE_SLUGS, ONBOARDING_STEPS } from '../constants';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';

interface RegisterStep1Input {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
}

export class RestaurantRegistrationService {
  async registerStep1(input: RegisterStep1Input, res: Response) {
    const [emailExists, phoneExists] = await Promise.all([
      userRepository.emailExists(input.email),
      Restaurant.findOne({ 'contact.phone': input.phone, isDeleted: false }),
    ]);

    if (emailExists) throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
    if (phoneExists) throw new ConflictError('Phone number already registered');

    const role = await roleRepository.findSystemRoleBySlug(ROLE_SLUGS.RESTAURANT_OWNER);
    if (!role) throw new BadRequestError('Owner role not found');

    const slug = slugify(input.restaurantName);
    const slugTaken = await Restaurant.findOne({ slug, isDeleted: false });
    if (slugTaken) throw new ConflictError('Restaurant name already taken');

    const hashedPassword = await hashPassword(input.password);

    const user = await userRepository.create({
      email: input.email.toLowerCase(),
      password: hashedPassword,
      firstName: input.ownerName.split(' ')[0] || input.ownerName,
      lastName: input.ownerName.split(' ').slice(1).join(' ') || '',
      phone: input.phone,
      roleId: role._id as Types.ObjectId,
    });

    const restaurant = await Restaurant.create({
      name: input.restaurantName,
      slug,
      ownerName: input.ownerName,
      ownerId: user._id,
      contact: { email: input.email.toLowerCase(), phone: input.phone },
      status: 'pending',
      verificationStatus: 'unverified',
      isActive: false,
      onboardingStep: ONBOARDING_STEPS.BASIC_INFO,
      createdBy: user._id,
    });

    await userRepository.updateById(user._id, { restaurantId: restaurant._id });

    const emailToken = generateSecureToken();
    await RestaurantVerification.create({
      restaurantId: restaurant._id,
      userId: user._id,
      emailToken: hashSecureToken(emailToken),
      emailTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await notificationService.sendWelcomeEmail(user.email, input.ownerName, restaurant.name);
    await notificationService.sendEmailVerification(user.email, emailToken);

    const tokens = await tokenService.generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      roleSlug: role.slug,
      restaurantId: restaurant._id.toString(),
    });

    tokenService.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      user: this.formatUser(user, role.slug, restaurant),
      restaurant: this.formatRestaurant(restaurant),
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      nextStep: ONBOARDING_STEPS.BUSINESS_DETAILS,
    };
  }

  async updateBusinessDetails(restaurantId: string, data: Record<string, unknown>, req: AuthenticatedRequest) {
    const restaurant = await this.getOwnedRestaurant(restaurantId, req);
    restaurant.businessDetails = {
      ...restaurant.businessDetails,
      restaurantType: data.restaurantType as string,
      cuisineTypes: (data.cuisineTypes as string[]) || [],
      gstNumber: data.gstNumber as string,
      fssaiNumber: data.fssaiNumber as string,
      panNumber: data.panNumber as string,
    };
    restaurant.onboardingStep = Math.max(restaurant.onboardingStep, ONBOARDING_STEPS.BUSINESS_DETAILS);
    restaurant.updatedBy = req.user!._id;
    await restaurant.save();
    await auditLogService.logFromRequest(req, 'onboarding_business_details', 'restaurant', restaurantId);
    return this.formatRestaurant(restaurant);
  }

  async updateAddress(restaurantId: string, data: Record<string, unknown>, req: AuthenticatedRequest) {
    const restaurant = await this.getOwnedRestaurant(restaurantId, req);
    restaurant.address = {
      street: data.street as string,
      city: data.city as string,
      state: data.state as string,
      country: (data.country as string) || 'India',
      postalCode: data.postalCode as string,
      googleMapsUrl: data.googleMapsUrl as string,
      latitude: data.latitude as number,
      longitude: data.longitude as number,
    };
    restaurant.onboardingStep = Math.max(restaurant.onboardingStep, ONBOARDING_STEPS.ADDRESS);
    restaurant.updatedBy = req.user!._id;
    await restaurant.save();
    return this.formatRestaurant(restaurant);
  }

  async updateOperationalInfo(restaurantId: string, data: Record<string, unknown>, req: AuthenticatedRequest) {
    const restaurant = await this.getOwnedRestaurant(restaurantId, req);
    restaurant.operationalInfo = {
      ...restaurant.operationalInfo,
      openingTime: data.openingTime as string,
      closingTime: data.closingTime as string,
      workingDays: (data.workingDays as string[]) || [],
      avgPrepTimeMinutes: data.avgPrepTimeMinutes as number,
      seatingCapacity: data.seatingCapacity as number,
      numberOfTables: data.numberOfTables as number,
      numberOfFloors: data.numberOfFloors as number,
      numberOfBranches: (data.numberOfBranches as number) || 1,
    };
    restaurant.onboardingStep = Math.max(restaurant.onboardingStep, ONBOARDING_STEPS.RESTAURANT_INFO);
    restaurant.updatedBy = req.user!._id;
    await restaurant.save();
    return this.formatRestaurant(restaurant);
  }

  async updateBranding(restaurantId: string, data: { logo?: string; coverImage?: string; themeColor?: string; accentColor?: string }, req: AuthenticatedRequest) {
    const restaurant = await this.getOwnedRestaurant(restaurantId, req);
    if (data.logo) restaurant.logo = data.logo;
    if (data.coverImage) restaurant.coverImage = data.coverImage;
    restaurant.branding = {
      themeColor: data.themeColor || restaurant.branding?.themeColor,
      accentColor: data.accentColor || restaurant.branding?.accentColor,
    };
    restaurant.onboardingStep = Math.max(restaurant.onboardingStep, ONBOARDING_STEPS.BRANDING);
    restaurant.updatedBy = req.user!._id;
    await restaurant.save();
    return this.formatRestaurant(restaurant);
  }

  async verifyEmail(token: string, req: AuthenticatedRequest) {
    const hashed = hashSecureToken(token);
    const verification = await RestaurantVerification.findOne({
      emailToken: hashed,
      emailTokenExpires: { $gt: new Date() },
    });

    if (!verification) throw new BadRequestError('Invalid or expired verification token');

    const restaurant = await Restaurant.findById(verification.restaurantId);
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    restaurant.emailVerified = true;
    restaurant.verificationStatus = restaurant.phoneVerified ? 'fully_verified' : 'email_verified';
    verification.emailVerifiedAt = new Date();
    verification.emailToken = undefined;
    await verification.save();
    await restaurant.save();

    await userRepository.updateById(verification.userId.toString(), { isEmailVerified: true });

    if (restaurant.emailVerified && restaurant.phoneVerified) {
      await this.markPendingApproval(restaurant);
    }

    await auditLogService.logFromRequest(req, 'email_verified', 'restaurant', restaurant._id.toString());
    return { verified: true, restaurant: this.formatRestaurant(restaurant) };
  }

  async sendOtp(phone: string, req: AuthenticatedRequest) {
    const restaurant = await Restaurant.findOne({ 'contact.phone': phone, isDeleted: false });
    if (restaurant && restaurant.ownerId.toString() !== req.user!._id.toString()) {
      throw new ConflictError('Phone number already registered');
    }
    return otpService.sendPhoneOtp(phone, 'phone_verification', req.user!.email);
  }

  async verifyOtp(phone: string, otp: string, req: AuthenticatedRequest) {
    await otpService.verifyPhoneOtp(phone, otp, 'phone_verification');

    const restaurant = await Restaurant.findOne({ ownerId: req.user!._id });
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    restaurant.contact.phone = phone;
    restaurant.phoneVerified = true;
    restaurant.verificationStatus = restaurant.emailVerified ? 'fully_verified' : 'phone_verified';

    let verification = await RestaurantVerification.findOne({ restaurantId: restaurant._id });
    if (!verification) {
      verification = await RestaurantVerification.create({
        restaurantId: restaurant._id,
        userId: req.user!._id,
      });
    }
    verification.phoneVerifiedAt = new Date();
    await verification.save();
    await restaurant.save();

    if (restaurant.emailVerified && restaurant.phoneVerified) {
      await this.markPendingApproval(restaurant);
    }

    await notificationService.sendRegistrationConfirmation(restaurant);
    await auditLogService.logFromRequest(req, 'phone_verified', 'restaurant', restaurant._id.toString());

    return { verified: true, restaurant: this.formatRestaurant(restaurant) };
  }

  async getOnboardingStatus(userId: string) {
    const restaurant = await Restaurant.findOne({ ownerId: userId })
      .populate('subscriptionId');
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    const checklist = restaurant.onboardingChecklist || {};
    const items = Object.entries(checklist);
    const completed = items.filter(([, v]) => v).length;
    const completionPercentage = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

    return {
      restaurant: this.formatRestaurant(restaurant),
      onboardingStep: restaurant.onboardingStep,
      onboardingCompleted: restaurant.onboardingCompleted,
      verificationStatus: restaurant.verificationStatus,
      emailVerified: restaurant.emailVerified,
      phoneVerified: restaurant.phoneVerified,
      status: restaurant.status,
      checklist,
      completionPercentage,
    };
  }

  private async markPendingApproval(restaurant: IRestaurant) {
    if (restaurant.status === 'pending') {
      restaurant.status = 'pending_approval';
      await restaurant.save();
      await notificationService.notifyAdminNewRestaurant(restaurant);
    }
  }

  private async getOwnedRestaurant(restaurantId: string, req: AuthenticatedRequest) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new NotFoundError('Restaurant not found');
    if (restaurant.ownerId.toString() !== req.user!._id.toString() && !req.user!.isSuperAdmin) {
      throw new BadRequestError('Access denied');
    }
    return restaurant;
  }

  private formatRestaurant(r: IRestaurant) {
    return {
      id: r._id,
      name: r.name,
      slug: r.slug,
      ownerName: r.ownerName,
      status: r.status,
      verificationStatus: r.verificationStatus,
      emailVerified: r.emailVerified,
      phoneVerified: r.phoneVerified,
      onboardingStep: r.onboardingStep,
      onboardingCompleted: r.onboardingCompleted,
      address: r.address,
      contact: r.contact,
      businessDetails: r.businessDetails,
      operationalInfo: r.operationalInfo,
      branding: r.branding,
      logo: r.logo,
      coverImage: r.coverImage,
      subscriptionId: r.subscriptionId,
    };
  }

  private formatUser(user: { _id: Types.ObjectId; email: string; firstName: string; lastName: string; phone?: string }, roleSlug: string, restaurant: IRestaurant) {
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      role: { slug: roleSlug },
      restaurantId: restaurant._id,
    };
  }
}

export const restaurantRegistrationService = new RestaurantRegistrationService();
