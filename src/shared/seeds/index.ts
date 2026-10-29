import { SEED_LISTINGS } from './listings.seed';
import { SEED_SHOPS } from './shops.seed';

export * from './users.seed';
export * from './listings.seed';
export * from './shops.seed';
export * from './plans.seed';
export * from './impact.seed';
export * from './demand.seed';

export const SEED_LISTING_IDS: ReadonlySet<string> = new Set(SEED_LISTINGS.map((l) => l.id));
export const SEED_SHOP_IDS: ReadonlySet<string> = new Set(SEED_SHOPS.map((s) => s.id));
