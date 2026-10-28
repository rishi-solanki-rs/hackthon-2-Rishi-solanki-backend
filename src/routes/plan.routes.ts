import { Router } from 'express';
import { db } from '../store/dataStore';
import { interpretTaskWithGemini } from '../services/aiService';
import { rankOptionsForItem, evaluateLaptopRepair, Plan, PlanChecklistItem } from '@sidekit/shared';

export const planRouter = Router();

// POST /api/plans
planRouter.post('/', async (req, res) => {
  const { taskDescription, clarificationAnswers } = req.body;
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';

  if (!taskDescription) {
    return res.status(400).json({ message: 'Task description is required' });
  }

  try {
    const aiResult = await interpretTaskWithGemini(taskDescription, clarificationAnswers);

    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      userId,
      taskDescription,
      interpretedCategory: aiResult.category,
      clarificationAnswers,
      items: aiResult.items,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.plans.unshift(newPlan);
    res.status(201).json(newPlan);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error generating plan' });
  }
});

// GET /api/plans/:id
planRouter.get('/:id', (req, res) => {
  const plan = db.getPlan(req.params.id);
  if (!plan) {
    return res.status(404).json({ message: 'Plan not found' });
  }
  res.json(plan);
});

// PUT /api/plans/:id/checklist
planRouter.put('/:id/checklist', (req, res) => {
  const plan = db.getPlan(req.params.id);
  if (!plan) {
    return res.status(404).json({ message: 'Plan not found' });
  }

  const { items } = req.body as { items: PlanChecklistItem[] };
  plan.items = items.map((i) => ({
    ...i,
    missingQuantity: Math.max(0, i.neededQuantity - i.ownedQuantity),
  }));
  plan.updatedAt = new Date().toISOString();

  res.json(plan);
});

// GET /api/plans/:id/options
planRouter.get('/:id/options', (req, res) => {
  const plan = db.getPlan(req.params.id);
  if (!plan) {
    return res.status(404).json({ message: 'Plan not found' });
  }

  const newOnly = req.query.newOnly === 'true';
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const user = db.getUser(userId);

  const activeListings = db.listings.filter((l) => l.moderationStatus !== 'hidden_by_admin');

  const matrixItems = plan.items
    .filter((item) => item.missingQuantity > 0)
    .map((item) => {
      const ranked = rankOptionsForItem(item.itemKey, activeListings, db.shops, {
        neededQuantity: item.missingQuantity,
        durationDays: 1,
        requesterTower: user?.tower,
        newOnly,
      });

      return {
        itemKey: item.itemKey,
        itemName: item.name,
        neededQuantity: item.neededQuantity,
        missingQuantity: item.missingQuantity,
        isConsumable: item.isConsumable,
        rankedOptions: ranked,
      };
    });

  res.json({
    planId: plan.id,
    items: matrixItems,
  });
});

// POST /api/plans/repair/evaluate
planRouter.post('/repair/evaluate', (req, res) => {
  const result = evaluateLaptopRepair(req.body);
  res.json(result);
});

