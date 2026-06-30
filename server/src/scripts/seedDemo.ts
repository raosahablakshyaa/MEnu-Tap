import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';
import { hashPassword } from '../utils/password.utils';
import { roleRepository } from '../repositories/role.repository';
import { ROLE_SLUGS } from '../constants';
import { logger } from '../utils/logger';
import { slugify } from '../helpers/tenant.helper';

import {
  Restaurant, MenuCategory, MenuItem, Table,
  Subscription, SubscriptionPlan, User,
} from '../models';

const OWNER_EMAIL = 'owner@tapmenu.com';
const OWNER_PASSWORD = 'Owner@123456';

const CATEGORIES = [
  { name: 'Starters',        description: 'Crispy, tangy appetizers to kick off your meal',       sortOrder: 1 },
  { name: 'Soups & Salads',  description: 'Fresh soups and healthy salad bowls',                   sortOrder: 2 },
  { name: 'Main Course',     description: 'Rich curries, gravies and dry preparations',             sortOrder: 3 },
  { name: 'Breads',          description: 'Freshly baked naan, roti and paratha from the tandoor', sortOrder: 4 },
  { name: 'Rice & Biryani',  description: 'Aromatic basmati rice dishes and biryanis',             sortOrder: 5 },
  { name: 'Tandoor Specials',description: 'Marinated meats and paneer from the clay oven',         sortOrder: 6 },
  { name: 'Desserts',        description: 'Sweet endings to a perfect meal',                       sortOrder: 7 },
  { name: 'Beverages',       description: 'Refreshing drinks, lassis and mocktails',               sortOrder: 8 },
];

