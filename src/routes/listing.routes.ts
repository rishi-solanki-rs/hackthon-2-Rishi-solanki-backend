import { Router, Request as ExpressRequest } from 'express';
import { db } from '../store/dataStore';
import {
  Listing,
  ListingCategory,
  ListingCondition,
  ListingMode,
  CreateListingInput,
  UpdateListingInput,
  evaluateItemSafety,
} from '@sidekit/shared';

export const listingRouter = Router();

const CATEGORIES: ListingCategory[] = ['cleaning', 'diy', 'gardening', 'electronics', 'kitchen', 'general'];
const MODES: ListingMode[] = ['lend', 'rent', 'sell_used'];
const CONDITIONS: ListingCondition[] = ['like_new', 'good', 'fair', 'unknown'];
const STATUSES: Listing['status'][] = ['active', 'paused', 'closed'];
const AUTO_HIDE_REPORT_THRESHOLD = 3;

function currentUserId(req: ExpressRequest): string {
  return (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
}

function isAdmin(userId: string): boolean {
  return db.getUser(userId)?.role === 'admin';
}

function str(v: unknown, max: number): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
}

/** null = unknown/free; undefined = invalid */
function parsePrice(v: unknown): number | null | undefined {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return undefined;
  return Math.round(n);
}

function validateModeForItem(mode: ListingMode, text: string): string | null {
  const safety = evaluateItemSafety(text);
  if (safety.isBlocked) return safety.warning || 'Item blocked by community safety policies.';
  if (safety.isConsumable && mode !== 'sell_used') {
    return 'Consumable items cannot be lent or rented; list them for sale instead.';
  }
  return null;
}

