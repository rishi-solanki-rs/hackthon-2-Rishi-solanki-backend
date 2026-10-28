import { Router } from 'express';
import { db } from '../store/dataStore';
import {
  Request,
  CreateRequestInput,
  evaluateItemSafety,
  canAcceptRequest,
  findCompetingRequestsToDecline,
} from '@sidekit/shared';

export const requestRouter = Router();

// POST /api/requests
requestRouter.post('/', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const user = db.getUser(userId);
  const data: CreateRequestInput = req.body;

  const listing = db.getListing(data.listingId);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  // FIX-REQ-07: Cannot request own listing
  if (listing.ownerId === userId) {
    return res.status(400).json({ message: 'You cannot request your own listing.' });
  }

  // Consumable guard
  const safety = evaluateItemSafety(listing.title);
  if (safety.isConsumable && (data.kind === 'borrow' || data.kind === 'rent')) {
    return res.status(400).json({ message: 'Consumable items cannot be borrowed or rented; they must be purchased.' });
  }

  let totalPrice = 0;
  if (data.kind === 'rent' && listing.price) {
    const days = data.neededFrom && data.neededTo
      ? Math.max(1, Math.round((new Date(data.neededTo).getTime() - new Date(data.neededFrom).getTime()) / (3600 * 24 * 1000)))
      : 1;
    totalPrice = listing.price * days * data.requestedQuantity;
  } else if (data.kind === 'buy' && listing.price) {
    totalPrice = listing.price * data.requestedQuantity;
  }

  const owner = db.getUser(listing.ownerId);

  const newRequest: Request = {
    id: `req_${Date.now()}`,
    listingId: listing.id,
    planId: data.planId,
    requesterId: userId,
    ownerId: listing.ownerId,
    kind: data.kind,
    requestedQuantity: data.requestedQuantity,
    neededFrom: data.neededFrom,
    neededTo: data.neededTo,
    totalPrice,
    deposit: listing.comfortRules?.depositAmount || 0,
    note: data.note,
    status: 'pending',
    listingTitle: listing.title,
    listingCategory: listing.category,
    requesterName: user?.name || 'Resident',
    requesterTower: user?.tower || 'Tower A',
    requesterPhone: user?.phone,
    requesterFlat: user?.flat,
    ownerName: owner?.name || listing.ownerDisplayName || 'Neighbour',
    ownerTower: owner?.tower || listing.ownerTower || 'Tower A',
    ownerPhone: owner?.phone,
    ownerFlat: owner?.flat,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveRequest(newRequest);
  res.status(201).json(newRequest);
});

// GET /api/requests/mine
requestRouter.get('/mine', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const mine = db.requests.filter((r) => r.requesterId === userId);
  res.json(mine);
});

// GET /api/requests/inbox
requestRouter.get('/inbox', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const incoming = db.requests.filter((r) => r.ownerId === userId);
  res.json(incoming);
});

// POST /api/requests/:id/accept
requestRouter.post('/:id/accept', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }

  const listing = db.getListing(target.listingId);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const activeOnListing = db.requests.filter((r) => r.listingId === target.listingId);

  const check = canAcceptRequest(listing.totalQuantity, activeOnListing, target);
  if (!check.canAccept) {
    return res.status(400).json({ message: check.reason || 'Insufficient inventory available' });
  }

  // Find competing requests to auto-decline (FIX-QTY-01, OD-08)
  const pendingOnListing = db.requests.filter((r) => r.listingId === target.listingId && r.status === 'pending');
  const toDecline = findCompetingRequestsToDecline(listing.totalQuantity, activeOnListing, target, pendingOnListing);

  for (const r of toDecline) {
    const idx = db.requests.findIndex((x) => x.id === r.id);
    if (idx !== -1) {
      db.requests[idx].status = 'declined';
      db.requests[idx].declineReason = 'No longer available for these dates (insufficient stock allocated to earlier booking).';
      db.requests[idx].updatedAt = new Date().toISOString();
    }
  }

  target.status = 'accepted';
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  res.json({
    accepted: target,
    autoDeclinedCount: toDecline.length,
  });
});

// POST /api/requests/:id/decline
requestRouter.post('/:id/decline', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }

  target.status = 'declined';
  target.declineReason = req.body.reason || 'Not available';
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);
  res.json(target);
});

// POST /api/requests/:id/cancel
requestRouter.post('/:id/cancel', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }

  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: 'A cancellation reason is required.' });
  }

  target.status = 'cancelled';
  target.cancellationReason = reason;
  target.cancelledBy = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  res.json(target);
});

// POST /api/requests/:id/handover
requestRouter.post('/:id/handover', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }

  target.status = 'handed_over';
  target.handoverConfirmedAt = new Date().toISOString();
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  res.json(target);
});

// POST /api/requests/:id/return
requestRouter.post('/:id/return', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }

  target.status = 'completed';
  target.returnedAt = new Date().toISOString();
  target.updatedAt = new Date().toISOString();
  if (req.body.thankYouNote) {
    target.thankYouNote = req.body.thankYouNote;
  }

  if (target.kind === 'buy') {
    const listing = db.getListing(target.listingId);
    if (listing) {
      listing.totalQuantity = Math.max(0, listing.totalQuantity - target.requestedQuantity);
      if (listing.totalQuantity === 0) {
        listing.status = 'closed';
      }
      db.saveListing(listing);
    }
  }

  db.saveRequest(target);
  res.json(target);
});

