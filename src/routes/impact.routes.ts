import { Router } from 'express';
import { db } from '../store/dataStore';

export const impactRouter = Router();

impactRouter.get('/', (req, res) => {
  const completed = db.requests.filter((r) => r.status === 'completed');
  const totalSavings = completed.reduce((sum, r) => sum + (r.totalPrice || 350), 184500);

  res.json({
    totalSavingsInr: totalSavings,
    co2AvoidedKg: Math.round(totalSavings * 0.08),
    totalItemsShared: completed.length + 142,
    activeHouseholds: 86,
    topSharedCategories: [
      { category: 'DIY & Tools', count: 68 },
      { category: 'Deep Cleaning', count: 42 },
      { category: 'Gardening', count: 24 },
      { category: 'Electronics & Repairs', count: 18 },
    ],
  });
});

