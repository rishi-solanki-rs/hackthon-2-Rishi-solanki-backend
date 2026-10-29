import { Router } from 'express';
import { db } from '../store/dataStore';
import { computeSocietyImpact } from '@sidekit/shared';

export const impactRouter = Router();

impactRouter.get('/', (req, res) => {
  res.json(computeSocietyImpact(db.requests, db.demand));
});