const MENU_ITEMS = [
  // Starters
  { cat: 'Starters', name: 'Paneer Tikka',           foodType: 'veg',     price: 280, discountPrice: 320, spiceLevel: 'medium', prepTime: 20, calories: 320, isBestSeller: true,  isChefRecommended: true,  desc: 'Soft cottage cheese cubes marinated in spiced yogurt, grilled in tandoor. Served with mint chutney.' },
  { cat: 'Starters', name: 'Veg Seekh Kebab',        foodType: 'veg',     price: 220, spiceLevel: 'medium', prepTime: 18, calories: 280, isBestSeller: false, isChefRecommended: false, desc: 'Spiced vegetable and lentil seekh kebabs cooked on skewers over charcoal.' },
  { cat: 'Starters', name: 'Chicken Tikka',          foodType: 'non_veg', price: 340, discountPrice: 380, spiceLevel: 'medium', prepTime: 25, calories: 380, isBestSeller: true,  isChefRecommended: true,  desc: 'Boneless chicken marinated in yogurt and spices, cooked in tandoor. A timeless classic.' },
  { cat: 'Starters', name: 'Fish Amritsari',         foodType: 'non_veg', price: 360, spiceLevel: 'hot',   prepTime: 20, calories: 350, isBestSeller: false, isChefRecommended: true,  desc: 'Crispy fried fish coated in a tangy Amritsari spice blend. Served with lemon and chutney.' },
  { cat: 'Starters', name: 'Crispy Corn',            foodType: 'veg',     price: 180, spiceLevel: 'mild',  prepTime: 12, calories: 240, isBestSeller: false, isChefRecommended: false, desc: 'Golden fried corn kernels tossed with herbs, spices and lemon juice.' },
  { cat: 'Starters', name: 'Dahi Ke Sholay',         foodType: 'veg',     price: 200, spiceLevel: 'mild',  prepTime: 15, calories: 260, isBestSeller: false, isChefRecommended: false, desc: 'Crispy fried bread stuffed with hung curd, spices and herbs.' },

  // Soups & Salads
  { cat: 'Soups & Salads', name: 'Tomato Shorba',    foodType: 'veg',     price: 120, spiceLevel: 'mild',  prepTime: 10, calories: 90,  isBestSeller: false, isChefRecommended: false, desc: 'Velvety spiced tomato broth with cream, herbs and croutons.' },
  { cat: 'Soups & Salads', name: 'Chicken Mulligatawny', foodType: 'non_veg', price: 160, spiceLevel: 'medium', prepTime: 12, calories: 180, isBestSeller: false, isChefRecommended: false, desc: 'Classic Anglo-Indian pepper soup with chicken, lentils and coconut milk.' },
  { cat: 'Soups & Salads', name: 'Kachumber Salad',  foodType: 'veg',     price: 130, spiceLevel: 'mild',  prepTime: 8,  calories: 80,  isBestSeller: false, isChefRecommended: false, desc: 'Diced cucumber, tomato, onion and coriander with lemon dressing.' },
  { cat: 'Soups & Salads', name: 'Caesar Salad',     foodType: 'veg',     price: 220, spiceLevel: 'mild',  prepTime: 10, calories: 280, isBestSeller: false, isChefRecommended: false, desc: 'Crisp romaine, parmesan, croutons with classic caesar dressing.' },

  // Main Course
  { cat: 'Main Course', name: 'Paneer Butter Masala',   foodType: 'veg',     price: 320, discountPrice: 360, spiceLevel: 'mild',   prepTime: 20, calories: 420, isBestSeller: true,  isChefRecommended: true,  desc: 'Creamy tomato-based gravy with soft paneer cubes. The restaurant\'s most loved dish.' },
  { cat: 'Main Course', name: 'Dal Makhani',             foodType: 'veg',     price: 260, spiceLevel: 'mild',   prepTime: 30, calories: 380, isBestSeller: true,  isChefRecommended: false, desc: 'Slow-cooked black lentils simmered overnight in butter and cream. Rich and indulgent.' },
  { cat: 'Main Course', name: 'Shahi Paneer',            foodType: 'veg',     price: 340, spiceLevel: 'mild',   prepTime: 20, calories: 440, isBestSeller: false, isChefRecommended: false, desc: 'Royal cottage cheese in a rich cashew and cream sauce. Fit for a king.' },
  { cat: 'Main Course', name: 'Chicken Butter Masala',   foodType: 'non_veg', price: 380, discountPrice: 420, spiceLevel: 'mild',   prepTime: 25, calories: 460, isBestSeller: true,  isChefRecommended: true,  desc: 'Tender chicken in a velvety tomato-butter sauce. Everyone\'s favourite.' },
  { cat: 'Main Course', name: 'Mutton Rogan Josh',       foodType: 'non_veg', price: 440, spiceLevel: 'hot',    prepTime: 35, calories: 520, isBestSeller: false, isChefRecommended: true,  desc: 'Kashmiri lamb curry with whole spices, yogurt and aromatic oils.' },
  { cat: 'Main Course', name: 'Prawn Masala',            foodType: 'non_veg', price: 460, spiceLevel: 'hot',    prepTime: 25, calories: 380, isBestSeller: false, isChefRecommended: false, desc: 'Juicy prawns cooked in a spicy Goan-style masala with coconut.' },
  { cat: 'Main Course', name: 'Palak Paneer',            foodType: 'veg',     price: 280, spiceLevel: 'mild',   prepTime: 20, calories: 360, isBestSeller: false, isChefRecommended: false, desc: 'Creamy spinach puree with cubes of fresh paneer. Healthy and delicious.' },
  { cat: 'Main Course', name: 'Kadai Chicken',           foodType: 'non_veg', price: 360, spiceLevel: 'medium', prepTime: 25, calories: 420, isBestSeller: false, isChefRecommended: false, desc: 'Chicken cooked in a wok with bell peppers, onion and freshly ground kadai spices.' },

  // Breads
  { cat: 'Breads', name: 'Butter Naan',        foodType: 'veg', price: 60,  prepTime: 8,  calories: 180, isBestSeller: false, isChefRecommended: false, desc: 'Soft leavened bread cooked in tandoor and finished with butter.' },
  { cat: 'Breads', name: 'Garlic Naan',        foodType: 'veg', price: 70,  prepTime: 8,  calories: 190, isBestSeller: true,  isChefRecommended: false, desc: 'Tandoor naan topped with minced garlic and fresh coriander.' },
  { cat: 'Breads', name: 'Laccha Paratha',     foodType: 'veg', price: 80,  prepTime: 10, calories: 220, isBestSeller: false, isChefRecommended: false, desc: 'Flaky whole wheat layered flatbread made with butter.' },
  { cat: 'Breads', name: 'Stuffed Kulcha',     foodType: 'veg', price: 90,  prepTime: 12, calories: 280, isBestSeller: false, isChefRecommended: true,  desc: 'Amritsari kulcha stuffed with spiced potato and onion.' },
  { cat: 'Breads', name: 'Missi Roti',         foodType: 'veg', price: 70,  prepTime: 8,  calories: 200, isBestSeller: false, isChefRecommended: false, desc: 'Gram flour roti with spices, great with dal and sabzi.' },

  // Rice & Biryani
  { cat: 'Rice & Biryani', name: 'Veg Dum Biryani',      foodType: 'veg',     price: 280, discountPrice: 320, prepTime: 35, spiceLevel: 'medium', calories: 520, isBestSeller: false, isChefRecommended: false, desc: 'Fragrant basmati rice layered with spiced vegetables, cooked dum style with saffron.' },
  { cat: 'Rice & Biryani', name: 'Chicken Dum Biryani',  foodType: 'non_veg', price: 360, discountPrice: 400, prepTime: 40, spiceLevel: 'medium', calories: 620, isBestSeller: true,  isChefRecommended: true,  desc: 'Hyderabadi-style chicken biryani slow-cooked on dum. Served with raita and salan.' },
  { cat: 'Rice & Biryani', name: 'Mutton Biryani',       foodType: 'non_veg', price: 420, prepTime: 45, spiceLevel: 'hot',    calories: 680, isBestSeller: false, isChefRecommended: true,  desc: 'Tender mutton pieces cooked with aged basmati, whole spices and caramelised onion.' },
  { cat: 'Rice & Biryani', name: 'Jeera Rice',           foodType: 'veg',     price: 160, prepTime: 15, spiceLevel: 'mild',   calories: 280, isBestSeller: false, isChefRecommended: false, desc: 'Fragrant basmati rice tempered with cumin seeds and ghee.' },
  { cat: 'Rice & Biryani', name: 'Peas Pulao',           foodType: 'veg',     price: 180, prepTime: 18, spiceLevel: 'mild',   calories: 300, isBestSeller: false, isChefRecommended: false, desc: 'Basmati rice cooked with green peas, cardamom and bay leaf.' },

  // Tandoor Specials
  { cat: 'Tandoor Specials', name: 'Tandoori Chicken (Half)',  foodType: 'non_veg', price: 320, discountPrice: 360, spiceLevel: 'hot',    prepTime: 30, calories: 480, isBestSeller: true,  isChefRecommended: true,  desc: 'Half chicken marinated in yogurt and spices, cooked in clay oven to perfection.' },
  { cat: 'Tandoor Specials', name: 'Tandoori Pomfret',         foodType: 'non_veg', price: 520, spiceLevel: 'medium', prepTime: 25, calories: 420, isBestSeller: false, isChefRecommended: true,  desc: 'Whole pomfret fish marinated with tandoori spices and cooked in clay oven.' },
  { cat: 'Tandoor Specials', name: 'Malai Paneer Tikka',       foodType: 'veg',     price: 300, spiceLevel: 'mild',   prepTime: 20, calories: 360, isBestSeller: false, isChefRecommended: false, desc: 'Paneer in a mild cream and cashew marinade. Delicate and flavourful.' },
  { cat: 'Tandoor Specials', name: 'Murgh Malai Kebab',        foodType: 'non_veg', price: 360, discountPrice: 400, spiceLevel: 'mild',   prepTime: 25, calories: 400, isBestSeller: true,  isChefRecommended: false, desc: 'Chicken in a creamy cashew and cheese marinade. Melt-in-mouth texture.' },

  // Desserts
  { cat: 'Desserts', name: 'Gulab Jamun',        foodType: 'veg', price: 120, prepTime: 5,  calories: 320, isBestSeller: true,  isChefRecommended: false, desc: 'Soft milk-solid dumplings soaked in rose-flavoured sugar syrup. Served warm.' },
  { cat: 'Desserts', name: 'Gajar Ka Halwa',     foodType: 'veg', price: 160, prepTime: 8,  calories: 380, isBestSeller: false, isChefRecommended: true,  desc: 'Slow-cooked carrot pudding with ghee, milk, sugar and dry fruits. Seasonal delight.' },
  { cat: 'Desserts', name: 'Phirni',             foodType: 'veg', price: 140, prepTime: 5,  calories: 300, isBestSeller: false, isChefRecommended: false, desc: 'Chilled creamy rice pudding set in clay pots with saffron and pistachios.' },
  { cat: 'Desserts', name: 'Kulfi Falooda',      foodType: 'veg', price: 180, prepTime: 3,  calories: 420, isBestSeller: true,  isChefRecommended: true,  desc: 'Traditional Indian ice cream served with falooda sev, rose syrup and basil seeds.' },
  { cat: 'Desserts', name: 'Chocolate Lava Cake',foodType: 'veg', price: 220, prepTime: 15, calories: 480, isBestSeller: false, isChefRecommended: false, desc: 'Warm dark chocolate cake with a molten centre. Served with vanilla ice cream.' },

  // Beverages
  { cat: 'Beverages', name: 'Sweet Lassi',         foodType: 'veg', price: 100, prepTime: 3,  calories: 200, isBestSeller: false, isChefRecommended: false, desc: 'Thick chilled yogurt drink blended with sugar and cardamom.' },
  { cat: 'Beverages', name: 'Mango Lassi',          foodType: 'veg', price: 130, prepTime: 3,  calories: 240, isBestSeller: true,  isChefRecommended: false, desc: 'Creamy mango and yogurt blended drink. Seasonal favourite.' },
  { cat: 'Beverages', name: 'Masala Chai',          foodType: 'veg', price: 60,  prepTime: 5,  calories: 80,  isBestSeller: false, isChefRecommended: false, desc: 'Spiced Indian tea brewed with ginger, cardamom and cinnamon.' },
  { cat: 'Beverages', name: 'Fresh Lime Soda',      foodType: 'veg', price: 80,  prepTime: 2,  calories: 40,  isBestSeller: false, isChefRecommended: false, desc: 'Fresh lime juice with soda water. Available sweet, salted or masala.' },
  { cat: 'Beverages', name: 'Virgin Mojito',        foodType: 'veg', price: 140, prepTime: 5,  calories: 120, isBestSeller: true,  isChefRecommended: true,  desc: 'Mint, lime, sugar syrup and soda. Refreshing and zesty.' },
  { cat: 'Beverages', name: 'Rose Sharbat',         foodType: 'veg', price: 90,  prepTime: 2,  calories: 150, isBestSeller: false, isChefRecommended: false, desc: 'Chilled drink made with rose syrup, milk and basil seeds.' },
];

