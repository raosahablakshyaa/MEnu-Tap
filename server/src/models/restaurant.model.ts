import { Schema, model, Document, Types } from 'mongoose';

export interface IRestaurantAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface IRestaurantContact {
  phone: string;
  email: string;
  website?: string;
}

export interface IRestaurantBusinessDetails {
  restaurantType?: string;
  cuisineTypes: string[];
  gstNumber?: string;
  fssaiNumber?: string;
  panNumber?: string;
}

export interface IRestaurantOperationalInfo {
  openingTime?: string;
  closingTime?: string;
  workingDays: string[];
  avgPrepTimeMinutes?: number;
  seatingCapacity?: number;
  numberOfTables?: number;
  numberOfFloors?: number;
  numberOfBranches?: number;
}

export interface IRestaurantBranding {
  themeColor?: string;
  accentColor?: string;
}

export interface IOnboardingChecklist {
  completeProfile: boolean;
  addMenuCategories: boolean;
  addMenuItems: boolean;
  generateQrCodes: boolean;
  inviteStaff: boolean;
  configurePayments: boolean;
  publishMenu: boolean;
}

export interface IApprovalHistoryEntry {
  action: 'approved' | 'rejected' | 'suspended' | 'activated' | 'info_requested';
  reason?: string;
  notes?: string;
  performedBy: Types.ObjectId;
  performedAt: Date;
}

export interface IRestaurantDocument {
  name: string;
  url: string;
  type: string;
  uploadedAt: Date;
}

export type RestaurantStatus = 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';
export type VerificationStatus = 'unverified' | 'email_verified' | 'phone_verified' | 'fully_verified';

export interface IRestaurant extends Document {
  name: string;
  slug: string;
  ownerName?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address: IRestaurantAddress;
  contact: IRestaurantContact;
  businessDetails: IRestaurantBusinessDetails;
  operationalInfo: IRestaurantOperationalInfo;
  branding: IRestaurantBranding;
  ownerId: Types.ObjectId;
  status: RestaurantStatus;
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;
  onboardingChecklist: IOnboardingChecklist;
  statusReason?: string;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  suspendedAt?: Date;
  suspendedBy?: Types.ObjectId;
  approvalHistory: IApprovalHistoryEntry[];
  documents: IRestaurantDocument[];
  subscriptionId?: Types.ObjectId;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IRestaurantAddress>(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    postalCode: { type: String, trim: true, default: '' },
    googleMapsUrl: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const contactSchema = new Schema<IRestaurantContact>(
  {
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    website: { type: String, trim: true },
  },
  { _id: false }
);

const businessDetailsSchema = new Schema<IRestaurantBusinessDetails>(
  {
    restaurantType: { type: String, trim: true },
    cuisineTypes: [{ type: String, trim: true }],
    gstNumber: { type: String, trim: true, uppercase: true },
    fssaiNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true, uppercase: true },
  },
  { _id: false }
);

const operationalInfoSchema = new Schema<IRestaurantOperationalInfo>(
  {
    openingTime: { type: String, trim: true },
    closingTime: { type: String, trim: true },
    workingDays: [{ type: String, trim: true }],
    avgPrepTimeMinutes: { type: Number, min: 0 },
    seatingCapacity: { type: Number, min: 0 },
    numberOfTables: { type: Number, min: 0 },
    numberOfFloors: { type: Number, min: 0 },
    numberOfBranches: { type: Number, min: 1, default: 1 },
  },
  { _id: false }
);

const brandingSchema = new Schema<IRestaurantBranding>(
  {
    themeColor: { type: String, trim: true, default: '#f97316' },
    accentColor: { type: String, trim: true, default: '#ea580c' },
  },
  { _id: false }
);

const checklistSchema = new Schema<IOnboardingChecklist>(
  {
    completeProfile: { type: Boolean, default: false },
    addMenuCategories: { type: Boolean, default: false },
    addMenuItems: { type: Boolean, default: false },
    generateQrCodes: { type: Boolean, default: false },
    inviteStaff: { type: Boolean, default: false },
    configurePayments: { type: Boolean, default: false },
    publishMenu: { type: Boolean, default: false },
  },
  { _id: false }
);

const approvalHistorySchema = new Schema<IApprovalHistoryEntry>(
  {
    action: { type: String, enum: ['approved', 'rejected', 'suspended', 'activated', 'info_requested'], required: true },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const documentSchema = new Schema<IRestaurantDocument>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    ownerName: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    logo: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    address: { type: addressSchema, default: () => ({}) },
    contact: { type: contactSchema, required: true },
    businessDetails: { type: businessDetailsSchema, default: () => ({ cuisineTypes: [] }) },
    operationalInfo: { type: operationalInfoSchema, default: () => ({ workingDays: [] }) },
    branding: { type: brandingSchema, default: () => ({}) },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'pending_approval', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'email_verified', 'phone_verified', 'fully_verified'],
      default: 'unverified',
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 1, min: 1, max: 7 },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingChecklist: { type: checklistSchema, default: () => ({}) },
    statusReason: { type: String, trim: true },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    suspendedAt: { type: Date },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvalHistory: { type: [approvalHistorySchema], default: [] },
    documents: { type: [documentSchema], default: [] },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

restaurantSchema.index({ status: 1, isDeleted: 1 });
restaurantSchema.index({ verificationStatus: 1 });
restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ 'address.state': 1 });
restaurantSchema.index({ ownerId: 1, isDeleted: 1 });
restaurantSchema.index({ 'contact.email': 1 });
restaurantSchema.index({ 'contact.phone': 1 });

restaurantSchema.pre('find', function () { this.where({ isDeleted: false }); });
restaurantSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

restaurantSchema.methods.softDelete = async function (deletedBy?: Types.ObjectId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  if (deletedBy) this.updatedBy = deletedBy;
  return this.save();
};

restaurantSchema.methods.getChecklistCompletion = function (): number {
  const checklist = this.onboardingChecklist || {};
  const items = Object.values(checklist);
  if (items.length === 0) return 0;
  const completed = items.filter(Boolean).length;
  return Math.round((completed / items.length) * 100);
};

export const Restaurant = model<IRestaurant>('Restaurant', restaurantSchema);
