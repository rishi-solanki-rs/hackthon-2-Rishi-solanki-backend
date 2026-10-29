import { Router } from 'express';
import { db } from '../store/dataStore';
import { User, JoinSocietyInput } from '@sidekit/shared';

export const authRouter = Router();

const SOCIETY_INVITE_CODE = 'PALM2026';

// GET /api/auth/me
authRouter.get('/me', (req, res) => {
  const userId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  const user = db.getUser(userId) || db.users[0];
  res.json(user);
});

// POST /api/auth/switch
authRouter.post('/switch', (req, res) => {
  const { userId } = req.body || {};
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: `User ${userId} not found` });
  }
  res.json(user);
});

// POST /api/auth/join
authRouter.post('/join', (req, res) => {
  const data: JoinSocietyInput = req.body || {};
  if (typeof data.passcode !== 'string' || data.passcode.trim().toUpperCase() !== SOCIETY_INVITE_CODE) {
    return res.status(400).json({ message: `Invalid society invite code. Enter ${SOCIETY_INVITE_CODE}.` });
  }

  const name = typeof data.name === 'string' ? data.name.trim().slice(0, 80) : '';
  const phone = typeof data.phone === 'string' ? data.phone.trim().slice(0, 20) : '';
  const flat = typeof data.flat === 'string' ? data.flat.trim().slice(0, 20) : '';
  const tower = typeof data.tower === 'string' ? data.tower.trim().slice(0, 40) : '';
  if (name.length < 2 || !phone || !flat || !tower) {
    return res.status(400).json({ message: 'Name, phone, tower and flat are required.' });
  }

  const [first, last] = name.split(/\s+/);
  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    displayName: last ? `${first} ${last[0]}.` : first,
    email: typeof data.email === 'string' && data.email.trim() ? data.email.trim().slice(0, 120) : `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone,
    flat,
    tower,
    role: 'member',
    rating: 5.0,
    reviewCount: 0,
    itemsSharedCount: 0,
    totalEstimatedSavings: 0,
    joinedAt: new Date().toISOString(),
  };

  db.saveUser(newUser);
  res.status(201).json(newUser);
});
