import { describe, it, expect } from 'vitest';
import { computeUserProfile } from '../engines/profileEngine';
import { computeRequestTotal, suggestedBookingDays, bookingDays } from '../engines/planEngine';
import { SEED_USERS, SEED_LISTINGS, SEED_REQUESTS } from '../seeds';

describe('Request price math', () => {
  it('keeps unknown prices unknown and free borrows at zero', () => {
    expect(computeRequestTotal(null, 'rent', 1, '2026-11-01', '2026-11-03')).toBeNull();
    expect(computeRequestTotal(null, 'buy', 2)).toBeNull();
    expect(computeRequestTotal(null, 'borrow', 1)).toBe(0);
  });

  it('charges rent per day per unit and sales per unit', () => {
    expect(computeRequestTotal(150, 'rent', 2, '2026-11-01', '2026-11-04')).toBe(900);
    expect(computeRequestTotal(750, 'buy', 2)).toBe(1500);
    expect(bookingDays('2026-11-01', '2026-11-01')).toBe(1);
  });

  it('suggests booking length from the plan duration answer', () => {
    expect(suggestedBookingDays({ duration: 'Full weekend' })).toBe(2);
    expect(suggestedBookingDays({ duration: 'A few hours' })).toBe(1);
    expect(suggestedBookingDays(undefined)).toBe(1);
  });
});

describe('Profile badges (Detailed Design §10)', () => {
  it('awards badges deterministically from counters and listings', () => {
    const amit = SEED_USERS.find((u) => u.id === 'usr_amit')!;
    const { badges, stats } = computeUserProfile(amit, SEED_USERS, SEED_LISTINGS, SEED_REQUESTS);
    const earned = new Set(badges.filter((b) => b.earned).map((b) => b.name));
    expect(stats.itemsShared).toBe(amit.itemsSharedCount);
    expect(earned.has('helper')).toBe(true); // 12 completed loans >= 5
    expect(earned.has('toolkeeper')).toBe(true); // 7 listed items >= 5
    expect(earned.has('founding-lender')).toBe(true);
    expect(earned.has('neighbour-of-month')).toBe(false); // opt-in only
  });

  it('does not award toolkeeper below five listed items', () => {
    const priya = SEED_USERS.find((u) => u.id === 'usr_priya')!;
    const listed = SEED_LISTINGS.filter((l) => l.ownerId === 'usr_priya').length;
    const { badges } = computeUserProfile(priya, SEED_USERS, SEED_LISTINGS, SEED_REQUESTS);
    expect(badges.find((b) => b.name === 'toolkeeper')!.earned).toBe(listed >= 5);
  });
});
