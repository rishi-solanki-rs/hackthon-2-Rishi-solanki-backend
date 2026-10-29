import mongoose, { Schema } from 'mongoose';
import {
  User,
  Listing,
  Request,
  Plan,
  ExternalShop,
  AppNotification,
  DemandEntry,
  SEED_USERS,
  SEED_LISTINGS,
  SEED_SHOPS,
  SEED_PLANS,
  SEED_REQUESTS,
} from '@sidekit/shared';
import { config } from '../config';

// 1. User Schema
const UserSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    flat: { type: String, required: true },
    tower: { type: String, required: true },
    role: { type: String, required: true },
    rating: { type: Number, default: 5 },
    reviewCount: { type: Number, default: 0 },
    itemsSharedCount: { type: Number, default: 0 },
    totalEstimatedSavings: { type: Number, default: 0 },
    avatarUrl: { type: String },
    bio: { type: String },
    joinedAt: { type: String, required: true },
    thankYouNotes: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

// 2. Listing Schema
const ListingSchema = new Schema<Listing>(
  {
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    itemKey: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    mode: { type: String, required: true },
    price: { type: Number, default: null },
    priceUnit: { type: String, default: null },
    condition: { type: String, required: true },
    totalQuantity: { type: Number, required: true },
    status: { type: String, required: true },
    moderationStatus: { type: String, required: true },
    reportsCount: { type: Number, default: 0 },
    pickupNote: { type: String },
    comfortRules: { type: Schema.Types.Mixed },
    photos: [{ type: String }],
    ownerDisplayName: { type: String },
    ownerTower: { type: String },
    isSample: { type: Boolean, default: false },
    reportedBy: [{ type: String }],
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// 3. Request Schema
const RequestSchema = new Schema<Request>(
  {
    id: { type: String, required: true, unique: true },
    listingId: { type: String, required: true },
    planId: { type: String },
    requesterId: { type: String, required: true },
    ownerId: { type: String, required: true },
    kind: { type: String, required: true },
    requestedQuantity: { type: Number, required: true },
    neededFrom: { type: String },
    neededTo: { type: String },
    totalPrice: { type: Number },
    deposit: { type: Number },
    note: { type: String },
    status: { type: String, required: true },
    cancellationReason: { type: String },
    cancelledBy: { type: String },
    declineReason: { type: String },
    handoverConfirmedAt: { type: String },
    returnedAt: { type: String },
    thankYouNote: { type: String },
    listingTitle: { type: String },
    listingCategory: { type: String },
    requesterName: { type: String },
    requesterTower: { type: String },
    requesterPhone: { type: String },
    requesterFlat: { type: String },
    ownerName: { type: String },
    ownerTower: { type: String },
    ownerPhone: { type: String },
    ownerFlat: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// 4. Plan Schema
const PlanSchema = new Schema<Plan>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    taskDescription: { type: String, required: true },
    interpretedCategory: { type: String, required: true },
    clarificationAnswers: { type: Schema.Types.Mixed },
    items: [{ type: Schema.Types.Mixed }],
    safetyGate: { type: Schema.Types.Mixed },
    aiSource: { type: String },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// 5. External Shop Schema
const ShopSchema = new Schema<ExternalShop>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    address: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    phone: { type: String, required: true },
    items: [{ type: Schema.Types.Mixed }],
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 6. Notification Schema
const NotificationSchema = new Schema<AppNotification>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
  },
  { timestamps: true }
);

// 7. Demand Schema ("Notify me when available")
const DemandSchema = new Schema<DemandEntry>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  itemKey: { type: String, required: true },
  itemName: { type: String, required: true },
  createdAt: { type: String, required: true },
});

export const UserModel = mongoose.model<User>('User', UserSchema);
export const DemandModel = mongoose.model<DemandEntry>('Demand', DemandSchema);
export const ListingModel = mongoose.model<Listing>('Listing', ListingSchema);
export const RequestModel = mongoose.model<Request>('Request', RequestSchema);
export const PlanModel = mongoose.model<Plan>('Plan', PlanSchema);
export const ShopModel = mongoose.model<ExternalShop>('Shop', ShopSchema);
export const NotificationModel = mongoose.model<AppNotification>('Notification', NotificationSchema);

let isConnected = false;

export function isMongoConnected(): boolean {
  return isConnected;
}

export async function initMongoDB(): Promise<boolean> {
  if (!config.mongodbUri) {
    console.log('No MONGODB_URI configured. Running with in-memory store.');
    return false;
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log('Successfully connected to MongoDB Atlas (Database: sidekit_db)!');

    // Auto-seed collections if empty
    await seedCollectionsIfEmpty();
    return true;
  } catch (error: any) {
    console.warn('MongoDB connection failed, falling back to resilient in-memory store:', error.message);
    isConnected = false;
    return false;
  }
}

async function seedCollectionsIfEmpty() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial Users to MongoDB Atlas...');
      await UserModel.insertMany(SEED_USERS);
    }

    const listingCount = await ListingModel.countDocuments();
    if (listingCount === 0) {
      console.log('Seeding initial Listings to MongoDB Atlas...');
      await ListingModel.insertMany(SEED_LISTINGS);
    }

    const shopCount = await ShopModel.countDocuments();
    if (shopCount === 0) {
      console.log('Seeding initial Shops to MongoDB Atlas...');
      await ShopModel.insertMany(SEED_SHOPS);
    }

    const planCount = await PlanModel.countDocuments();
    if (planCount === 0) {
      console.log('Seeding initial Plans to MongoDB Atlas...');
      await PlanModel.insertMany(SEED_PLANS);
    }

    const requestCount = await RequestModel.countDocuments();
    if (requestCount === 0) {
      console.log('Seeding initial Requests to MongoDB Atlas...');
      await RequestModel.insertMany(SEED_REQUESTS);
    }

    const notifCount = await NotificationModel.countDocuments();
    if (notifCount === 0) {
      await NotificationModel.create({
        id: 'notif_welcome',
        userId: 'usr_rishi',
        type: 'request_accepted',
        title: 'Request Accepted',
        message: 'Amit K. accepted your borrow request for Hammer Drill.',
        link: '/my/requests',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    console.log('MongoDB Atlas collections verified and synchronized.');
  } catch (e: any) {
    console.error('Error seeding MongoDB collections:', e.message);
  }
}
