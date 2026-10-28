import { Router } from 'express';
import { db } from '../store/dataStore';
import { User, JoinSocietyInput } from '@sidekit/shared';

export const authRouter = Router();

// GET /api/auth/me
authRouter.get('/me', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const user = db.getUser(userId) || db.users[0];
  res.json(user);
});

// POST /api/auth/switch
authRouter.post('/switch', (req, res) => {
  const { userId } = req.body;
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: `User ${userId} not found` });
  }
  res.json(user);
});

// POST /api/auth/join
authRouter.post('/join', (req, res) => {
  const data: JoinSocietyInput = req.body;
  if (!data.passcode || data.passcode.trim().toUpperCase() !== 'PALM2026') {
    return res.status(400).json({ message: 'Invalid society invite code. Enter PALM2026.' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name: data.name,
    displayName: `${data.name.split(' ')[0]} ${data.name.split(' ')[1] ? data.name.split(' ')[1][0] + '.' : ''}`,
    email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: data.phone,
    flat: data.flat,
    tower: data.tower,
    role: 'member',
    rating: 5.0,
    reviewCount: 0,
    itemsSharedCount: 0,
    totalEstimatedSavings: 0,
    joinedAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  res.status(201).json(newUser);
});

