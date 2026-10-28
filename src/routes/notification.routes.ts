import { Router } from 'express';
import { db } from '../store/dataStore';

export const notificationRouter = Router();

notificationRouter.get('/', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const notifs = db.notifications.filter((n) => n.userId === userId);
  res.json(notifs);
});

notificationRouter.post('/:id/read', (req, res) => {
  const target = db.notifications.find((n) => n.id === req.params.id);
  if (target) {
    target.read = true;
  }
  res.json({ success: true });
});