// GET /api/listings
listingRouter.get('/', (req, res) => {
  // Closed listings stay visible to their owner (My Listings), not to everyone else
  const userId = currentUserId(req);
  let listings = db.listings.filter(
    (l) => l.moderationStatus !== 'hidden_by_admin' && (l.status !== 'closed' || l.ownerId === userId)
  );

  const { query, category, mode, tower, onlyAvailable } = req.query;

  if (query && typeof query === 'string') {
    const q = query.toLowerCase().trim();
    listings = listings.filter(
      (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.itemKey.includes(q)
    );
  }

  if (category && category !== 'all') {
    listings = listings.filter((l) => l.category === category);
  }

  if (mode && mode !== 'all') {
    listings = listings.filter((l) => l.mode === mode);
  }

  if (tower && typeof tower === 'string') {
    listings = listings.filter((l) => l.ownerTower === tower);
  }

  if (onlyAvailable === 'true') {
    listings = listings.filter((l) => l.status === 'active' && l.totalQuantity > 0);
  }

  res.json(listings);
});

// GET /api/listings/:id
listingRouter.get('/:id', (req, res) => {
  const listing = db.getListing(req.params.id);
  const userId = currentUserId(req);
  if (!listing || (listing.moderationStatus === 'hidden_by_admin' && listing.ownerId !== userId && !isAdmin(userId))) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  res.json(listing);
});

// POST /api/listings
listingRouter.post('/', (req, res) => {
  const userId = currentUserId(req);
  const user = db.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: 'Unknown demo user.' });
  }
  const data: CreateListingInput = req.body || {};

  const title = str(data.title, 120);
  if (!title || title.length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters.' });
  }
  if (!CATEGORIES.includes(data.category)) {
    return res.status(400).json({ message: 'Invalid category.' });
  }
  if (!MODES.includes(data.mode)) {
    return res.status(400).json({ message: 'Invalid listing mode.' });
  }
  const condition: ListingCondition = CONDITIONS.includes(data.condition) ? data.condition : 'unknown';

  const itemKey = (str(data.itemKey, 60) || title).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const safetyError = validateModeForItem(data.mode, `${title} ${itemKey.replace(/_/g, ' ')}`);
  if (safetyError) {
    return res.status(400).json({ message: safetyError });
  }

  const price = data.mode === 'lend' ? null : parsePrice(data.price);
  if (price === undefined) {
    return res.status(400).json({ message: 'Price must be a non-negative number or left empty if unknown.' });
  }

  const quantity = Math.floor(Number(data.totalQuantity) || 1);
  if (quantity < 1 || quantity > 100) {
    return res.status(400).json({ message: 'Quantity must be between 1 and 100.' });
  }

  const newListing: Listing = {
    id: `lst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ownerId: userId,
    itemKey,
    title,
    description: str(data.description, 1000) || '',
    category: data.category,
    mode: data.mode,
    price,
    priceUnit: data.mode === 'lend' ? null : data.mode === 'sell_used' ? 'item' : 'day',
    condition,
    totalQuantity: quantity,
    status: 'active',
    moderationStatus: 'approved',
    reportsCount: 0,
    reportedBy: [],
    pickupNote: str(data.pickupNote, 300),
    comfortRules: data.comfortRules && typeof data.comfortRules === 'object' ? data.comfortRules : undefined,
    photos: Array.isArray(data.photos) && data.photos.length
      ? data.photos.filter((p) => typeof p === 'string').slice(0, 5)
      : ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500'],
    ownerDisplayName: user.displayName,
    ownerTower: user.tower,
    isSample: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveListing(newListing);
  res.status(201).json(newListing);
});

// PATCH /api/listings/:id
listingRouter.patch('/:id', (req, res) => {
  const listing = db.getListing(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  // FIX-P2-02: Ownership check
  if (listing.ownerId !== currentUserId(req)) {
    return res.status(403).json({ message: 'You can only edit your own listings.' });
  }

  const data: UpdateListingInput = req.body || {};
  const updates: Partial<Listing> = {};

  if (data.title !== undefined) {
    const title = str(data.title, 120);
    if (!title || title.length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters.' });
    }
    const safetyError = validateModeForItem(listing.mode, title);
    if (safetyError) {
      return res.status(400).json({ message: safetyError });
    }
    updates.title = title;
  }
  if (data.description !== undefined) updates.description = str(data.description, 1000) || '';
  if (data.price !== undefined && listing.mode !== 'lend') {
    const price = parsePrice(data.price);
    if (price === undefined) {
      return res.status(400).json({ message: 'Price must be a non-negative number or left empty if unknown.' });
    }
    updates.price = price;
  }
  if (data.condition !== undefined && CONDITIONS.includes(data.condition)) updates.condition = data.condition;
  if (data.totalQuantity !== undefined) {
    const quantity = Math.floor(Number(data.totalQuantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({ message: 'Quantity must be between 1 and 100.' });
    }
    updates.totalQuantity = quantity;
  }
  if (data.pickupNote !== undefined) updates.pickupNote = str(data.pickupNote, 300);
  if (data.comfortRules !== undefined && typeof data.comfortRules === 'object') updates.comfortRules = data.comfortRules;
  if (Array.isArray(data.photos)) updates.photos = data.photos.filter((p) => typeof p === 'string').slice(0, 5);

  Object.assign(listing, updates, { updatedAt: new Date().toISOString() });
  db.saveListing(listing);
  res.json(listing);
});

// PATCH /api/listings/:id/status
listingRouter.patch('/:id/status', (req, res) => {
  const listing = db.getListing(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  // FIX-P2-02: Ownership check
  if (listing.ownerId !== currentUserId(req)) {
    return res.status(403).json({ message: 'You can only change the status of your own listings.' });
  }

  const status = req.body?.status;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Status must be active, paused or closed.' });
  }
  if (status === 'active' && listing.moderationStatus === 'hidden_by_admin') {
    return res.status(400).json({ message: 'This listing was hidden by moderation and cannot be reactivated.' });
  }

  listing.status = status;
  listing.updatedAt = new Date().toISOString();
  db.saveListing(listing);
  res.json(listing);
});

// POST /api/listings/:id/report
listingRouter.post('/:id/report', (req, res) => {
  const listing = db.getListing(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const userId = currentUserId(req);
  if (listing.ownerId === userId) {
    return res.status(400).json({ message: 'You cannot report your own listing.' });
  }

  const reporters = new Set(listing.reportedBy || []);
  if (reporters.has(userId)) {
    return res.status(400).json({ message: 'You have already reported this listing.' });
  }
  reporters.add(userId);
  listing.reportedBy = Array.from(reporters);
  // Seeded listings may carry reports from before reporter ids were tracked
  listing.reportsCount = Math.max((listing.reportsCount || 0) + 1, reporters.size);

  let hidden = false;
  if (listing.reportsCount >= AUTO_HIDE_REPORT_THRESHOLD) {
    listing.moderationStatus = 'hidden_by_admin';
    hidden = true;
    db.addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_hidden`,
      userId: listing.ownerId,
      type: 'listing_hidden',
      title: 'Listing Hidden',
      message: `"${listing.title}" was hidden after multiple community reports and is awaiting admin review.`,
      link: '/my/listings',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    listing.moderationStatus = 'reported';
  }
  listing.updatedAt = new Date().toISOString();
  db.saveListing(listing);

  res.json({
    success: true,
    reportsCount: listing.reportsCount,
    hidden,
  });
});
