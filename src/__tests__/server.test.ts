import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { db } from '../store/dataStore';

describe('Sidekit Backend API Endpoints', () => {
  beforeEach(() => {
    db.resetToDefaults();
  });

  it('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('sidekit-server');
  });

  it('GET /api/auth/me returns active demo persona', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-demo-user-id', 'usr_rishi');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('usr_rishi');
    expect(res.body.displayName).toBe('Rishi S.');
  });

  it('POST /api/plans generates checklist items via fallback/Gemini', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('x-demo-user-id', 'usr_rishi')
      .send({
        taskDescription: 'Balcony deep clean and AC outdoor unit wash',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.interpretedCategory.toLowerCase()).toContain('cleaning');
    expect(res.body.items.length).toBeGreaterThan(0);
    // Works with both Gemini (pressure_washer) and fallback template
    const hasExpectedItem = res.body.items.some(
      (i: any) => i.itemKey === 'pressure_washer' || i.name.toLowerCase().includes('pressure') || i.name.toLowerCase().includes('wash')
    );
    expect(hasExpectedItem).toBe(true);
  }, 30000); // 30s timeout to allow Gemini + fallback

  it('POST /api/listings blocks prohibited items (Class 1 Safety)', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('x-demo-user-id', 'usr_rishi')
      .send({
        title: 'Can of petrol for generator',
        category: 'general',
        mode: 'lend',
        condition: 'good',
        totalQuantity: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/safety policy/i);
  });

  it('POST /api/requests prevents requesting own listing', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('x-demo-user-id', 'usr_rishi')
      .send({
        listingId: 'lst_drill_free', // Owned by Rishi
        kind: 'borrow',
        requestedQuantity: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot request your own listing/i);
  });

  it('POST /api/requests/:id/accept auto-declines competing requests when stock is exceeded', async () => {
    // 1. Create a listing with quantity 1
    const newListingRes = await request(app)
      .post('/api/listings')
      .set('x-demo-user-id', 'usr_amit')
      .send({
        title: 'Single Item Test',
        category: 'diy',
        mode: 'lend',
        condition: 'good',
        totalQuantity: 1,
      });
    const listingId = newListingRes.body.id;
    expect(newListingRes.body.moderationStatus).toBe('pending_review');
    const approveRes = await request(app).post(`/api/admin/listings/${listingId}/approve`).set('x-demo-user-id', 'usr_admin');
    expect(approveRes.status).toBe(200);

    // 2. Request 1 by Rishi for Saturday 10:00 to 14:00
    const req1Res = await request(app)
      .post('/api/requests')
      .set('x-demo-user-id', 'usr_rishi')
      .send({
        listingId,
        kind: 'borrow',
        requestedQuantity: 1,
        neededFrom: '2026-11-01T10:00:00Z',
        neededTo: '2026-11-01T14:00:00Z',
      });
    const req1Id = req1Res.body.id;

    // 3. Competing Request 2 by Priya for overlapping Saturday 12:00 to 16:00
    const req2Res = await request(app)
      .post('/api/requests')
      .set('x-demo-user-id', 'usr_priya')
      .send({
        listingId,
        kind: 'borrow',
        requestedQuantity: 1,
        neededFrom: '2026-11-01T12:00:00Z',
        neededTo: '2026-11-01T16:00:00Z',
      });
    const req2Id = req2Res.body.id;

    // 4. Owner accepts Request 1
    const acceptRes = await request(app)
      .post(`/api/requests/${req1Id}/accept`)
      .set('x-demo-user-id', 'usr_amit');

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.accepted.status).toBe('accepted');
    expect(acceptRes.body.autoDeclinedCount).toBe(1);

    // Verify Request 2 was automatically declined
    const req2After = db.getRequest(req2Id);
    expect(req2After?.status).toBe('declined');
    expect(req2After?.declineReason).toMatch(/stock allocated to earlier booking/i);
  });
});

