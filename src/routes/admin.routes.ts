import { Router, Request as ExpressRequest } from 'express';
import { db } from '../store/dataStore';
import { config } from '../config';
import {
  AdminListingAction,
  AdminSettings,
  AUTO_HIDE_REPORT_THRESHOLD,
  PENDING_EXPIRY_HOURS,
  RequestStatus,
  ModerationStatus,
  applyModerationAction,
  buildAdminLeaderboard,
  buildAdminOverview,
  buildAdminUsers,
  filterAdminListings,
  filterAdminRequests,
} from '@sidekit/shared';

export const adminRouter = Router();

// Middleware: require admin role for all admin routes
adminRouter.use((req, res, next) => {
  const userId = (req.headers['x-demo-user-id'] as string) || '';
  const user = db.getUser(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
});

const queryString = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);

// GET /api/admin/overview
adminRouter.get('/overview', (_req, res) => {
  res.json(buildAdminOverview(db.users, db.listings, db.requests));
});

// GET /api/admin/queue (legacy moderation queue)
adminRouter.get('/queue', (_req, res) => {
  res.json({
    pendingListings: db.listings.filter((l) => l.moderationStatus === 'pending_review'),
    reportedListings: db.listings.filter((l) => l.moderationStatus === 'reported'),
    hiddenListings: db.listings.filter((l) => l.moderationStatus === 'hidden_by_admin'),
    totalReportsCount: db.listings.reduce((sum, l) => sum + (l.reportsCount || 0), 0),
  });
});

// GET /api/admin/listings?moderation=&category=&q=
adminRouter.get('/listings', (req, res) => {
  res.json(
    filterAdminListings(db.listings, {
      moderation: queryString(req.query.moderation) as ModerationStatus | 'all' | undefined,
      category: queryString(req.query.category),
      q: queryString(req.query.q),
    })
  );
});

// GET /api/admin/users
adminRouter.get('/users', (_req, res) => {
  res.json(buildAdminUsers(db.users, db.listings, db.requests));
});

// GET /api/admin/requests?status= (read-only, contact masked)
adminRouter.get('/requests', (req, res) => {
  res.json(filterAdminRequests(db.requests, queryString(req.query.status) as RequestStatus | 'all' | undefined));
});

// GET /api/admin/leaderboard
adminRouter.get('/leaderboard', (_req, res) => {
  res.json(buildAdminLeaderboard(db.users, db.listings, db.requests));
});

// GET /api/admin/settings
adminRouter.get('/settings', (_req, res) => {
  const settings: AdminSettings = {
    autoHideReportThreshold: AUTO_HIDE_REPORT_THRESHOLD,
    pendingExpiryHours: PENDING_EXPIRY_HOURS,
    newListingsRequireApproval: true,
    aiEnabled: config.geminiEnabled && Boolean(config.geminiApiKey),
    aiModel: config.geminiModel,
    inviteCode: 'PALM2026',
  };
  res.json(settings);
});

// POST /api/admin/listings/:id/:action
adminRouter.post('/listings/:id/:action', (req: ExpressRequest<{ id: string; action: string }>, res) => {
  const listing = db.getListing(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
  const result = applyModerationAction(listing, req.params.action as AdminListingAction, reason);
  if (!result.ok) {
    return res.status(400).json({ message: result.error });
  }
  db.saveListing(result.listing);
  db.addNotification({
    ...result.notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_mod`,
    read: false,
    createdAt: new Date().toISOString(),
  });
  res.json({ success: true, listing: result.listing });
});

// POST /api/admin/reset (FIX-ADMIN-02)
adminRouter.post('/reset', (_req, res) => {
  db.resetToDefaults();
  res.json({ success: true, message: 'All demo data reset to default seed fixtures' });
});
