import { ListingCategory, ListingMode, ListingCondition, ComfortRules, Listing } from './listing';
import { RequestKind } from './request';

export interface ListingSearchFilters {
  query?: string;
  category?: ListingCategory | 'all';
  mode?: ListingMode | 'all';
  tower?: string;
  onlyAvailable?: boolean;
  ownerId?: string; // When it is the current user, their closed listings are included too
}

export interface CreateListingInput {
  itemKey: string;
  title: string;
  description: string;
  category: ListingCategory;
  mode: ListingMode;
  price?: number | null;
  priceUnit?: 'day' | 'item' | null;
  condition: ListingCondition;
  totalQuantity: number;
  pickupNote?: string;
  comfortRules?: ComfortRules;
  photos?: string[];
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  price?: number | null;
  priceUnit?: 'day' | 'item' | null;
  condition?: ListingCondition;
  totalQuantity?: number;
  pickupNote?: string;
  comfortRules?: ComfortRules;
  photos?: string[];
}

export interface CreateRequestInput {
  listingId: string;
  planId?: string;
  kind: RequestKind;
  requestedQuantity: number;
  neededFrom?: string;
  neededTo?: string;
  note?: string;
}

export interface JoinSocietyInput {
  passcode: string;
  name: string;
  email: string;
  phone: string;
  tower: string;
  flat: string;
}

export interface DemandEntry {
  id: string;
  userId: string;
  itemKey: string;
  itemName: string;
  createdAt: string;
}

export interface MostWantedItem {
  itemKey: string;
  itemName: string;
  count: number;
  isSample: boolean; // Includes seeded baseline demand
}

export interface SocietyImpactStats {
  totalSavingsInr: number;
  co2AvoidedKg: number;
  totalItemsShared: number;
  activeHouseholds: number;
  topSharedCategories: Array<{ category: string; count: number }>;
  mostWanted: MostWantedItem[];
  includesSampleData: boolean;
}

export interface AdminQueueData {
  pendingListings: Listing[];
  reportedListings: Listing[];
  hiddenListings: Listing[];
  totalReportsCount: number;
}