describe('Request lifecycle authorization, privacy and state guards', () => {
  beforeEach(() => {
    db.resetToDefaults();
  });

  const as = (userId: string) => ({ 'x-demo-user-id': userId });

  async function createPendingLadderRequest() {
    const res = await request(app)
      .post('/api/requests')
      .set(as('usr_rishi'))
      .send({ listingId: 'lst_ladder_rent', kind: 'rent', requestedQuantity: 1, neededFrom: '2026-12-01', neededTo: '2026-12-03' });
    expect(res.status).toBe(201);
    return res.body;
  }

  it('masks contacts while pending, reveals on accept and re-masks on cancel', async () => {
    const created = await createPendingLadderRequest();
    expect(created.ownerPhone).toMatch(/•••••$/);
    expect(created.ownerFlat).toBe('Flat •••');

    const ownerId = db.getRequest(created.id)!.ownerId;
    const accepted = await request(app).post(`/api/requests/${created.id}/accept`).set(as(ownerId));
    expect(accepted.status).toBe(200);
    expect(accepted.body.accepted.ownerPhone).not.toMatch(/•/);

    const cancelled = await request(app)
      .post(`/api/requests/${created.id}/cancel`)
      .set(as('usr_rishi'))
      .send({ reason: 'Plans changed' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.ownerPhone).toMatch(/•••••$/);
  });

  it('only the owner can accept, decline, hand over and complete', async () => {
    const created = await createPendingLadderRequest();
    const ownerId = db.getRequest(created.id)!.ownerId;

    expect((await request(app).post(`/api/requests/${created.id}/accept`).set(as('usr_rishi'))).status).toBe(403);
    expect((await request(app).post(`/api/requests/${created.id}/decline`).set(as('usr_priya'))).status).toBe(403);

    // Handover/return are only valid in the right order
    expect((await request(app).post(`/api/requests/${created.id}/handover`).set(as(ownerId))).status).toBe(400);
    expect((await request(app).post(`/api/requests/${created.id}/accept`).set(as(ownerId))).status).toBe(200);
    expect((await request(app).post(`/api/requests/${created.id}/return`).set(as(ownerId))).status).toBe(400);
    expect((await request(app).post(`/api/requests/${created.id}/handover`).set(as('usr_rishi'))).status).toBe(403);
    expect((await request(app).post(`/api/requests/${created.id}/handover`).set(as(ownerId))).status).toBe(200);

    const cancelAfterHandover = await request(app)
      .post(`/api/requests/${created.id}/cancel`)
      .set(as('usr_rishi'))
      .send({ reason: 'Too late' });
    expect(cancelAfterHandover.status).toBe(400);

    const done = await request(app).post(`/api/requests/${created.id}/return`).set(as(ownerId));
    expect(done.status).toBe(200);
    expect(done.body.status).toBe('completed');
  });

  it('blocks duplicates, wrong request kinds and invalid date ranges', async () => {
    await createPendingLadderRequest();
    const dup = await request(app)
      .post('/api/requests')
      .set(as('usr_rishi'))
      .send({ listingId: 'lst_ladder_rent', kind: 'rent', requestedQuantity: 1, neededFrom: '2026-12-05', neededTo: '2026-12-06' });
    expect(dup.status).toBe(400);

    const wrongKind = await request(app)
      .post('/api/requests')
      .set(as('usr_priya'))
      .send({ listingId: 'lst_ladder_rent', kind: 'borrow', requestedQuantity: 1, neededFrom: '2026-12-05', neededTo: '2026-12-06' });
    expect(wrongKind.status).toBe(400);

    const badDates = await request(app)
      .post('/api/requests')
      .set(as('usr_priya'))
      .send({ listingId: 'lst_ladder_rent', kind: 'rent', requestedQuantity: 1, neededFrom: '2026-12-06', neededTo: '2026-12-06' });
    expect(badDates.status).toBe(400);
  });

  it('expires pending requests older than 72 hours', async () => {
    const stale = db.requests.find((r) => r.id === 'req_exp_fixture')!;
    stale.createdAt = new Date(Date.now() - 73 * 3600 * 1000).toISOString();
    const res = await request(app).get('/api/requests/mine').set(as(stale.requesterId));
    const after = res.body.find((r: any) => r.id === 'req_exp_fixture');
    expect(after.status).toBe('declined');
    expect(after.declineReason).toMatch(/72 hours/);
  });

  it('notifies the requester on acceptance', async () => {
    const created = await createPendingLadderRequest();
    const ownerId = db.getRequest(created.id)!.ownerId;
    await request(app).post(`/api/requests/${created.id}/accept`).set(as(ownerId));
    const notifs = await request(app).get('/api/notifications').set(as('usr_rishi'));
    expect(notifs.body.some((n: any) => n.type === 'request_accepted' && n.message.includes(created.listingTitle))).toBe(true);
  });
});

describe('Privacy, admin and listing guards', () => {
  beforeEach(() => {
    db.resetToDefaults();
  });

  it('public user endpoints omit phone, email and flat; /auth/me keeps them', async () => {
    const list = await request(app).get('/api/users');
    expect(list.body.every((u: any) => u.phone === undefined && u.email === undefined && u.flat === undefined)).toBe(true);
    const me = await request(app).get('/api/auth/me').set('x-demo-user-id', 'usr_rishi');
    expect(me.body.phone).toBeDefined();
  });

  it('admin endpoints reject non-admins', async () => {
    expect((await request(app).get('/api/admin/queue').set('x-demo-user-id', 'usr_rishi')).status).toBe(403);
    const admin = db.users.find((u) => u.role === 'admin')!;
    expect((await request(app).get('/api/admin/queue').set('x-demo-user-id', admin.id)).status).toBe(200);
  });

  it('listing edits cannot change ownership or moderation fields', async () => {
    const res = await request(app)
      .patch('/api/listings/lst_drill_free')
      .set('x-demo-user-id', 'usr_rishi')
      .send({ ownerId: 'usr_amit', moderationStatus: 'approved', title: 'Bosch Drill (updated)' });
    expect(res.status).toBe(200);
    expect(res.body.ownerId).toBe('usr_rishi');
    expect(res.body.title).toBe('Bosch Drill (updated)');
    expect((await request(app).patch('/api/listings/lst_drill_free').set('x-demo-user-id', 'usr_amit').send({ title: 'Hijack' })).status).toBe(403);
  });

  it('consumables cannot be listed for lending', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('x-demo-user-id', 'usr_rishi')
      .send({ title: 'Wall paint 4L', category: 'diy', mode: 'lend', condition: 'good', totalQuantity: 1 });
    expect(res.status).toBe(400);
  });

  it('three distinct reporters are needed to auto-hide a listing', async () => {
    const target = db.listings.find((l) => l.id === 'lst_drill_rent')!;
    const reporters = db.users.filter((u) => u.id !== target.ownerId).slice(0, 3);
    await request(app).post(`/api/listings/${target.id}/report`).set('x-demo-user-id', reporters[0].id).send({ reason: 'x' });
    const repeat = await request(app).post(`/api/listings/${target.id}/report`).set('x-demo-user-id', reporters[0].id).send({ reason: 'x' });
    expect(repeat.status).toBe(400);
    await request(app).post(`/api/listings/${target.id}/report`).set('x-demo-user-id', reporters[1].id).send({ reason: 'x' });
    const third = await request(app).post(`/api/listings/${target.id}/report`).set('x-demo-user-id', reporters[2].id).send({ reason: 'x' });
    expect(third.body.hidden).toBe(true);
  });

  it('users can only delete their own account', async () => {
    expect((await request(app).delete('/api/users/usr_priya').set('x-demo-user-id', 'usr_rishi')).status).toBe(403);
  });
});

