import { Router } from 'express';
import { db } from '../store/dataStore';
import { User } from '@sidekit/shared';

export const userRouter = Router();

/**
 * Returns a public-safe user object with private contact fields omitted.
 * Phone, email and exact flat are private; only /api/auth/me returns them to the user themselves.
 */
function publicUser(user: User): Omit<User, 'phone' | 'email' | 'flat'> {
  const { phone: _phone, email: _email, flat: _flat, ...pub } = user;
  return pub;
}

// GET /api/users — public list (no phone/email/flat)
userRouter.get('/', (req, res) => {
  res.json(db.users.map(publicUser));
});

// GET /api/users/:id — public profile (no phone/email/flat)
userRouter.get('/:id', (req, res) => {
  const user = db.getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(publicUser(user));
});

// DELETE /api/users/:id (Account Deletion Guard)
userRouter.delete('/:id', (req, res) => {
  const userId = req.params.id;
  const actingUserId = (req.headers['x-demo-user-id'] as string) || 'usr_rishi';
  if (userId !== actingUserId) {
    return res.status(403).json({ message: 'You can only delete your own account.' });
  }
  if (!db.getUser(userId)) {
    return res.status(404).json({ message: 'User not found' });
  }

  const hasActiveLoans = db.requests.some(
    (r) =>
      (r.requesterId === userId || r.ownerId === userId) &&
      (r.status === 'accepted' || r.status === 'handed_over')
  );

  if (hasActiveLoans) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete account while you have open loans. Please complete or cancel active requests first.',
    });
  }

  db.deleteUser(userId);
  res.json({ success: true });
});
