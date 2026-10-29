import { Listing, ListingCondition } from '../types/listing';
import { ExternalShop, ShopItem } from '../types/shop';
import { RankedOption, OptionTier } from '../types/plan';

export interface RankingContext {
  neededQuantity: number;
  durationDays: number; // Defaults to 1 if not specified
  requesterTower?: string;
  requesterId?: string; // The requester's own listings are never offered back to them
  newOnly?: boolean;    // If true, filters out sell_used listings
}

/**
 * Returns numeric condition score for ranking tie-breaking:
 * new: 4, like_new: 3, good: 2, fair: 1, unknown: 0
 */
export function getConditionScore(condition: ListingCondition | 'new'): number {
  switch (condition) {
    case 'new':
      return 4;
    case 'like_new':
      return 3;
    case 'good':
      return 2;
    case 'fair':
      return 1;
    case 'unknown':
    default:
      return 0;
  }
}

/**
 * Ranks community listings and external partner shops for a missing checklist item.
 */
export function rankOptionsForItem(
  itemKey: string,
  communityListings: Listing[],
  externalShops: ExternalShop[],
  context: RankingContext
): RankedOption[] {
  const { neededQuantity = 1, durationDays = 1, requesterTower, requesterId, newOnly = false } = context;

  // 1. Find reference new shop item for this itemKey (if available)
  let referenceShop: ExternalShop | undefined;
  let referenceShopItem: ShopItem | undefined;

  for (const shop of externalShops) {
    const item = shop.items.find((i) => i.itemKey === itemKey && i.inStock);
    if (item) {
      if (!referenceShopItem || item.priceNew < referenceShopItem.priceNew) {
        referenceShop = shop;
        referenceShopItem = item;
      }
    }
  }

  const referenceNewPrice = referenceShopItem ? referenceShopItem.priceNew : null;

  // Filter community listings matching this itemKey and not hidden
  const matchingListings = communityListings.filter(
    (l) =>
      l.itemKey === itemKey &&
      l.status !== 'closed' &&
      l.moderationStatus !== 'hidden_by_admin' &&
      (!requesterId || l.ownerId !== requesterId)
  );

  const rawOptions: RankedOption[] = [];

  // Convert community listings
  for (const l of matchingListings) {
    if (newOnly && l.mode === 'sell_used') {
      continue; // Filtered out by user preference
    }

    const isSameTower = requesterTower && l.ownerTower ? requesterTower === l.ownerTower : false;
    const condScore = getConditionScore(l.condition);
    const isSample = l.isSample === true;

    // Case 1: Lend mode -> Free borrow (Tier 1)
    if (l.mode === 'lend') {
      rawOptions.push({
        id: `opt_${l.id}`,
        source: 'community',
        listingId: l.id,
        title: l.title,
        mode: 'lend',
        tier: 'tier1_free',
        unitPrice: 0,
        priceUnit: 'day',
        totalEstimatedCost: 0,
        priceUnknown: false,
        condition: l.condition,
        conditionScore: condScore,
        ownerDisplayName: l.ownerDisplayName || 'Neighbour',
        ownerTower: l.ownerTower || 'Society',
        isSameTower,
        availableQuantity: l.totalQuantity,
        totalQuantity: l.totalQuantity,
        isSample,
        explanation: 'Free community borrow from your society neighbours',
      });
      continue;
    }

    // Case 2: Unknown price (Tier 3)
    if (l.price === null || l.price === undefined) {
      rawOptions.push({
        id: `opt_${l.id}`,
        source: 'community',
        listingId: l.id,
        title: l.title,
        mode: l.mode,
        tier: 'tier3_unknown',
        unitPrice: null,
        priceUnit: l.priceUnit || 'day',
        totalEstimatedCost: null,
        priceUnknown: true,
        condition: l.condition,
        conditionScore: condScore,
        ownerDisplayName: l.ownerDisplayName || 'Neighbour',
        ownerTower: l.ownerTower || 'Society',
        isSameTower,
        availableQuantity: l.totalQuantity,
        totalQuantity: l.totalQuantity,
        isSample,
        warningNote: 'Price not available (ask owner)',
        explanation: 'Owner has not specified a rate. Coordinate directly after booking request.',
      });
      continue;
    }

    // Case 3: Priced Rental
    if (l.mode === 'rent') {
      const totalCost = l.price * durationDays * neededQuantity;
      rawOptions.push({
        id: `opt_${l.id}`,
        source: 'community',
        listingId: l.id,
        title: l.title,
        mode: 'rent',
        tier: 'tier2a_cost',
        unitPrice: l.price,
        priceUnit: 'day',
        totalEstimatedCost: totalCost,
        priceUnknown: false,
        condition: l.condition,
        conditionScore: condScore,
        ownerDisplayName: l.ownerDisplayName || 'Neighbour',
        ownerTower: l.ownerTower || 'Society',
        isSameTower,
        availableQuantity: l.totalQuantity,
        totalQuantity: l.totalQuantity,
        isSample,
        explanation: `Rent from neighbour at ₹${l.price}/day for ${durationDays} day(s)`,
      });
      continue;
    }

    // Case 4: Sell Used
    if (l.mode === 'sell_used') {
      const totalCost = l.price * neededQuantity;
      const isDemoted = referenceNewPrice !== null && l.price > 0.7 * referenceNewPrice;

      rawOptions.push({
        id: `opt_${l.id}`,
        source: 'community',
        listingId: l.id,
        title: l.title,
        mode: 'sell_used',
        tier: isDemoted ? 'tier2b_demoted' : 'tier2a_cost',
        unitPrice: l.price,
        priceUnit: 'item',
        totalEstimatedCost: totalCost,
        priceUnknown: false,
        condition: l.condition,
        conditionScore: condScore,
        ownerDisplayName: l.ownerDisplayName || 'Neighbour',
        ownerTower: l.ownerTower || 'Society',
        isSameTower,
        availableQuantity: l.totalQuantity,
        totalQuantity: l.totalQuantity,
        isSample,
        warningNote: isDemoted ? 'High second-hand price vs new (exceeds 70% of brand-new retail price)' : undefined,
        explanation: isDemoted
          ? 'Pre-owned listing priced near brand new retail price'
          : `Affordable pre-owned item (${Math.round((l.price / (referenceNewPrice || l.price)) * 100)}% of new price)`,
      });
    }
  }

  // Add external shop partner option (if available)
  let shopOption: RankedOption | undefined;
  if (referenceShop && referenceShopItem) {
    const totalCost = referenceShopItem.priceNew * neededQuantity;
    shopOption = {
      id: `shop_${referenceShop.id}_${referenceShopItem.itemKey}`,
      source: 'external_shop',
      shopId: referenceShop.id,
      title: `${referenceShopItem.itemName} (Brand New)`,
      mode: 'buy_new',
      tier: 'tier2a_cost',
      unitPrice: referenceShopItem.priceNew,
      priceUnit: 'item',
      totalEstimatedCost: totalCost,
      priceUnknown: false,
      condition: 'new',
      conditionScore: getConditionScore('new'),
      ownerDisplayName: referenceShop.name,
      ownerTower: `${referenceShop.distanceKm} km away`,
      isSameTower: false,
      availableQuantity: 99,
      totalQuantity: 99,
      isSample: referenceShop.isSample === true,
      explanation: `Buy brand new from verified neighbourhood store: ${referenceShop.name} (${referenceShop.address})`,
      shopAddress: referenceShop.address,
      shopPhone: referenceShop.phone,
    };
  }

  // Sort helper within a cost-ranked set
  const sortComparator = (a: RankedOption, b: RankedOption): number => {
    // 1. Cost (Ascending)
    const costA = a.totalEstimatedCost ?? Infinity;
    const costB = b.totalEstimatedCost ?? Infinity;
    if (costA !== costB) {
      return costA - costB;
    }

    // 2. Condition Score (Descending)
    if (a.conditionScore !== b.conditionScore) {
      return b.conditionScore - a.conditionScore;
    }

    // 3. Proximity (Same tower first)
    const towerA = a.isSameTower ? 1 : 0;
    const towerB = b.isSameTower ? 1 : 0;
    if (towerA !== towerB) {
      return towerB - towerA;
    }

    // 4. Stable tie-break by ID
    return a.id.localeCompare(b.id);
  };

  // Group into tiers
  const tier1 = rawOptions.filter((o) => o.tier === 'tier1_free').sort(sortComparator);
  const tier2aListings = rawOptions.filter((o) => o.tier === 'tier2a_cost');
  const tier2bDemoted = rawOptions.filter((o) => o.tier === 'tier2b_demoted').sort(sortComparator);
  const tier3Unknown = rawOptions.filter((o) => o.tier === 'tier3_unknown').sort(sortComparator);

  // Combine Tier 2A items with Shop New
  const tier2aAll = [...tier2aListings];
  if (shopOption) {
    tier2aAll.push(shopOption);
  }
  tier2aAll.sort(sortComparator);

  // Note on Tier 2B: Demoted used items are explicitly ranked below Shop New option
  // Assemble final hierarchy: Tier 1 -> Tier 2A -> Tier 2B -> Tier 3
  return [...tier1, ...tier2aAll, ...tier2bDemoted, ...tier3Unknown];
}

