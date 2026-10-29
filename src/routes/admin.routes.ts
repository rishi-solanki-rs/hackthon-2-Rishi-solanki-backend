import { Router } from 'express';
import { db } from '../store/dataStore';

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

// GET /api/admin/queue
adminRouter.get('/queue', (req, res) => {
  const reported = db.listings.filter((l) => l.moderationStatus === 'reported');
  const hidden = db.listings.filter((l) => l.moderationStatus === 'hidden_by_admin');
  const totalReports = db.listings.reduce((sum, l) => sum + (l.reportsCount || 0), 0);

  res.json({
    reportedListings: reported,
    hiddenListings: hidden,
    totalReportsCount: totalReports,
  });
});

// POST /api/admin/listings/:id/:action
adminRouter.post('/listings/:id/:action', (req, res) => {
  const listing = db.getListing(req.params.id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const action = req.params.action;
  if (action === 'approve') {
    listing.moderationStatus = 'approved';
    listing.reportsCount = 0;
    listing.reportedBy = [];
    listing.status = 'active';
  } else if (action === 'remove') {
    listing.moderationStatus = 'hidden_by_admin';
    listing.status = 'closed';
  } else {
    return res.status(400).json({ message: "Action must be 'approve' or 'remove'." });
  }

  listing.updatedAt = new Date().toISOString();
  db.saveListing(listing);
  res.json({ success: true });
});

// POST /api/admin/reset (FIX-ADMIN-02)
adminRouter.post('/reset', (req, res) => {
  db.resetToDefaults();
  res.json({ success: true, message: 'All demo data reset to default seed fixtures' });
});

