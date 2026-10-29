import { DemandEntry, MostWantedItem, SocietyImpactStats } from '../types/api';
import { Request } from '../types/request';

// Seeded demo baselines. Every figure derived from these must be labelled SAMPLE in the UI.
export const SEED_IMPACT_BASELINE = {
  savingsInr: 184500,
  itemsShared: 142,
  activeHouseholds: 86,
  topSharedCategories: [
    { category: 'DIY & Tools', count: 68 },
    { category: 'Deep Cleaning', count: 42 },
    { category: 'Gardening', count: 24 },
    { category: 'Electronics & Repairs', count: 18 },
  ],
};

export const SEED_DEMAND_BASELINE: Array<{ itemKey: string; itemName: string; count: number }> = [
  { itemKey: 'pressure_washer', itemName: 'Pressure Washer', count: 28 },
  { itemKey: 'drill_machine', itemName: 'Hammer Drill', count: 24 },
  { itemKey: 'hedge_trimmer', itemName: 'Hedge Trimmer', count: 16 },
  { itemKey: 'step_ladder', itemName: 'Step Ladder', count: 14 },
  { itemKey: 'carpet_cleaner', itemName: 'Carpet Spot Cleaner', count: 11 },
];

export function computeMostWanted(demand: DemandEntry[], limit = 5): MostWantedItem[] {
  const byKey = new Map<string, MostWantedItem>();
  for (const b of SEED_DEMAND_BASELINE) {
    byKey.set(b.itemKey, { itemKey: b.itemKey, itemName: b.itemName, count: b.count, isSample: true });
  }
  for (const d of demand) {
    const existing = byKey.get(d.itemKey);
    if (existing) existing.count += 1;
    else byKey.set(d.itemKey, { itemKey: d.itemKey, itemName: d.itemName, count: 1, isSample: false });
  }
  return Array.from(byKey.values())
    .sort((a, b) => b.count - a.count || a.itemName.localeCompare(b.itemName))
    .slice(0, limit);
}

export function computeSocietyImpact(requests: Request[], demand: DemandEntry[]): SocietyImpactStats {
  const completed = requests.filter((r) => r.status === 'completed');
  const liveSavings = completed.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const totalSavings = SEED_IMPACT_BASELINE.savingsInr + liveSavings;
  return {
    totalSavingsInr: totalSavings,
    co2AvoidedKg: Math.round(totalSavings * 0.08),
    totalItemsShared: SEED_IMPACT_BASELINE.itemsShared + completed.length,
    activeHouseholds: SEED_IMPACT_BASELINE.activeHouseholds,
    topSharedCategories: SEED_IMPACT_BASELINE.topSharedCategories,
    mostWanted: computeMostWanted(demand),
    includesSampleData: true,
  };
}
