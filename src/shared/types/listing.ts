export type ListingMode = 'lend' | 'rent' | 'sell_used';
export type ListingCondition = 'like_new' | 'good' | 'fair' | 'unknown';
export type ListingStatus = 'active' | 'paused' | 'closed';
// pending_review: new resident listing awaiting admin approval; rejected: admin declined it
export type ModerationStatus = 'pending_review' | 'approved' | 'rejected' | 'reported' | 'hidden_by_admin';
export type ListingCategory =
  | 'diy'
  | 'art'
  | 'party'
  | 'cleaning'
  | 'gardening'
  | 'kitchen'
  | 'electronics'
  | 'photo'
  | 'moving'
  | 'sports'
  | 'general';

export const LISTING_CATEGORIES: ListingCategory[] = [
  'diy', 'art', 'party', 'cleaning', 'gardening', 'kitchen', 'electronics', 'photo', 'moving', 'sports', 'general',
];

/** Listings visible to the community in browse, options and public profiles. */
export function isPubliclyVisible(l: { status: string; moderationStatus: ModerationStatus }): boolean {
  return l.status === 'active' && (l.moderationStatus === 'approved' || l.moderationStatus === 'reported');
}

export interface ComfortRules {
  noCommercialUse?: boolean;
  returnClean?: boolean;
  sameDayNotice?: boolean;
  depositRequired?: boolean;
  depositAmount?: number;
}

export interface Listing {
  id: string;
  ownerId: string;
  itemKey: string;
  title: string;
  description: string;
  category: ListingCategory;
  mode: ListingMode;
  price: number | null; // null for free lend (Tier 1) OR unknown price (Tier 3)
  priceUnit: 'day' | 'item' | null;
  condition: ListingCondition;
  totalQuantity: number;
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  reportsCount: number;
  reportedBy?: string[]; // Distinct reporter user ids; 3 distinct reports auto-hide the listing
  reportReasons?: string[];
  rejectionReason?: string;
  reviewedAt?: string;
  imageUrl?: string; // Derived from the catalog; illustrative, not the owner's actual item
  pickupNote?: string;
  comfortRules?: ComfortRules;
  photos: string[];
  ownerDisplayName?: string;
  ownerTower?: string;
  isSample?: boolean; // Seeded demo record; UI must show a SAMPLE badge
  createdAt: string;
  updatedAt: string;
}

