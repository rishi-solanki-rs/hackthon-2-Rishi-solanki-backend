export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'handed_over'
  | 'completed';

export type RequestKind = 'borrow' | 'rent' | 'buy';

export interface Request {
  id: string;
  listingId: string;
  planId?: string;
  requesterId: string;
  ownerId: string;
  kind: RequestKind;
  requestedQuantity: number;
  neededFrom?: string; // ISO date string (YYYY-MM-DD)
  neededTo?: string;   // ISO date string (YYYY-MM-DD)
  totalPrice?: number; // Total calculated in INR
  deposit?: number;
  note?: string;
  status: RequestStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  declineReason?: string;
  handoverConfirmedAt?: string;
  returnedAt?: string;
  thankYouNote?: string;
  createdAt: string;
  updatedAt: string;
  
  // Hydrated helper fields
  listingTitle?: string;
  listingCategory?: string;
  requesterName?: string;
  requesterTower?: string;
  requesterPhone?: string; // Revealed only if accepted/handed_over
  requesterFlat?: string;  // Revealed only if accepted/handed_over
  ownerName?: string;
  ownerTower?: string;
  ownerPhone?: string;     // Revealed only if accepted/handed_over
  ownerFlat?: string;      // Revealed only if accepted/handed_over
}

