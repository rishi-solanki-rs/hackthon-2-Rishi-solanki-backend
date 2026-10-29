import { Router, Request as ExpressRequest } from 'express';
import { db } from '../store/dataStore';
import {
  Request,
  RequestKind,
  CreateRequestInput,
  AppNotification,
  evaluateItemSafety,
  canAcceptRequest,
  findCompetingRequestsToDecline,
  maskPhone,
  maskFlat,
  computeRequestTotal,
} from '@sidekit/shared';

const PENDING_EXPIRY_MS = 72 * 3600 * 1000;

const KIND_FOR_MODE: Record<string, RequestKind> = {
  lend: 'borrow',
  rent: 'rent',
  sell_used: 'buy',
};

/**
 * Returns a sanitized request object with contact details masked
 * unless the request status is 'accepted' or 'handed_over'.
 */
function sanitizeRequest(r: Request): Request {
  const revealed = r.status === 'accepted' || r.status === 'handed_over';
  if (revealed) return r;

  return {
    ...r,
    requesterPhone: r.requesterPhone ? maskPhone(r.requesterPhone) : undefined,
    requesterFlat: r.requesterFlat ? maskFlat(r.requesterFlat) : undefined,
    ownerPhone: r.ownerPhone ? maskPhone(r.ownerPhone) : undefined,
    ownerFlat: r.ownerFlat ? maskFlat(r.ownerFlat) : undefined,
  };
}

