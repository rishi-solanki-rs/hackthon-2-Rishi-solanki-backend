import { Router } from 'express';
import { db } from '../store/dataStore';
import { interpretTaskWithGemini } from '../services/aiService';
import {
  evaluateLaptopRepair,
  evaluateTaskSafetyGate,
  applySafetyGate,
  normalizeChecklistItems,
  buildPlanOptionsMatrix,
  Plan,
  PlanChecklistItem,
} from '@sidekit/shared';

export const planRouter = Router();

function sanitizeAnswers(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 10)) {
    if (typeof v === 'string' && v.trim()) out[k.slice(0, 40)] = v.trim().slice(0, 100);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function catalogItemKeys(): string[] {
  const keys = new Set<string>();
  db.listings.forEach((l) => keys.add(l.itemKey));
  db.shops.forEach((s) => s.items.forEach((i) => keys.add(i.itemKey)));
  return Array.from(keys).sort();
}

// POST /api/plans/repair/evaluate — must be registered before /:id routes
planRouter.post('/repair/evaluate', (req, res) => {
  try {
    const result = evaluateLaptopRepair(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid repair evaluation input' });
  }
});

// POST /api/plans
planRouter.post('/', async (req, res) => {
  const { taskDescription } = req.body;
  const clarificationAnswers = sanitizeAnswers(req.body.clarificationAnswers);
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';

  if (!taskDescription || typeof taskDescription !== 'string' || taskDescription.trim().length < 3) {
    return res.status(400).json({ message: 'Task description must be at least 3 characters.' });
  }

  if (taskDescription.trim().length > 500) {
    return res.status(400).json({ message: 'Task description must not exceed 500 characters.' });
  }

  try {
    const task = taskDescription.trim();
    const aiResult = await interpretTaskWithGemini(task, clarificationAnswers, catalogItemKeys());
    const safetyGate = evaluateTaskSafetyGate(task, clarificationAnswers);

    const newPlan: Plan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      taskDescription: task,
      interpretedCategory: aiResult.category,
      clarificationAnswers,
      items: applySafetyGate(aiResult.items, safetyGate),
      safetyGate: safetyGate ?? undefined,
      aiSource: aiResult.source,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.savePlan(newPlan);
    res.status(201).json(newPlan);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error generating plan' });
  }
});

// GET /api/plans/:id
planRouter.get('/:id', (req, res) => {
  const plan = db.getPlan(req.params.id);
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  if (!plan || plan.userId !== userId) {
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

  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  if (plan.userId !== userId) {
    return res.status(403).json({ message: 'You can only update your own plan checklist.' });
  }

  const { items } = req.body as { items: PlanChecklistItem[] };
  if (!Array.isArray(items) || items.length > 50) {
    return res.status(400).json({ message: 'items must be an array of at most 50 entries' });
  }
  if (items.some((i) => !i || typeof i.itemKey !== 'string' || typeof i.name !== 'string' || !i.name.trim())) {
    return res.status(400).json({ message: 'Each item needs an itemKey and a name' });
  }

  plan.items = normalizeChecklistItems(items);
  plan.updatedAt = new Date().toISOString();
  db.savePlan(plan);

  res.json(plan);
});

// GET /api/plans/:id/options
planRouter.get('/:id/options', (req, res) => {
  const plan = db.getPlan(req.params.id);
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  if (!plan || plan.userId !== userId) {
    return res.status(404).json({ message: 'Plan not found' });
  }

  const user = db.getUser(userId);
  res.json(
    buildPlanOptionsMatrix(plan, db.listings, db.shops, {
      requesterTower: user?.tower,
      requesterId: userId,
      newOnly: req.query.newOnly === 'true',
    })
  );
});
