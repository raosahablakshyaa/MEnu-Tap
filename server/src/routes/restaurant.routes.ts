import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import {
  authenticate, validateBody, authRateLimiter, enforceTenant,
  requireRestaurantOwner, attachRestaurant, upload,
} from '../middlewares';
import {
  restaurantRegisterSchema, businessDetailsSchema, addressSchema,
  operationalInfoSchema, brandingSchema,
  sendOtpSchema, verifyOtpSchema, updateSettingsSchema,
} from '../validators/restaurant.validator';
import { restaurantRegistrationService } from '../services/restaurantRegistration.service';
import { restaurantProfileService } from '../services/restaurantProfile.service';
import { uploadService } from '../services/upload.service';
import { authService } from '../services/auth.service';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator';

const router = Router();

// Public / semi-public
router.post('/register', authRateLimiter, validateBody(restaurantRegisterSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await restaurantRegistrationService.registerStep1(req.body, res);
    sendCreated(res, 'Registration successful', result);
  })
);

router.post('/login', authRateLimiter, validateBody(loginSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meta = authService.getClientMeta(req);
    const result = await authService.login(req.body, meta, res);
    sendSuccess(res, 'Login successful', result);
  })
);

router.post('/verify-email',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const token = req.body.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token required', data: null, errors: null });
      return;
    }
    const result = await restaurantRegistrationService.verifyEmail(token, req);
    sendSuccess(res, 'Email verified', result);
  })
);

// Authenticated onboarding
router.use(authenticate);
router.use(attachRestaurant);

router.get('/onboarding/status', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const status = await restaurantRegistrationService.getOnboardingStatus(req.user!._id.toString());
  sendSuccess(res, 'Onboarding status retrieved', status);
}));

router.put('/onboarding/business-details', validateBody(businessDetailsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await restaurantRegistrationService.updateBusinessDetails(
      req.restaurantId!.toString(), req.body, req
    );
    sendSuccess(res, 'Business details updated', result);
  })
);

router.put('/onboarding/address', validateBody(addressSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await restaurantRegistrationService.updateAddress(
      req.restaurantId!.toString(), req.body, req
    );
    sendSuccess(res, 'Address updated', result);
  })
);

router.put('/onboarding/operational-info', validateBody(operationalInfoSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await restaurantRegistrationService.updateOperationalInfo(
      req.restaurantId!.toString(), req.body, req
    );
    sendSuccess(res, 'Operational info updated', result);
  })
);

router.put('/onboarding/branding', validateBody(brandingSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await restaurantRegistrationService.updateBranding(
      req.restaurantId!.toString(), req.body, req
    );
    sendSuccess(res, 'Branding updated', result);
  })
);

router.post('/onboarding/upload', upload.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded', data: null, errors: null });
      return;
    }
    const type = (req.body.type as string) || 'general';
    const result = await uploadService.uploadImage(
      req.file.buffer,
      `restaurants/${req.restaurantId}`,
      `${type}-${Date.now()}`
    );
    sendSuccess(res, 'File uploaded', result);
  })
);

router.post('/send-otp', validateBody(sendOtpSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await restaurantRegistrationService.sendOtp(req.body.phone, req);
    sendSuccess(res, result.message, result);
  })
);

router.post('/verify-otp', validateBody(verifyOtpSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await restaurantRegistrationService.verifyOtp(req.body.phone, req.body.otp, req);
    sendSuccess(res, 'Phone verified', result);
  })
);

router.post('/change-password', validateBody(changePasswordSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.changePassword(req.user!._id.toString(), req.body);
    sendSuccess(res, result.message);
  })
);

// Profile & settings
router.get('/profile', requireRestaurantOwner,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await restaurantProfileService.getProfile(req.user!._id.toString());
    sendSuccess(res, 'Profile retrieved', profile);
  })
);

router.put('/profile', requireRestaurantOwner,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await restaurantProfileService.updateProfile(
      req.restaurantId!.toString(), req.body, req
    );
    sendSuccess(res, 'Profile updated', profile);
  })
);

router.get('/settings', requireRestaurantOwner, enforceTenant,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await restaurantProfileService.getSettings(req.restaurantId!.toString());
    sendSuccess(res, 'Settings retrieved', settings);
  })
);

router.put('/settings', requireRestaurantOwner, enforceTenant, validateBody(updateSettingsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await restaurantProfileService.updateSettings(
      req.restaurantId!.toString(), req.body, req
    );
    sendSuccess(res, 'Settings updated', settings);
  })
);

export default router;
