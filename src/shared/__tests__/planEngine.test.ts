import { describe, it, expect } from 'vitest';
import {
  evaluateTaskSafetyGate,
  applySafetyGate,
  normalizeChecklistItems,
  buildPlanOptionsMatrix,
} from '../engines/planEngine';
import { Plan, PlanChecklistItem } from '../types/plan';
import { SEED_LISTINGS, SEED_SHOPS } from '../seeds';

function item(itemKey: string, name: string, extra: Partial<PlanChecklistItem> = {}): PlanChecklistItem {
  return {
    id: `i_${itemKey}`,
    itemKey,
    name,
    neededQuantity: 1,
    ownedQuantity: 0,
    missingQuantity: 1,
    reason: 'test',
    isConsumable: false,
    safetyClass: 'none',
    source: 'template',
    ...extra,
  };
}

const shelfItems = [
  item('drill_machine', 'Hammer Drill Machine'),
  item('spirit_level', 'Spirit Level'),
  item('screws_plugs', 'Wall Plugs & Screws Set', { isConsumable: true, safetyClass: 'consumable' }),
];

describe('Task safety gate (FIX-SAFETY-01, E-10)', () => {
  it('hollow wall + heavy load hides DIY fastening rows', () => {
    const gate = evaluateTaskSafetyGate('Install a bookshelf', { wall_type: 'hollow', shelf_load: 'heavy' });
    expect(gate?.flags).toEqual(['wall_load']);
    expect(gate?.message).toMatch(/> 15 kg/);
    const kept = applySafetyGate(shelfItems, gate);
    expect(kept.map((i) => i.itemKey)).toEqual(['spirit_level']);
  });

  it('unknown wall counts as hollow', () => {
    expect(evaluateTaskSafetyGate('Mount shelf', { wall_type: 'unsure', shelf_load: 'heavy' })?.flags).toContain('wall_load');
  });

  it('unanswered wall type on a heavy mounting task counts as unknown (hollow)', () => {
    expect(evaluateTaskSafetyGate('Install a heavy bookshelf on the bedroom wall', {})?.flags).toContain('wall_load');
    expect(evaluateTaskSafetyGate('Install a heavy bookshelf', { wall_type: 'brick' })).toBeNull();
    expect(evaluateTaskSafetyGate('Heavy balcony deep clean', {})).toBeNull();
  });

  it('brick wall or light load does not trigger the gate', () => {
    expect(evaluateTaskSafetyGate('Mount shelf', { wall_type: 'brick', shelf_load: 'heavy' })).toBeNull();
    expect(evaluateTaskSafetyGate('Mount shelf', { wall_type: 'hollow', shelf_load: 'light' })).toBeNull();
  });

  it('electrical and gas work suppress every tool row', () => {
    const electrical = evaluateTaskSafetyGate('Rewire the bedroom switchboard');
    expect(electrical?.flags).toContain('electrical');
    expect(electrical?.suppressAllTools).toBe(true);
    expect(applySafetyGate(shelfItems, electrical)).toHaveLength(0);
    expect(evaluateTaskSafetyGate('Fix gas pipe leak in kitchen')?.flags).toContain('gas');
  });

  it('ordinary tasks mentioning electric tools are not gated', () => {
    expect(evaluateTaskSafetyGate('Trim hedges with an electric trimmer and extension cord')).toBeNull();
  });
});

describe('Checklist normalization', () => {
  it('recomputes missing quantity, enforces consumables and drops prohibited items', () => {
    const normalized = normalizeChecklistItems([
      item('tape', 'Masking Tape', { neededQuantity: 3, ownedQuantity: 1 }),
      item('petrol', 'Petrol can'),
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].missingQuantity).toBe(2);
    expect(normalized[0].isConsumable).toBe(true);
    expect(normalized[0].safetyClass).toBe('consumable');
  });
});

describe('Plan options matrix', () => {
  const basePlan: Plan = {
    id: 'plan_t',
    userId: 'usr_rishi',
    taskDescription: 'Mount shelf',
    interpretedCategory: 'diy',
    items: shelfItems,
    status: 'active',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  it('never offers borrow/rent options for consumables and marks seeded options SAMPLE', () => {
    const matrix = buildPlanOptionsMatrix(basePlan, SEED_LISTINGS, SEED_SHOPS, { requesterTower: 'Tower A' });
    const screws = matrix.items.find((i) => i.itemKey === 'screws_plugs')!;
    expect(screws.rankedOptions.length).toBeGreaterThan(0);
    expect(screws.rankedOptions.every((o) => o.mode !== 'lend' && o.mode !== 'rent')).toBe(true);
    const drill = matrix.items.find((i) => i.itemKey === 'drill_machine')!;
    expect(drill.rankedOptions.every((o) => o.isSample === true)).toBe(true);
  });

  it("never offers the requester's own listings back to them (BUG-P0-01)", () => {
    const matrix = buildPlanOptionsMatrix(
      { ...basePlan, items: [item('extension_cord', 'Extension Reel'), item('drill_machine', 'Hammer Drill')] },
      SEED_LISTINGS,
      SEED_SHOPS,
      { requesterId: 'usr_rishi' }
    );
    const allOwners = matrix.items.flatMap((i) => i.rankedOptions).map((o) => o.listingId && SEED_LISTINGS.find((l) => l.id === o.listingId)?.ownerId);
    expect(allOwners).not.toContain('usr_rishi');
    const cord = matrix.items.find((i) => i.itemKey === 'extension_cord')!;
    expect(cord.requesterListsItem).toBe(true);
    // Rishi's only cord is excluded, but the hardware shop option remains
    expect(cord.rankedOptions.every((o) => o.source === 'external_shop')).toBe(true);
  });

  it('excludes gated rows and reports them as suppressed', () => {
    const matrix = buildPlanOptionsMatrix(
      { ...basePlan, clarificationAnswers: { wall_type: 'hollow', shelf_load: 'heavy' } },
      SEED_LISTINGS,
      SEED_SHOPS
    );
    expect(matrix.safetyGate?.flags).toContain('wall_load');
    expect(matrix.items.map((i) => i.itemKey)).toEqual(['spirit_level']);
    expect(matrix.suppressedItemNames).toEqual(['Hammer Drill Machine', 'Wall Plugs & Screws Set']);
  });
});