function currentUserId(req: ExpressRequest): string {
  return (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
}

function notify(n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>, suffix: string): void {
  db.addNotification({
    ...n,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${suffix}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Pending requests the owner has not answered within 72 hours are closed
 * so the requester can look for alternatives.
 */
function expireStalePendingRequests(now = Date.now()): void {
  for (const r of db.requests) {
    if (r.status !== 'pending') continue;
    if (now - new Date(r.createdAt).getTime() < PENDING_EXPIRY_MS) continue;
    r.status = 'declined';
    r.declineReason = 'Expired — the owner did not respond within 72 hours.';
    r.updatedAt = new Date(now).toISOString();
    db.saveRequest(r);
    notify(
      {
        userId: r.requesterId,
        type: 'request_declined',
        title: 'Request Expired',
        message: `Your request for "${r.listingTitle}" expired after 72 hours without a response.`,
        link: '/my/requests',
      },
      'expired'
    );
  }
}

function isValidDate(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(new Date(v).getTime());
}

export const requestRouter = Router();

requestRouter.use((_req, _res, next) => {
  expireStalePendingRequests();
  next();
});

// POST /api/requests
requestRouter.post('/', (req, res) => {
  const userId = currentUserId(req);
  const user = db.getUser(userId);
  const data: CreateRequestInput = req.body || {};

  if (!user) {
    return res.status(401).json({ message: 'Unknown demo user.' });
  }

  const listing = db.getListing(data.listingId);
  if (!listing || ['hidden_by_admin', 'pending_review', 'rejected'].includes(listing.moderationStatus)) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  if (listing.status !== 'active') {
    return res.status(400).json({ message: 'This listing is not currently available for requests.' });
  }

  // FIX-REQ-07: Cannot request own listing
  if (listing.ownerId === userId) {
    return res.status(400).json({ message: 'You cannot request your own listing.' });
  }

  const expectedKind = KIND_FOR_MODE[listing.mode];
  if (data.kind !== expectedKind) {
    return res.status(400).json({ message: `This listing can only be requested as '${expectedKind}'.` });
  }

  // Consumable guard
  const safety = evaluateItemSafety(listing.title);
  if (safety.isBlocked) {
    return res.status(400).json({ message: safety.warning });
  }
  if (safety.isConsumable && (data.kind === 'borrow' || data.kind === 'rent')) {
    return res.status(400).json({ message: 'Consumable items cannot be borrowed or rented; they must be purchased.' });
  }

  const requestedQuantity = Number(data.requestedQuantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > listing.totalQuantity) {
    return res.status(400).json({ message: `Quantity must be between 1 and ${listing.totalQuantity}.` });
  }

  let neededFrom: string | undefined;
  let neededTo: string | undefined;
  if (data.kind !== 'buy') {
    if (!isValidDate(data.neededFrom) || !isValidDate(data.neededTo)) {
      return res.status(400).json({ message: 'Start and return dates are required for borrow and rent requests.' });
    }
    if (new Date(data.neededTo).getTime() <= new Date(data.neededFrom).getTime()) {
      return res.status(400).json({ message: 'Return date must be after the start date.' });
    }
    neededFrom = data.neededFrom;
    neededTo = data.neededTo;
  }

  // FIX-P1-02: Duplicate request prevention
  const existingRequest = db.requests.find(
    (r) =>
      r.listingId === listing.id &&
      r.requesterId === userId &&
      (r.status === 'pending' || r.status === 'accepted' || r.status === 'handed_over')
  );
  if (existingRequest) {
    return res.status(400).json({ message: 'You already have a pending or active request for this item.' });
  }

  // Unknown prices are stored as undefined (never 0) so the UI shows "Price not available"
  const total = computeRequestTotal(listing.price, data.kind, requestedQuantity, neededFrom, neededTo);
  const totalPrice = total === null ? undefined : total;

  const owner = db.getUser(listing.ownerId);
  const note = typeof data.note === 'string' ? data.note.trim().slice(0, 500) : undefined;

  const newRequest: Request = {
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    listingId: listing.id,
    planId: typeof data.planId === 'string' ? data.planId : undefined,
    requesterId: userId,
    ownerId: listing.ownerId,
    kind: data.kind,
    requestedQuantity,
    neededFrom,
    neededTo,
    totalPrice,
    deposit: listing.comfortRules?.depositAmount || 0,
    note: note || undefined,
    status: 'pending',
    listingTitle: listing.title,
    listingCategory: listing.category,
    requesterName: user.name,
    requesterTower: user.tower,
    requesterPhone: user.phone,
    requesterFlat: user.flat,
    ownerName: owner?.name || listing.ownerDisplayName || 'Neighbour',
    ownerTower: owner?.tower || listing.ownerTower || 'Tower A',
    ownerPhone: owner?.phone,
    ownerFlat: owner?.flat,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveRequest(newRequest);

  notify(
    {
      userId: listing.ownerId,
      type: 'request_received',
      title: 'New Booking Request',
      message: `${user.name} has requested "${listing.title}".`,
      link: '/inbox',
    },
    'req_received'
  );

  res.status(201).json(sanitizeRequest(newRequest));
});

// GET /api/requests/mine
requestRouter.get('/mine', (req, res) => {
  const userId = currentUserId(req);
  res.json(db.requests.filter((r) => r.requesterId === userId).map(sanitizeRequest));
});

// GET /api/requests/inbox
requestRouter.get('/inbox', (req, res) => {
  const userId = currentUserId(req);
  res.json(db.requests.filter((r) => r.ownerId === userId).map(sanitizeRequest));
});

// POST /api/requests/:id/accept
requestRouter.post('/:id/accept', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (target.ownerId !== currentUserId(req)) {
    return res.status(403).json({ message: 'Only the listing owner can accept this request.' });
  }
  if (target.status !== 'pending') {
    return res.status(400).json({ message: `Cannot accept a request in '${target.status}' status.` });
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

  target.status = 'accepted';
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  for (const r of toDecline) {
    const competing = db.getRequest(r.id);
    if (!competing || competing.status !== 'pending') continue;
    competing.status = 'declined';
    competing.declineReason = 'No longer available for these dates (insufficient stock allocated to earlier booking).';
    competing.updatedAt = new Date().toISOString();
    db.saveRequest(competing);
    notify(
      {
        userId: competing.requesterId,
        type: 'request_declined',
        title: 'Request Declined',
        message: `"${competing.listingTitle}" is no longer available for your dates.`,
        link: '/my/requests',
      },
      'auto_declined'
    );
  }

  notify(
    {
      userId: target.requesterId,
      type: 'request_accepted',
      title: 'Request Accepted!',
      message: `Your request for "${target.listingTitle}" has been accepted. Contact details are now available.`,
      link: '/my/requests',
    },
    'accepted'
  );

  res.json({
    accepted: sanitizeRequest(target),
    autoDeclinedCount: toDecline.length,
  });
});

// POST /api/requests/:id/decline
requestRouter.post('/:id/decline', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (target.ownerId !== currentUserId(req)) {
    return res.status(403).json({ message: 'Only the listing owner can decline this request.' });
  }
  if (target.status !== 'pending') {
    return res.status(400).json({ message: `Cannot decline a request in '${target.status}' status.` });
  }

  const reason = typeof req.body?.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim().slice(0, 300) : 'Not available';
  target.status = 'declined';
  target.declineReason = reason;
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  notify(
    {
      userId: target.requesterId,
      type: 'request_declined',
      title: 'Request Declined',
      message: `Your request for "${target.listingTitle}" was declined: ${reason}.`,
      link: '/my/requests',
    },
    'declined'
  );

  res.json(sanitizeRequest(target));
});

// POST /api/requests/:id/cancel
requestRouter.post('/:id/cancel', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }

  const userId = currentUserId(req);
  if (userId !== target.requesterId && userId !== target.ownerId) {
    return res.status(403).json({ message: 'Only the requester or the owner can cancel this request.' });
  }

  const reason = req.body?.reason;
  if (typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ message: 'A cancellation reason is required.' });
  }

  // FIX-P2-01: Cannot cancel after physical handover
  if (target.status === 'handed_over' || target.status === 'completed') {
    return res.status(400).json({ message: 'Cannot cancel a request after items have been physically handed over.' });
  }
  if (target.status !== 'pending' && target.status !== 'accepted') {
    return res.status(400).json({ message: `Cannot cancel a request in '${target.status}' status.` });
  }

  target.status = 'cancelled';
  target.cancellationReason = reason.trim().slice(0, 300);
  target.cancelledBy = userId;
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  const cancelledByRequester = userId === target.requesterId;
  notify(
    {
      userId: cancelledByRequester ? target.ownerId : target.requesterId,
      type: 'request_cancelled',
      title: 'Request Cancelled',
      message: cancelledByRequester
        ? `${target.requesterName || 'A requester'} cancelled their request for "${target.listingTitle}".`
        : `${target.ownerName || 'The owner'} cancelled your request for "${target.listingTitle}".`,
      link: cancelledByRequester ? '/inbox' : '/my/requests',
    },
    'cancelled'
  );

  res.json(sanitizeRequest(target));
});

