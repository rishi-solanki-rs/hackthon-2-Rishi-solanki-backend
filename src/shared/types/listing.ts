export type ListingMode = 'lend' | 'rent' | 'sell_used';
export type ListingCondition = 'like_new' | 'good' | 'fair' | 'unknown';
export type ListingStatus = 'active' | 'paused' | 'closed';
export type ModerationStatus = 'approved' | 'reported' | 'hidden_by_admin';
export type ListingCategory = 'cleaning' | 'diy' | 'gardening' | 'electronics' | 'kitchen' | 'general';

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
  pickupNote?: string;
  comfortRules?: ComfortRules;
  photos: string[];
  ownerDisplayName?: string;
  ownerTower?: string;
  createdAt: string;
  updatedAt: string;
}

