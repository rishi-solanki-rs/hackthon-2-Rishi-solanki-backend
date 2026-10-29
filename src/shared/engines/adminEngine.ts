import { Listing, ModerationStatus, isPubliclyVisible } from '../types/listing';
import { Request, RequestStatus } from '../types/request';
import { User } from '../types/user';
import { AppNotification } from '../types/notification';
import { DemandEntry } from '../types/api';
import { maskFlat, maskPhone } from './safetyEngine';

export const AUTO_HIDE_REPORT_THRESHOLD = 3;
export const PENDING_EXPIRY_HOURS = 72;

export type AdminListingAction = 'approve' | 'reject' | 'hide' | 'restore' | 'remove';
export const ADMIN_LISTING_ACTIONS: AdminListingAction[] = ['approve', 'reject', 'hide', 'restore', 'remove'];

export interface AdminUserRow {
  id: string;
  displayName: string;
  tower: string;
  flat: string;
  phone: string;
  role: User['role'];
  rating: number;
  reviewCount: number;
  itemsSharedCount: number;
  joinedAt: string;
  listingsCount: number;
  requestsMade: number;
  loansCompleted: number;
}

export interface AdminOverview {
  counts: {
    users: number;
    listings: number;
    activeListings: number;
    pendingApprovals: number;
    reported: number;
    hidden: number;
    requests: number;
    openRequests: number;
    wantedItems: number;
  };
  listingsByCategory: Record<string, number>;
  listingsByMode: Record<string, number>;
  requestsByStatus: Partial<Record<RequestStatus, number>>;
  recentListings: Listing[];
  recentRequests: Request[];
}

export interface AdminLeaderboard {
  lenders: (Omit<AdminUserRow, 'listingsCount' | 'requestsMade' | 'loansCompleted'> & {
    activeListings: number;
    freeListings: number;
    thankYouNotes: number;
  })[];
  towers: { tower: string; residents: number; itemsShared: number; activeListings: number }[];
  popularItems: { itemKey: string; title: string; requests: number }[];
}

export interface AdminSettings {
  autoHideReportThreshold: number;
  pendingExpiryHours: number;
  newListingsRequireApproval: boolean;
  aiEnabled: boolean;
  aiModel: string;
  inviteCode: string;
}

export interface AdminListingFilters {
  moderation?: ModerationStatus | 'all';
  category?: string;
  q?: string;
}

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

/** Admin views never reveal full phone numbers or flats. */
export function maskRequestContacts(r: Request): Request {
  return {
    ...r,
    requesterPhone: r.requesterPhone ? maskPhone(r.requesterPhone) : undefined,
    requesterFlat: r.requesterFlat ? maskFlat(r.requesterFlat) : undefined,
    ownerPhone: r.ownerPhone ? maskPhone(r.ownerPhone) : undefined,
    ownerFlat: r.ownerFlat ? maskFlat(r.ownerFlat) : undefined,
  };
}

function userBase(u: User) {
  return {
    id: u.id,
    displayName: u.displayName,
    tower: u.tower,
    flat: maskFlat(u.flat),
    phone: maskPhone(u.phone),
    role: u.role,
    rating: u.rating,
    reviewCount: u.reviewCount,
    itemsSharedCount: u.itemsSharedCount,
    joinedAt: u.joinedAt,
  };
}

export function buildAdminOverview(users: User[], listings: Listing[], requests: Request[], demand: DemandEntry[] = []): AdminOverview {
  return {
    counts: {
      users: users.filter((u) => u.role !== 'admin').length,
      listings: listings.length,
      activeListings: listings.filter(isPubliclyVisible).length,
      pendingApprovals: listings.filter((l) => l.moderationStatus === 'pending_review').length,
      reported: listings.filter((l) => l.moderationStatus === 'reported').length,
      hidden: listings.filter((l) => l.moderationStatus === 'hidden_by_admin').length,
      requests: requests.length,
      openRequests: requests.filter((r) => ['pending', 'accepted', 'handed_over'].includes(r.status)).length,
      wantedItems: buildAdminWanted(demand, users, listings).filter((w) => w.status === 'open').length,
    },
    listingsByCategory: countBy(listings, (l) => l.category),
    listingsByMode: countBy(listings, (l) => l.mode),
    requestsByStatus: countBy(requests, (r) => r.status),
    recentListings: [...listings].sort(newestFirst).slice(0, 6),
    recentRequests: [...requests].sort(newestFirst).slice(0, 6).map(maskRequestContacts),
  };
}