// POST /api/requests/:id/handover
requestRouter.post('/:id/handover', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (target.ownerId !== currentUserId(req)) {
    return res.status(403).json({ message: 'Only the listing owner can confirm handover.' });
  }
  if (target.status !== 'accepted') {
    return res.status(400).json({ message: `Cannot confirm handover for a request in '${target.status}' status.` });
  }

  target.status = 'handed_over';
  target.handoverConfirmedAt = new Date().toISOString();
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  res.json(sanitizeRequest(target));
});

// POST /api/requests/:id/return
requestRouter.post('/:id/return', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (target.ownerId !== currentUserId(req)) {
    return res.status(403).json({ message: 'Only the listing owner can confirm the return.' });
  }
  if (target.status !== 'handed_over') {
    return res.status(400).json({ message: `Cannot complete a request in '${target.status}' status.` });
  }

  target.status = 'completed';
  target.returnedAt = new Date().toISOString();
  target.updatedAt = new Date().toISOString();
  if (typeof req.body?.thankYouNote === 'string' && req.body.thankYouNote.trim()) {
    target.thankYouNote = req.body.thankYouNote.trim().slice(0, 500);
  }

  const owner = db.getUser(target.ownerId);
  if (owner) {
    db.saveUser({ ...owner, itemsSharedCount: (owner.itemsSharedCount || 0) + 1 });
  }

  if (target.kind === 'buy') {
    const listing = db.getListing(target.listingId);
    if (listing) {
      listing.totalQuantity = Math.max(0, listing.totalQuantity - target.requestedQuantity);
      if (listing.totalQuantity === 0) {
        listing.status = 'closed';
      }
      listing.updatedAt = new Date().toISOString();
      db.saveListing(listing);
    }
  }

  db.saveRequest(target);
  res.json(sanitizeRequest(target));
});

// POST /api/requests/:id/thank-you — the borrower thanks the owner after completion
requestRouter.post('/:id/thank-you', (req, res) => {
  const target = db.getRequest(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (target.requesterId !== currentUserId(req)) {
    return res.status(403).json({ message: 'Only the requester can send a thank-you note.' });
  }
  if (target.status !== 'completed') {
    return res.status(400).json({ message: 'You can send a thank-you note once the request is completed.' });
  }
  if (target.thankYouNote) {
    return res.status(400).json({ message: 'You already sent a thank-you note for this request.' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 300) : '';
  if (message.length < 2) {
    return res.status(400).json({ message: 'Please write a short note.' });
  }

  target.thankYouNote = message;
  target.updatedAt = new Date().toISOString();
  db.saveRequest(target);

  const owner = db.getUser(target.ownerId);
  if (owner) {
    db.saveUser({
      ...owner,
      thankYouNotes: [
        ...(owner.thankYouNotes || []),
        {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          fromUserId: target.requesterId,
          fromUserName: db.getUser(target.requesterId)?.displayName || target.requesterName || 'A neighbour',
          message,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  notify(
    {
      userId: target.ownerId,
      type: 'thank_you',
      title: 'You received a thank-you note',
      message: `${target.requesterName || 'A neighbour'} thanked you for "${target.listingTitle}".`,
      link: '/me',
    },
    'thank_you'
  );

  res.json(sanitizeRequest(target));
});
