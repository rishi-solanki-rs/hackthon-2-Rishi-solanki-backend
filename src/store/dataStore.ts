import {
  User,
  Listing,
  Request,
  Plan,
  PlanChecklistItem,
  PlanOptionsMatrix,
  ExternalShop,
  AppNotification,
  ListingSearchFilters,
  CreateListingInput,
  UpdateListingInput,
  CreateRequestInput,
  JoinSocietyInput,
  SocietyImpactStats,
  AdminQueueData,
  SEED_USERS,
  SEED_LISTINGS,
  SEED_SHOPS,
  SEED_PLANS,
  SEED_REQUESTS,
  rankOptionsForItem,
  evaluateItemSafety,
  canAcceptRequest,
  findCompetingRequestsToDecline,
} from '@sidekit/shared';
import {
  isMongoConnected,
  UserModel,
  ListingModel,
  RequestModel,
  PlanModel,
  ShopModel,
  NotificationModel,
} from '../db/mongo';

class ServerDataStore {
  public users: User[] = [];
  public listings: Listing[] = [];
  public requests: Request[] = [];
  public plans: Plan[] = [];
  public shops: ExternalShop[] = [];
  public notifications: AppNotification[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.users = JSON.parse(JSON.stringify(SEED_USERS));
    this.listings = JSON.parse(JSON.stringify(SEED_LISTINGS));
    this.requests = JSON.parse(JSON.stringify(SEED_REQUESTS));
    this.plans = JSON.parse(JSON.stringify(SEED_PLANS));
    this.shops = JSON.parse(JSON.stringify(SEED_SHOPS));
    this.notifications = [
      {
        id: 'notif_welcome',
        userId: 'usr_rishi',
        type: 'request_accepted',
        title: 'Request Accepted',
        message: 'Amit K. accepted your borrow request for Hammer Drill.',
        link: '/my/requests',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    // Also reset MongoDB if connected
    if (isMongoConnected()) {
      this.resetMongoCollections().catch((err) =>
        console.error('Error resetting MongoDB collections:', err.message)
      );
    }
  }

  private async resetMongoCollections(): Promise<void> {
    try {
      await Promise.all([
        UserModel.deleteMany({}),
        ListingModel.deleteMany({}),
        RequestModel.deleteMany({}),
        PlanModel.deleteMany({}),
        ShopModel.deleteMany({}),
        NotificationModel.deleteMany({}),
      ]);
      await Promise.all([
        UserModel.insertMany(this.users),
        ListingModel.insertMany(this.listings),
        RequestModel.insertMany(this.requests),
        PlanModel.insertMany(this.plans),
        ShopModel.insertMany(this.shops),
        NotificationModel.insertMany(this.notifications),
      ]);
      console.log('MongoDB Atlas: Collections reset to fresh demo seed state.');
    } catch (e: any) {
      console.error('MongoDB Atlas Reset Error:', e.message);
    }
  }

  public async syncFromMongo(): Promise<void> {
    if (!isMongoConnected()) return;
    try {
      const [u, l, r, p, s, n] = await Promise.all([
        UserModel.find().lean(),
        ListingModel.find().lean(),
        RequestModel.find().lean(),
        PlanModel.find().lean(),
        ShopModel.find().lean(),
        NotificationModel.find().lean(),
      ]);

      if (u.length > 0) this.users = u as unknown as User[];
      if (l.length > 0) this.listings = l as unknown as Listing[];
      if (r.length > 0) this.requests = r as unknown as Request[];
      if (p.length > 0) this.plans = p as unknown as Plan[];
      if (s.length > 0) this.shops = s as unknown as ExternalShop[];
      if (n.length > 0) this.notifications = n as unknown as AppNotification[];

      console.log(`Loaded from MongoDB Atlas: ${this.users.length} users, ${this.listings.length} listings, ${this.requests.length} requests, ${this.plans.length} plans.`);
    } catch (e: any) {
      console.warn('Could not sync from MongoDB, maintaining current in-memory store:', e.message);
    }
  }

  public getUser(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  public saveUser(user: User): void {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.users[idx] = user;
    } else {
      this.users.push(user);
    }
    if (isMongoConnected()) {
      UserModel.updateOne({ id: user.id }, user, { upsert: true }).catch((e) =>
        console.error('Mongo User update error:', e.message)
      );
    }
  }

  public getListing(listingId: string): Listing | undefined {
    return this.listings.find((l) => l.id === listingId);
  }

  public saveListing(listing: Listing): void {
    const idx = this.listings.findIndex((l) => l.id === listing.id);
    if (idx >= 0) {
      this.listings[idx] = listing;
    } else {
      this.listings.push(listing);
    }
    if (isMongoConnected()) {
      ListingModel.updateOne({ id: listing.id }, listing, { upsert: true }).catch((e) =>
        console.error('Mongo Listing update error:', e.message)
      );
    }
  }

  public getRequest(requestId: string): Request | undefined {
    return this.requests.find((r) => r.id === requestId);
  }

  public saveRequest(req: Request): void {
    const idx = this.requests.findIndex((r) => r.id === req.id);
    if (idx >= 0) {
      this.requests[idx] = req;
    } else {
      this.requests.push(req);
    }
    if (isMongoConnected()) {
      RequestModel.updateOne({ id: req.id }, req, { upsert: true }).catch((e) =>
        console.error('Mongo Request update error:', e.message)
      );
    }
  }

  public getPlan(planId: string): Plan | undefined {
    return this.plans.find((p) => p.id === planId);
  }

  public savePlan(plan: Plan): void {
    const idx = this.plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      this.plans[idx] = plan;
    } else {
      this.plans.push(plan);
    }
    if (isMongoConnected()) {
      PlanModel.updateOne({ id: plan.id }, plan, { upsert: true }).catch((e) =>
        console.error('Mongo Plan update error:', e.message)
      );
    }
  }

  public addNotification(notif: AppNotification): void {
    this.notifications.push(notif);
    if (isMongoConnected()) {
      NotificationModel.create(notif).catch((e) =>
        console.error('Mongo Notification create error:', e.message)
      );
    }
  }
}

export const db = new ServerDataStore();