describe('Thank-you notes, listings visibility and profiles', () => {
  beforeEach(() => {
    db.resetToDefaults();
  });

  async function completedLadderLoan() {
    const created = await request(app)
      .post('/api/requests')
      .set('x-demo-user-id', 'usr_rishi')
      .send({ listingId: 'lst_ladder_rent', kind: 'rent', requestedQuantity: 1, neededFrom: '2026-12-01', neededTo: '2026-12-03' });
    const ownerId = db.getRequest(created.body.id)!.ownerId;
    await request(app).post(`/api/requests/${created.body.id}/accept`).set('x-demo-user-id', ownerId);
    await request(app).post(`/api/requests/${created.body.id}/handover`).set('x-demo-user-id', ownerId);
    await request(app).post(`/api/requests/${created.body.id}/return`).set('x-demo-user-id', ownerId);
    return { id: created.body.id as string, ownerId };
  }

  it('borrower thank-you note lands on the owner profile; completion counts as a loan', async () => {
    const before = db.getUser('usr_deepa')!;
    const { id, ownerId } = await completedLadderLoan();
    expect(ownerId).toBe('usr_deepa');
    expect(db.getUser(ownerId)!.itemsSharedCount).toBe(before.itemsSharedCount + 1);

    expect((await request(app).post(`/api/requests/${id}/thank-you`).set('x-demo-user-id', ownerId).send({ message: 'Self praise' })).status).toBe(403);
    const ok = await request(app).post(`/api/requests/${id}/thank-you`).set('x-demo-user-id', 'usr_rishi').send({ message: 'Sturdy ladder, thanks!' });
    expect(ok.status).toBe(200);
    expect(db.getUser(ownerId)!.thankYouNotes!.some((n) => n.message === 'Sturdy ladder, thanks!' && n.fromUserId === 'usr_rishi')).toBe(true);
    expect((await request(app).post(`/api/requests/${id}/thank-you`).set('x-demo-user-id', 'usr_rishi').send({ message: 'Again' })).status).toBe(400);
  });

  it('thank-you notes are only possible after completion', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set('x-demo-user-id', 'usr_rishi')
      .send({ listingId: 'lst_ladder_rent', kind: 'rent', requestedQuantity: 1, neededFrom: '2026-12-01', neededTo: '2026-12-03' });
    expect((await request(app).post(`/api/requests/${created.body.id}/thank-you`).set('x-demo-user-id', 'usr_rishi').send({ message: 'Early' })).status).toBe(400);
  });

  it('unpriced rentals keep an unknown total instead of zero', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('x-demo-user-id', 'usr_rishi')
      .send({ listingId: 'lst_unpriced_saw', kind: 'rent', requestedQuantity: 1, neededFrom: '2026-12-01', neededTo: '2026-12-02' });
    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBeUndefined();
  });

  it('closed listings never appear in browse, but the owner still sees them in My Listings', async () => {
    await request(app).patch('/api/listings/lst_drill_free/status').set('x-demo-user-id', 'usr_rishi').send({ status: 'closed' });
    const browse = await request(app).get('/api/listings').set('x-demo-user-id', 'usr_rishi');
    expect(browse.body.some((l: any) => l.id === 'lst_drill_free')).toBe(false);
    const mine = await request(app).get('/api/listings?ownerId=usr_rishi').set('x-demo-user-id', 'usr_rishi');
    expect(mine.body.some((l: any) => l.id === 'lst_drill_free')).toBe(true);
    const asOther = await request(app).get('/api/listings?ownerId=usr_rishi').set('x-demo-user-id', 'usr_amit');
    expect(asOther.body.some((l: any) => l.id === 'lst_drill_free')).toBe(false);
  });

  it('moderation-hidden listings cannot be edited by their owner', async () => {
    const listing = db.getListing('lst_spam_drill')!;
    listing.moderationStatus = 'hidden_by_admin';
    const res = await request(app).patch('/api/listings/lst_spam_drill').set('x-demo-user-id', listing.ownerId).send({ title: 'Totally fine drill' });
    expect(res.status).toBe(400);
  });

  it('options never include the requester\'s own listing', async () => {
    const plan = await request(app).post('/api/plans').set('x-demo-user-id', 'usr_rishi').send({ taskDescription: 'Mount shelf on wall with a drill' });
    const options = await request(app).get(`/api/plans/${plan.body.id}/options`).set('x-demo-user-id', 'usr_rishi');
    const listingIds = options.body.items.flatMap((i: any) => i.rankedOptions).map((o: any) => o.listingId).filter(Boolean);
    expect(listingIds).not.toContain('lst_drill_free');
  });

  it('profile endpoint returns deterministic counters and badges', async () => {
    const res = await request(app).get('/api/users/usr_amit/profile');
    expect(res.status).toBe(200);
    expect(res.body.badges.find((b: any) => b.name === 'helper').earned).toBe(true);
    expect(res.body.stats.activeListings).toBeGreaterThan(0);
  });
});

