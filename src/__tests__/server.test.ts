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
    expect(res.body.items.some((i: any) => i.itemKey === 'pressure_washer')).toBe(true);
  }, 15000);

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

