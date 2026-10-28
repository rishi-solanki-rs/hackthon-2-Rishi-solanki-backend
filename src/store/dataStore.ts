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
  }

  public getUser(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  public getListing(listingId: string): Listing | undefined {
    return this.listings.find((l) => l.id === listingId);
  }

  public getRequest(requestId: string): Request | undefined {
    return this.requests.find((r) => r.id === requestId);
  }

  public getPlan(planId: string): Plan | undefined {
    return this.plans.find((p) => p.id === planId);
  }
}

export const db = new ServerDataStore();

