import { describe, it, expect } from 'vitest';
import {
  intervalsOverlap,
  getPeakAllocatedQuantity,
  getAvailableQuantity,
  canAcceptRequest,
  findCompetingRequestsToDecline,
} from '../engines/allocationEngine';
import { Request } from '../types/request';

describe('allocationEngine — Half-Open Intervals & Stock Allocation', () => {
  it('correctly calculates half-open interval overlap [A, B)', () => {
    // Overlapping: [10, 14) and [12, 16) -> overlap
    expect(intervalsOverlap('2026-10-29T10:00:00Z', '2026-10-29T14:00:00Z', '2026-10-29T12:00:00Z', '2026-10-29T16:00:00Z')).toBe(true);

    // Non-overlapping abutment: [10, 14) and [14, 18) -> NO overlap in half-open interval
    expect(intervalsOverlap('2026-10-29T10:00:00Z', '2026-10-29T14:00:00Z', '2026-10-29T14:00:00Z', '2026-10-29T18:00:00Z')).toBe(false);

    // Disjoint: [10, 12) and [14, 16) -> NO overlap
    expect(intervalsOverlap('2026-10-29T10:00:00Z', '2026-10-29T12:00:00Z', '2026-10-29T14:00:00Z', '2026-10-29T16:00:00Z')).toBe(false);
  });

  it('FIX-QTY-01: multi-quantity allocation and smart auto-decline', () => {
    // 4 chairs total (Amit K.)
    const totalQuantity = 4;
    const reqA: Request = {
      id: 'req_A',
      listingId: 'lst_chairs',
      requesterId: 'usr_rishi',
      ownerId: 'usr_amit',
      kind: 'borrow',
      requestedQuantity: 2,
      neededFrom: '2026-10-31T18:00:00Z',
      neededTo: '2026-10-31T22:00:00Z',
      status: 'pending',
      createdAt: '2026-10-28T10:00:00Z',
      updatedAt: '2026-10-28T10:00:00Z',
    };

    const reqB: Request = {
      id: 'req_B',
      listingId: 'lst_chairs',
      requesterId: 'usr_deepa',
      ownerId: 'usr_amit',
      kind: 'borrow',
      requestedQuantity: 2,
      neededFrom: '2026-10-31T19:00:00Z',
      neededTo: '2026-10-31T23:00:00Z',
      status: 'pending',
      createdAt: '2026-10-28T10:05:00Z',
      updatedAt: '2026-10-28T10:05:00Z',
    };

    const reqC: Request = {
      id: 'req_C',
      listingId: 'lst_chairs',
      requesterId: 'usr_vikram',
      ownerId: 'usr_amit',
      kind: 'borrow',
      requestedQuantity: 3,
      neededFrom: '2026-10-31T18:30:00Z',
      neededTo: '2026-10-31T21:00:00Z',
      status: 'pending',
      createdAt: '2026-10-28T10:10:00Z',
      updatedAt: '2026-10-28T10:10:00Z',
    };

    // Owner accepts Req A (2 chairs)
    const checkA = canAcceptRequest(totalQuantity, [], reqA);
    expect(checkA.canAccept).toBe(true);

    const activeAfterA: Request[] = [{ ...reqA, status: 'accepted' }];

    // Req B requires 2 chairs. 4 total - 2 allocated = 2 available. Can still be accepted!
    const availableForB = getAvailableQuantity(totalQuantity, activeAfterA, reqB.neededFrom!, reqB.neededTo!);
    expect(availableForB).toBe(2);

    // Req C requires 3 chairs. 4 total - 2 allocated = 2 available. 2 < 3 -> must be auto-declined!
    const toDecline = findCompetingRequestsToDecline(totalQuantity, [], reqA, [reqB, reqC]);
    expect(toDecline.map((r) => r.id)).toEqual(['req_C']);
  });

  it('FIX-QTY-02: non-overlapping bookings on single-stock item both accepted', () => {
    const totalQuantity = 1;
    const req1: Request = {
      id: 'req_1',
      listingId: 'lst_drill_free',
      requesterId: 'usr_rishi',
      ownerId: 'usr_amit',
      kind: 'borrow',
      requestedQuantity: 1,
      neededFrom: '2026-10-31T10:00:00Z',
      neededTo: '2026-10-31T14:00:00Z',
      status: 'accepted',
      createdAt: '2026-10-28T10:00:00Z',
      updatedAt: '2026-10-28T10:00:00Z',
    };

    const req2: Request = {
      id: 'req_2',
      listingId: 'lst_drill_free',
      requesterId: 'usr_priya',
      ownerId: 'usr_amit',
      kind: 'borrow',
      requestedQuantity: 1,
      neededFrom: '2026-10-31T15:00:00Z',
      neededTo: '2026-10-31T19:00:00Z',
      status: 'pending',
      createdAt: '2026-10-28T10:05:00Z',
      updatedAt: '2026-10-28T10:05:00Z',
    };

    // Since req 2 starts at 15:00 and req 1 ends at 14:00, no overlap!
    const availableForReq2 = getAvailableQuantity(totalQuantity, [req1], req2.neededFrom!, req2.neededTo!);
    expect(availableForReq2).toBe(1);

    const toDecline = findCompetingRequestsToDecline(totalQuantity, [req1], req1, [req2]);
    expect(toDecline).toHaveLength(0); // req2 is NOT auto-declined!
  });
});

