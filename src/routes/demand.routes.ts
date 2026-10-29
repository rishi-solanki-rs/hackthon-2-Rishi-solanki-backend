import { Router } from 'express';
import { db } from '../store/dataStore';
import { evaluateItemSafety } from '@sidekit/shared';

export const demandRouter = Router();

// POST /api/demand — "Notify me when available" for an item with no listings
demandRouter.post('/', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  if (!db.getUser(userId)) {
    return res.status(401).json({ message: 'Unknown demo user.' });
  }

  const itemKey = typeof req.body?.itemKey === 'string' ? req.body.itemKey.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 60) : '';
  const itemName = typeof req.body?.itemName === 'string' ? req.body.itemName.trim().slice(0, 80) : '';
  if (!itemKey || !itemName) {
    return res.status(400).json({ message: 'itemKey and itemName are required.' });
  }
  if (evaluateItemSafety(itemName).isBlocked) {
    return res.status(400).json({ message: 'This item is not allowed on Sidekit.' });
  }

  const registered = db.addDemand({
    id: `dmd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    itemKey,
    itemName,
    createdAt: new Date().toISOString(),
  });

  res.status(registered ? 201 : 200).json({ registered: true, alreadyRegistered: !registered });
});
