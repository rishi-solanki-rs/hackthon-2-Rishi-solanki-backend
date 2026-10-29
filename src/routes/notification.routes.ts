import { Router } from 'express';
import { db } from '../store/dataStore';

export const notificationRouter = Router();

notificationRouter.get('/', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const notifs = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(notifs);
});

notificationRouter.post('/:id/read', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const target = db.notifications.find((n) => n.id === req.params.id);
  if (!target || target.userId !== userId) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  db.markNotificationRead(target.id);
  res.json({ success: true });
});
