import { describe, it, expect } from 'vitest';
import { evaluateItemSafety, maskPhone, maskFlat, getVisibleContact } from '../engines/safetyEngine';

describe('safetyEngine — Safety Policies & Privacy Masking', () => {
  it('blocks prohibited items (Class 1)', () => {
    const checkPetrol = evaluateItemSafety('Can of petrol for generator');
    expect(checkPetrol.isBlocked).toBe(true);
    expect(checkPetrol.safetyClass).toBe('prohibited');

    const checkWeapon = evaluateItemSafety('Air pistol / weapon');
    expect(checkWeapon.isBlocked).toBe(true);
    expect(checkWeapon.safetyClass).toBe('prohibited');
  });

  it('marks consumables as buy/keep only (Class 2)', () => {
    const checkTape = evaluateItemSafety('2-inch masking tape');
    expect(checkTape.isBlocked).toBe(false);
    expect(checkTape.isConsumable).toBe(true);
    expect(checkTape.safetyClass).toBe('consumable');

    const checkPaint = evaluateItemSafety('White wall emulsion paint');
    expect(checkPaint.isConsumable).toBe(true);
  });

  it('FIX-PRIVACY-01: masks contact details until request accepted, re-masks on cancel', () => {
    const phone = '+91 98765 11001';
    const flat = 'A-402';

    // 1. Pending -> Masked
    const pendingView = getVisibleContact(phone, flat, 'pending');
    expect(pendingView.isMasked).toBe(true);
    expect(pendingView.phone).toBe('+91 98765 •••••');
    expect(pendingView.flat).toBe('Flat •••');

    // 2. Accepted -> Revealed
    const acceptedView = getVisibleContact(phone, flat, 'accepted');
    expect(acceptedView.isMasked).toBe(false);
    expect(acceptedView.phone).toBe(phone);
    expect(acceptedView.flat).toBe(flat);

    // 3. Handed Over -> Revealed
    const handoverView = getVisibleContact(phone, flat, 'handed_over');
    expect(handoverView.isMasked).toBe(false);

    // 4. Cancelled -> Re-masked
    const cancelledView = getVisibleContact(phone, flat, 'cancelled');
    expect(cancelledView.isMasked).toBe(true);
    expect(cancelledView.phone).toBe('+91 98765 •••••');
  });
});