describe('Plans: safety gate, options scoping and demand', () => {
  beforeEach(() => {
    db.resetToDefaults();
  });

  it('heavy shelf on hollow wall hides DIY rows in checklist and options', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('x-demo-user-id', 'usr_rishi')
      .send({ taskDescription: 'Install a heavy bookshelf', clarificationAnswers: { wall_type: 'hollow', shelf_load: 'heavy' } });
    expect(res.status).toBe(201);
    expect(res.body.aiSource).toBe('template');
    expect(res.body.safetyGate.flags).toContain('wall_load');
    expect(res.body.items.some((i: any) => i.itemKey === 'drill_machine')).toBe(false);

    const options = await request(app).get(`/api/plans/${res.body.id}/options`).set('x-demo-user-id', 'usr_rishi');
    expect(options.status).toBe(200);
    expect(options.body.safetyGate.flags).toContain('wall_load');
    expect(options.body.items.some((i: any) => i.itemKey === 'drill_machine')).toBe(false);
  });

  it('plans are scoped to their owner', async () => {
    const res = await request(app).post('/api/plans').set('x-demo-user-id', 'usr_rishi').send({ taskDescription: 'Balcony deep clean' });
    expect((await request(app).get(`/api/plans/${res.body.id}`).set('x-demo-user-id', 'usr_amit')).status).toBe(404);
    expect((await request(app).get(`/api/plans/${res.body.id}/options`).set('x-demo-user-id', 'usr_amit')).status).toBe(404);
  });

  it('options mark seeded prices as SAMPLE and keep unknown prices unknown', async () => {
    const res = await request(app).post('/api/plans').set('x-demo-user-id', 'usr_priya').send({ taskDescription: 'Mount shelf on wall' });
    const options = await request(app).get(`/api/plans/${res.body.id}/options`).set('x-demo-user-id', 'usr_priya');
    const all = options.body.items.flatMap((i: any) => i.rankedOptions);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((o: any) => o.isSample === true)).toBe(true);
    for (const o of all.filter((o: any) => o.priceUnknown)) {
      expect(o.unitPrice).toBeNull();
      expect(o.totalEstimatedCost).toBeNull();
    }
  });

  it('demand registration feeds most-wanted impact stats once per user', async () => {
    const first = await request(app).post('/api/demand').set('x-demo-user-id', 'usr_rishi').send({ itemKey: 'sewing_machine', itemName: 'Sewing Machine' });
    expect(first.status).toBe(201);
    const again = await request(app).post('/api/demand').set('x-demo-user-id', 'usr_rishi').send({ itemKey: 'sewing_machine', itemName: 'Sewing Machine' });
    expect(again.body.alreadyRegistered).toBe(true);
    const impact = await request(app).get('/api/impact');
    expect(impact.body.includesSampleData).toBe(true);
    expect(Array.isArray(impact.body.mostWanted)).toBe(true);
    const wanted = await request(app).get('/api/admin/wanted').set('x-demo-user-id', 'usr_admin');
    const sewing = wanted.body.find((w: any) => w.itemKey === 'sewing_machine');
    expect(sewing.requestCount).toBe(3);
    expect(sewing.requesters.some((r: any) => r.userId === 'usr_rishi')).toBe(true);
  });

  it('member listings wait for admin approval and stay out of browse until approved', async () => {
    const created = await request(app)
      .post('/api/listings')
      .set('x-demo-user-id', 'usr_priya')
      .send({ title: 'Kids Easel', category: 'art', mode: 'lend', condition: 'good', totalQuantity: 1 });
    expect(created.status).toBe(201);
    expect(created.body.moderationStatus).toBe('pending_review');
    const id = created.body.id;

    const browse = await request(app).get('/api/listings').set('x-demo-user-id', 'usr_rishi');
    expect(browse.body.some((l: any) => l.id === id)).toBe(false);
    expect((await request(app).get(`/api/listings/${id}`).set('x-demo-user-id', 'usr_rishi')).status).toBe(404);
    expect((await request(app).get(`/api/listings/${id}`).set('x-demo-user-id', 'usr_priya')).status).toBe(200);

    const adminNotifs = await request(app).get('/api/notifications').set('x-demo-user-id', 'usr_admin');
    expect(adminNotifs.body.some((n: any) => n.type === 'listing_review')).toBe(true);

    const queue = await request(app).get('/api/admin/listings?moderation=pending_review').set('x-demo-user-id', 'usr_admin');
    expect(queue.body.some((l: any) => l.id === id)).toBe(true);

    expect((await request(app).post(`/api/admin/listings/${id}/reject`).set('x-demo-user-id', 'usr_admin').send({})).status).toBe(400);
    const rejected = await request(app)
      .post(`/api/admin/listings/${id}/reject`)
      .set('x-demo-user-id', 'usr_admin')
      .send({ reason: 'Please add the easel size.' });
    expect(rejected.body.listing.moderationStatus).toBe('rejected');

    const edited = await request(app)
      .patch(`/api/listings/${id}`)
      .set('x-demo-user-id', 'usr_priya')
      .send({ description: 'A3 tabletop easel, 45 cm tall.' });
    expect(edited.body.moderationStatus).toBe('pending_review');
    expect(edited.body.rejectionReason).toBeUndefined();

    await request(app).post(`/api/admin/listings/${id}/approve`).set('x-demo-user-id', 'usr_admin');
    const after = await request(app).get('/api/listings').set('x-demo-user-id', 'usr_rishi');
    expect(after.body.some((l: any) => l.id === id)).toBe(true);
    const ownerNotifs = await request(app).get('/api/notifications').set('x-demo-user-id', 'usr_priya');
    expect(ownerNotifs.body.map((n: any) => n.type)).toEqual(expect.arrayContaining(['listing_rejected', 'listing_approved']));
  });

  it('admin-created listings are approved immediately', async () => {
    const created = await request(app)
      .post('/api/listings')
      .set('x-demo-user-id', 'usr_admin')
      .send({ title: 'Clubhouse Folding Table', category: 'party', mode: 'lend', condition: 'good', totalQuantity: 2 });
    expect(created.body.moderationStatus).toBe('approved');
  });

  it('seeded pending and rejected listings are hidden from browse and requests', async () => {
    const browse = await request(app).get('/api/listings').set('x-demo-user-id', 'usr_rishi');
    expect(browse.body.some((l: any) => l.moderationStatus === 'pending_review' || l.moderationStatus === 'rejected')).toBe(false);
    const res = await request(app)
      .post('/api/requests')
      .set('x-demo-user-id', 'usr_rishi')
      .send({ listingId: 'lst_pending_cricket_kit', kind: 'rent', requestedQuantity: 1, neededFrom: '2026-11-10', neededTo: '2026-11-10' });
    expect(res.status).toBe(404);
  });

  it('admin console endpoints return masked, scoped data', async () => {
    for (const path of ['overview', 'listings', 'users', 'requests', 'leaderboard', 'settings', 'wanted']) {
      expect((await request(app).get(`/api/admin/${path}`).set('x-demo-user-id', 'usr_amit')).status).toBe(403);
      expect((await request(app).get(`/api/admin/${path}`).set('x-demo-user-id', 'usr_admin')).status).toBe(200);
    }
    const users = await request(app).get('/api/admin/users').set('x-demo-user-id', 'usr_admin');
    const rishi = users.body.find((u: any) => u.id === 'usr_rishi');
    expect(rishi.phone).not.toBe('+91 98765 11001');
    expect(rishi.email).toBeUndefined();
    const requests = await request(app).get('/api/admin/requests').set('x-demo-user-id', 'usr_admin');
    expect(requests.body.every((r: any) => !r.ownerPhone || r.ownerPhone.includes('•') || r.ownerPhone.includes('*'))).toBe(true);
    const overview = await request(app).get('/api/admin/overview').set('x-demo-user-id', 'usr_admin');
    expect(overview.body.counts.pendingApprovals).toBeGreaterThanOrEqual(3);
    const settings = await request(app).get('/api/admin/settings').set('x-demo-user-id', 'usr_admin');
    expect(JSON.stringify(settings.body)).not.toMatch(/AIza|mongodb/i);
  });
});

