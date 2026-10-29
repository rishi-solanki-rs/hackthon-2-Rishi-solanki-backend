import { describe, it, expect } from 'vitest';
import { recommendForItem, repairOptionsFor, buildPlanOptionsMatrix } from '../engines/planEngine';
import { RankedOption, Plan } from '../types/plan';
import { SEED_SHOPS } from '../seeds';

const opt = (o: Partial<RankedOption>): RankedOption => ({
  id: 'x', source: 'community', title: 't', mode: 'rent', tier: 'tier2a_cost', unitPrice: 100, priceUnit: 'day',
  totalEstimatedCost: 100, priceUnknown: false, condition: 'good', conditionScore: 2, availableQuantity: 1,
  totalQuantity: 1, explanation: '', ownerDisplayName: 'Amit K.', ownerTower: 'Tower B', ...o,
});

const ctx = { isConsumable: false, durationDays: 2, taskText: 'Mount a shelf' };

describe('Item recommendation', () => {
  it('prefers a free borrow', () => {
    const r = recommendForItem([opt({ id: 'rent', totalEstimatedCost: 200 }), opt({ id: 'free', mode: 'lend', tier: 'tier1_free', totalEstimatedCost: 0 })], [], ctx);
    expect(r).toMatchObject({ method: 'borrow', optionId: 'free' });
  });

  it('picks the cheapest priced option and explains rent vs buy', () => {
    const r = recommendForItem([
      opt({ id: 'rent', mode: 'rent', totalEstimatedCost: 300 }),
      opt({ id: 'new', source: 'external_shop', mode: 'buy_new', totalEstimatedCost: 2450, ownerDisplayName: 'Hardware Mart' }),
    ], [], ctx);
    expect(r.method).toBe('rent');
    expect(r.reason).toMatch(/2 day\(s\).*cheaper than ₹2,450/);
  });

  it('never recommends a demoted (overpriced) second-hand option', () => {
    const r = recommendForItem([
      opt({ id: 'used', mode: 'sell_used', tier: 'tier2b_demoted', totalEstimatedCost: 2200 }),
      opt({ id: 'new', source: 'external_shop', mode: 'buy_new', totalEstimatedCost: 2450, ownerDisplayName: 'Hardware Mart' }),
    ], [], ctx);
    expect(r).toMatchObject({ method: 'buy_new', optionId: 'new' });
  });

  it('recommends repair when the task is about fixing a repairable item', () => {
    const repairs = repairOptionsFor('vacuum_wet_dry', SEED_SHOPS);
    expect(repairs.length).toBeGreaterThan(0);
    const r = recommendForItem([], repairs, { ...ctx, taskText: 'My vacuum is broken' });
    expect(r.method).toBe('repair');
  });

  it('falls back to notify when nothing is available', () => {
    expect(recommendForItem([], [], ctx).method).toBe('notify');
  });

  it('every missing item in a plan gets a recommendation and a photo', () => {
    const plan: Plan = {
      id: 'p', userId: 'usr_rishi', taskDescription: 'drawing', interpretedCategory: 'art', status: 'active',
      createdAt: '', updatedAt: '', clarificationAnswers: { duration: 'Full weekend' },
      items: [{ id: 'a', itemKey: 'glitter_pens', name: 'Glitter Gel Pens', neededQuantity: 1, ownedQuantity: 0, missingQuantity: 1, reason: '', isConsumable: true, safetyClass: 'consumable', source: 'template' }],
    };
    const m = buildPlanOptionsMatrix(plan, [], SEED_SHOPS, { requesterId: 'usr_rishi' });
    expect(m.durationDays).toBe(2);
    expect(m.items[0].imageUrl).toBe('/images/items/glitter_pens.webp');
    expect(m.items[0].recommendation?.method).toBe('buy_new');
  });
});
