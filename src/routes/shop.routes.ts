import { Router } from 'express';
import { db } from '../store/dataStore';

export const shopRouter = Router();

shopRouter.get('/', (req, res) => {
  res.json(db.shops);
});

