import { Router } from 'express';
import { db } from '../store/dataStore';
import { Listing, CreateListingInput, evaluateItemSafety } from '@sidekit/shared';

export const listingRouter = Router();

// GET /api/listings
listingRouter.get('/', (req, res) => {
  let listings = db.listings.filter((l) => l.moderationStatus !== 'hidden_by_admin');

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
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  res.json(listing);
});

// POST /api/listings
listingRouter.post('/', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const user = db.getUser(userId);
  const data: CreateListingInput = req.body;

  const safety = evaluateItemSafety(data.title);
  if (safety.isBlocked) {
    return res.status(400).json({ message: safety.warning || 'Item blocked by community safety policies.' });
  }

  const newListing: Listing = {
    id: `lst_${Date.now()}`,
    ownerId: userId,
    itemKey: data.itemKey || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    title: data.title,
    description: data.description,
    category: data.category,
    mode: data.mode,
    price: data.price !== undefined ? data.price : null,
    priceUnit: data.priceUnit || (data.mode === 'sell_used' ? 'item' : 'day'),
    condition: data.condition,
    totalQuantity: Math.max(1, data.totalQuantity || 1),
    status: 'active',
    moderationStatus: 'approved',
    reportsCount: 0,
    pickupNote: data.pickupNote,
    comfortRules: data.comfortRules,
    photos: data.photos && data.photos.length ? data.photos : ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500'],
    ownerDisplayName: user?.displayName || 'Resident',
    ownerTower: user?.tower || 'Tower A',
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

  Object.assign(listing, req.body, { updatedAt: new Date().toISOString() });
  db.saveListing(listing);
  res.json(listing);
});

// PATCH /api/listings/:id/status
listingRouter.patch('/:id/status', (req, res) => {
  const listing = db.getListing(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  listing.status = req.body.status;
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

  listing.reportsCount = (listing.reportsCount || 0) + 1;
  let hidden = false;

  if (listing.reportsCount >= 3) {
    listing.moderationStatus = 'hidden_by_admin';
    hidden = true;
  } else {
    listing.moderationStatus = 'reported';
  }
  db.saveListing(listing);

  res.json({
    success: true,
    reportsCount: listing.reportsCount,
    hidden,
  });
});

