import { Router } from 'express';
import { db } from '../store/dataStore';

export const userRouter = Router();

// GET /api/users
userRouter.get('/', (req, res) => {
  res.json(db.users);
});

// GET /api/users/:id
userRouter.get('/:id', (req, res) => {
  const user = db.getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// DELETE /api/users/:id (Account Deletion Guard)
userRouter.delete('/:id', (req, res) => {
  const userId = req.params.id;
  const hasActiveLoans = db.requests.some(
    (r) => r.requesterId === userId && (r.status === 'accepted' || r.status === 'handed_over')
  );

  if (hasActiveLoans) {
    return res.status(400).json({
      message: 'Cannot delete account while you have open loans. Please return active items first.',
    });
  }

  db.users = db.users.filter((u) => u.id !== userId);
  res.json({ success: true });
});