export function filterAdminListings(listings: Listing[], filters: AdminListingFilters = {}): Listing[] {
  let out = [...listings];
  if (filters.moderation && filters.moderation !== 'all') out = out.filter((l) => l.moderationStatus === filters.moderation);
  if (filters.category && filters.category !== 'all') out = out.filter((l) => l.category === filters.category);
  const needle = filters.q?.trim().toLowerCase();
  if (needle) {
    out = out.filter(
      (l) => l.title.toLowerCase().includes(needle) || (l.ownerDisplayName || '').toLowerCase().includes(needle) || l.itemKey.includes(needle)
    );
  }
  return out.sort(newestFirst);
}

export function buildAdminUsers(users: User[], listings: Listing[], requests: Request[]): AdminUserRow[] {
  return users.map((u) => ({
    ...userBase(u),
    listingsCount: listings.filter((l) => l.ownerId === u.id).length,
    requestsMade: requests.filter((r) => r.requesterId === u.id).length,
    loansCompleted: requests.filter((r) => r.ownerId === u.id && r.status === 'completed').length,
  }));
}

export function filterAdminRequests(requests: Request[], status?: RequestStatus | 'all'): Request[] {
  const out = status && status !== 'all' ? requests.filter((r) => r.status === status) : [...requests];
  return out.sort(newestFirst).map(maskRequestContacts);
}

export function buildAdminLeaderboard(users: User[], listings: Listing[], requests: Request[]): AdminLeaderboard {
  const members = users.filter((u) => u.role !== 'admin');
  const lenders = members
    .map((u) => ({
      ...userBase(u),
      activeListings: listings.filter((l) => l.ownerId === u.id && isPubliclyVisible(l)).length,
      freeListings: listings.filter((l) => l.ownerId === u.id && l.mode === 'lend' && isPubliclyVisible(l)).length,
      thankYouNotes: u.thankYouNotes?.length ?? 0,
    }))
    .sort((a, b) => b.itemsSharedCount - a.itemsSharedCount || b.activeListings - a.activeListings)
    .slice(0, 10);

  const towers = Object.entries(countBy(members, (u) => u.tower))
    .map(([tower, residents]) => {
      const ids = new Set(members.filter((u) => u.tower === tower).map((u) => u.id));
      return {
        tower,
        residents,
        itemsShared: members.filter((u) => ids.has(u.id)).reduce((s, u) => s + (u.itemsSharedCount || 0), 0),
        activeListings: listings.filter((l) => ids.has(l.ownerId) && isPubliclyVisible(l)).length,
      };
    })
    .sort((a, b) => b.itemsShared - a.itemsShared);

  const byId = new Map(listings.map((l) => [l.id, l]));
  const requestedKeys = countBy(
    requests.filter((r) => r.status !== 'cancelled' && byId.has(r.listingId)),
    (r) => byId.get(r.listingId)!.itemKey
  );
  const popularItems = Object.entries(requestedKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([itemKey, count]) => ({ itemKey, requests: count, title: listings.find((l) => l.itemKey === itemKey)?.title || itemKey }));

  return { lenders, towers, popularItems };
}

export interface AdminWantedItem {
  itemKey: string;
  itemName: string;
  requestCount: number;
  firstRequestedAt: string;
  lastRequestedAt: string;
  /** Residents who asked; contact details are never included. */
  requesters: { userId: string; displayName: string; tower: string; requestedAt: string }[];
  /** Public listings that now match the item. */
  availableListings: { id: string; title: string; ownerDisplayName?: string; mode: Listing['mode'] }[];
  status: 'open' | 'available';
}