async function seedDemoRestaurant() {
  try {
    await connectDatabase();
    try { await connectRedis(); } catch { logger.warn('Redis unavailable'); }

    logger.info('🍽️  Starting demo restaurant seed...');

    // ── 1. Find or create owner user ──────────────────────────
    const ownerRole = await roleRepository.findSystemRoleBySlug(ROLE_SLUGS.RESTAURANT_OWNER);
    if (!ownerRole) throw new Error('restaurant_owner role not found');

    let ownerUser = await User.findOne({ email: OWNER_EMAIL });
    if (!ownerUser) {
      const hashed = await hashPassword(OWNER_PASSWORD);
      ownerUser = await User.create({
        email: OWNER_EMAIL,
        password: hashed,
        firstName: 'Demo',
        lastName: 'Owner',
        roleId: ownerRole._id,
        isEmailVerified: true,
        isActive: true,
      });
      logger.info(`Created owner user: ${OWNER_EMAIL}`);
    }

    // ── 2. Find or create restaurant ─────────────────────────
    let restaurant = await Restaurant.findOne({ ownerId: ownerUser._id });
    const restaurantSlug = 'spice-garden-mumbai';

    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'Spice Garden',
        slug: restaurantSlug,
        ownerName: 'Demo Owner',
        description: 'A contemporary Indian restaurant celebrating the bold flavours of North and South India. From smoky tandoor dishes to rich gravies and fragrant biryanis, every dish is crafted with passion and the freshest ingredients.',
        address: {
          street: '42, Marine Drive, Nariman Point',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400021',
          googleMapsUrl: 'https://maps.google.com/?q=Marine+Drive+Mumbai',
          latitude: 18.9432,
          longitude: 72.8236,
        },
        contact: {
          phone: '+91 98765 43210',
          email: OWNER_EMAIL,
          website: 'https://spicegarden.in',
        },
        businessDetails: {
          restaurantType: 'Fine Dining',
          cuisineTypes: ['North Indian', 'Mughlai', 'Tandoor', 'South Indian', 'Continental'],
          gstNumber: '27AABCU9603R1ZX',
          fssaiNumber: '10023011003104',
          panNumber: 'AABCU9603R',
        },
        operationalInfo: {
          openingTime: '12:00',
          closingTime: '23:30',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          avgPrepTimeMinutes: 20,
          seatingCapacity: 80,
          numberOfTables: 20,
          numberOfFloors: 2,
          numberOfBranches: 1,
        },
        branding: { themeColor: '#b91c1c', accentColor: '#d97706' },
        ownerId: ownerUser._id,
        status: 'approved',
        verificationStatus: 'fully_verified',
        emailVerified: true,
        phoneVerified: true,
        onboardingStep: 7,
        onboardingCompleted: true,
        onboardingChecklist: {
          completeProfile: true,
          addMenuCategories: true,
          addMenuItems: true,
          generateQrCodes: true,
          inviteStaff: false,
          configurePayments: true,
          publishMenu: true,
        },
        isActive: true,
        isVerified: true,
      });
      logger.info(`✅ Restaurant created: ${restaurant.name}`);
    } else {
      // Update to approved if not already
      if (restaurant.status !== 'approved') {
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          status: 'approved',
          verificationStatus: 'fully_verified',
          onboardingCompleted: true,
          isActive: true,
          isVerified: true,
        });
        logger.info('✅ Restaurant updated to approved');
      } else {
        logger.info('ℹ️  Restaurant already exists, skipping creation');
      }
    }

    // Link restaurant to owner user
    await User.findByIdAndUpdate(ownerUser._id, { restaurantId: restaurant._id });

    // ── 3. Subscription ───────────────────────────────────────
    const existingSub = await Subscription.findOne({ restaurantId: restaurant._id, status: 'active' });
    if (!existingSub) {
      const plan = await SubscriptionPlan.findOne({ slug: 'professional' });
      if (plan) {
        const sub = await Subscription.create({
          restaurantId: restaurant._id,
          planId: plan._id,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true,
          amount: plan.price,
          currency: 'INR',
        });
        await Restaurant.findByIdAndUpdate(restaurant._id, { subscriptionId: sub._id });
        logger.info('✅ Professional subscription activated');
      }
    } else {
      logger.info('ℹ️  Subscription already exists');
    }

    // ── 4. Menu Categories ────────────────────────────────────
    const existingCats = await MenuCategory.countDocuments({ restaurantId: restaurant._id });
    const catMap: Record<string, mongoose.Types.ObjectId> = {};

    if (existingCats === 0) {
      for (const cat of CATEGORIES) {
        const created = await MenuCategory.create({
          restaurantId: restaurant._id,
          name: cat.name,
          slug: slugify(cat.name),
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true,
          createdBy: ownerUser._id,
        });
        catMap[cat.name] = created._id as mongoose.Types.ObjectId;
      }
      logger.info(`✅ Created ${CATEGORIES.length} menu categories`);
    } else {
      // Load existing categories into map
      const existingCatDocs = await MenuCategory.find({ restaurantId: restaurant._id });
      for (const c of existingCatDocs) catMap[c.name] = c._id as mongoose.Types.ObjectId;
      logger.info('ℹ️  Categories already exist');
    }

    // ── 5. Menu Items ─────────────────────────────────────────
    const existingItems = await MenuItem.countDocuments({ restaurantId: restaurant._id });

    if (existingItems === 0) {
      let created = 0;
      for (const item of MENU_ITEMS) {
        const catId = catMap[item.cat];
        if (!catId) { logger.warn(`Category not found: ${item.cat}`); continue; }

        await MenuItem.create({
          restaurantId: restaurant._id,
          categoryId: catId,
          name: item.name,
          slug: slugify(item.name) + '-' + Math.random().toString(36).slice(2, 6),
          description: item.desc,
          foodType: item.foodType,
          spiceLevel: item.spiceLevel || undefined,
          price: item.price,
          discountPrice: item.discountPrice || undefined,
          taxRate: 5,
          preparationTime: item.prepTime,
          calories: item.calories,
          isBestSeller: item.isBestSeller,
          isChefRecommended: item.isChefRecommended,
          isFeatured: item.isBestSeller,
          isAvailable: true,
          isOutOfStock: false,
          availability: { breakfast: false, lunch: true, dinner: true, lateNight: false, weekendOnly: false, festivalOnly: false },
          sortOrder: 0,
          createdBy: ownerUser._id,
        });
        created++;
      }
      logger.info(`✅ Created ${created} menu items`);
    } else {
      logger.info('ℹ️  Menu items already exist');
    }

    // ── 6. Tables ─────────────────────────────────────────────
    const existingTables = await Table.countDocuments({ restaurantId: restaurant._id });

    if (existingTables === 0) {
      const tableData = [
        // Ground Floor
        ...Array.from({ length: 10 }, (_, i) => ({
          tableNumber: `T${String(i + 1).padStart(2, '0')}`,
          displayName: `Table ${i + 1}`,
          floor: 1, floorName: 'Ground Floor',
          capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
          status: 'available' as const,
        })),
        // First Floor
        ...Array.from({ length: 10 }, (_, i) => ({
          tableNumber: `T${String(i + 11).padStart(2, '0')}`,
          displayName: `Table ${i + 11}`,
          floor: 2, floorName: 'First Floor',
          capacity: i < 2 ? 2 : i < 7 ? 4 : 8,
          status: 'available' as const,
        })),
      ];

      for (const t of tableData) {
        await Table.create({ restaurantId: restaurant._id, ...t, isActive: true, createdBy: ownerUser._id });
      }
      logger.info(`✅ Created ${tableData.length} tables`);
    } else {
      logger.info('ℹ️  Tables already exist');
    }

    // ── 7. Demo Staff Invitations ────────────────────────────
    const { StaffInvitation } = await import('../models/staffInvitation.model');
    const existingInvites = await StaffInvitation.countDocuments({ restaurantId: restaurant._id });
    if (existingInvites === 0) {
      const demoInvites = [
        { email: 'manager@spicegarden.in', roleSlug: 'restaurant_manager' },
        { email: 'chef@spicegarden.in',    roleSlug: 'kitchen_staff' },
        { email: 'waiter1@spicegarden.in', roleSlug: 'waiter' },
        { email: 'cashier@spicegarden.in', roleSlug: 'cashier' },
      ];
      for (const inv of demoInvites) {
        const role = await roleRepository.findSystemRoleBySlug(inv.roleSlug);
        if (!role) continue;
        await StaffInvitation.create({
          restaurantId: restaurant._id,
          email: inv.email,
          roleSlug: inv.roleSlug,
          roleId: role._id,
          token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedBy: ownerUser._id,
        });
      }
      logger.info(`✅ Created ${demoInvites.length} demo staff invitations`);
    } else {
      logger.info('ℹ️  Staff invitations already exist');
    }
    logger.info('═══════════════════════════════════════════════');
    logger.info('🎉  Demo Restaurant Seeded Successfully!');
    logger.info('───────────────────────────────────────────────');
    logger.info(`🍽️  Restaurant : Spice Garden`);
    logger.info(`📍  Location   : Mumbai, Maharashtra`);
    logger.info(`👤  Login      : ${OWNER_EMAIL}`);
    logger.info(`🔑  Password   : ${OWNER_PASSWORD}`);
    logger.info(`📂  Categories : ${CATEGORIES.length}`);
    logger.info(`🍛  Menu Items : ${MENU_ITEMS.length}`);
    logger.info(`🪑  Tables     : 20 (2 floors)`);
    logger.info(`💳  Plan       : Professional`);
    logger.info('═══════════════════════════════════════════════');

  } catch (error) {
    logger.error('Demo seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    try { await disconnectRedis(); } catch { /* ignore */ }
    process.exit(0);
  }
}

seedDemoRestaurant();