/** "Notify me when available" requests grouped per item for the admin console. */
export function buildAdminWanted(demand: DemandEntry[], users: User[], listings: Listing[]): AdminWantedItem[] {
  const byKey = new Map<string, AdminWantedItem>();
  const userById = new Map(users.map((u) => [u.id, u]));
  for (const d of demand) {
    const user = userById.get(d.userId);
    const row =
      byKey.get(d.itemKey) ??
      ({
        itemKey: d.itemKey,
        itemName: d.itemName,
        requestCount: 0,
        firstRequestedAt: d.createdAt,
        lastRequestedAt: d.createdAt,
        requesters: [],
        availableListings: [],
        status: 'open',
      } as AdminWantedItem);
    row.requestCount += 1;
    if (d.createdAt < row.firstRequestedAt) row.firstRequestedAt = d.createdAt;
    if (d.createdAt > row.lastRequestedAt) row.lastRequestedAt = d.createdAt;
    row.requesters.push({ userId: d.userId, displayName: user?.displayName || 'Former resident', tower: user?.tower || '—', requestedAt: d.createdAt });
    byKey.set(d.itemKey, row);
  }
  for (const row of byKey.values()) {
    row.availableListings = listings
      .filter((l) => isPubliclyVisible(l) && l.itemKey === row.itemKey)
      .map((l) => ({ id: l.id, title: l.title, ownerDisplayName: l.ownerDisplayName, mode: l.mode }));
    row.status = row.availableListings.length > 0 ? 'available' : 'open';
    row.requesters.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }
  return [...byKey.values()].sort(
    (a, b) => Number(a.status === 'available') - Number(b.status === 'available') || b.requestCount - a.requestCount || b.lastRequestedAt.localeCompare(a.lastRequestedAt)
  );
}

export type ModerationResult =
  | { ok: true; listing: Listing; notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'> }
  | { ok: false; error: string };

/**
 * Applies an admin moderation action. Returns the updated listing and the owner notification,
 * or an error when the action is invalid (e.g. reject without a reason).
 */
export function applyModerationAction(listing: Listing, action: AdminListingAction, reason?: string, now = new Date()): ModerationResult {
  if (!ADMIN_LISTING_ACTIONS.includes(action)) {
    return { ok: false, error: `Action must be one of: ${ADMIN_LISTING_ACTIONS.join(', ')}.` };
  }
  const wasPending = listing.moderationStatus === 'pending_review';
  const next: Listing = { ...listing, reviewedAt: now.toISOString(), updatedAt: now.toISOString() };
  let notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>;

  if (action === 'approve' || action === 'restore') {
    next.moderationStatus = 'approved';
    next.reportsCount = 0;
    next.reportedBy = [];
    next.reportReasons = [];
    next.rejectionReason = undefined;
    if (action === 'restore' || next.status === 'closed') next.status = 'active';
    notification = {
      userId: listing.ownerId,
      type: 'listing_approved',
      title: wasPending ? 'Listing approved' : 'Listing restored',
      message: wasPending
        ? `"${listing.title}" was approved by the Estate Office and is now visible to neighbours.`
        : `"${listing.title}" was reviewed and is visible to neighbours again.`,
      link: `/listing/${listing.id}`,
    };
  } else if (action === 'reject') {
    const trimmed = reason?.trim().slice(0, 300);
    if (!trimmed) return { ok: false, error: 'A rejection reason is required so the owner can fix the listing.' };
    next.moderationStatus = 'rejected';
    next.rejectionReason = trimmed;
    notification = {
      userId: listing.ownerId,
      type: 'listing_rejected',
      title: 'Listing not approved',
      message: `"${listing.title}" was not approved: ${trimmed} Edit the listing to resubmit it.`,
      link: '/my/listings',
    };
  } else {
    next.moderationStatus = 'hidden_by_admin';
    if (action === 'remove') next.status = 'closed';
    notification = {
      userId: listing.ownerId,
      type: 'listing_hidden',
      title: 'Listing hidden',
      message: `"${listing.title}" was hidden by the Estate Office after review.`,
      link: '/my/listings',
    };
  }
  return { ok: true, listing: next, notification };
}

/** Moderation state for a newly created or edited listing. */
export function initialModerationStatus(ownerRole: User['role']): ModerationStatus {
  return ownerRole === 'admin' ? 'approved' : 'pending_review';
}
