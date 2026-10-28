import { describe, it, expect } from 'vitest';
import { rankOptionsForItem } from '../engines/rankingEngine';
import { Listing } from '../types/listing';
import { ExternalShop } from '../types/shop';

describe('rankingEngine — 4-Tier Recommendation & Comparator', () => {
  const mockShop: ExternalShop = {
    id: 'shop_1',
    name: 'Tool Mart',
    category: 'Hardware',
    address: 'Main Road',
    distanceKm: 1.0,
    phone: '+91 99999 11111',
    items: [
      {
        itemKey: 'drill_machine',
        itemName: 'Brand New Drill 500W',
        priceNew: 2000,
        inStock: true,
      },
    ],
  };

  const sampleListings: Listing[] = [
    {
      id: 'lst_free',
      ownerId: 'usr_1',
      itemKey: 'drill_machine',
      title: 'Free Drill',
      description: '',
      category: 'diy',
      mode: 'lend',
      price: null,
      priceUnit: null,
      condition: 'good',
      totalQuantity: 1,
      status: 'active',
      moderationStatus: 'approved',
      reportsCount: 0,
      photos: [],
      ownerTower: 'Tower A',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'lst_rent',
      ownerId: 'usr_2',
      itemKey: 'drill_machine',
      title: 'Rent Drill',
      description: '',
      category: 'diy',
      mode: 'rent',
      price: 100,
      priceUnit: 'day',
      condition: 'like_new',
      totalQuantity: 1,
      status: 'active',
      moderationStatus: 'approved',
      reportsCount: 0,
      photos: [],
      ownerTower: 'Tower B',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'lst_fair_used',
      ownerId: 'usr_3',
      itemKey: 'drill_machine',
      title: 'Affordable Used Drill',
      description: '',
      category: 'diy',
      mode: 'sell_used',
      price: 1000, // 1000 <= 0.70 * 2000 (1400) -> Tier 2A
      priceUnit: 'item',
      condition: 'good',
      totalQuantity: 1,
      status: 'active',
      moderationStatus: 'approved',
      reportsCount: 0,
      photos: [],
      ownerTower: 'Tower C',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'lst_expensive_used',
      ownerId: 'usr_4',
      itemKey: 'drill_machine',
      title: 'Overpriced Used Drill',
      description: '',
      category: 'diy',
      mode: 'sell_used',
      price: 1800, // 1800 > 0.70 * 2000 (1400) -> Tier 2B Demoted!
      priceUnit: 'item',
      condition: 'fair',
      totalQuantity: 1,
      status: 'active',
      moderationStatus: 'approved',
      reportsCount: 0,
      photos: [],
      ownerTower: 'Tower A',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'lst_unknown_price',
      ownerId: 'usr_5',
      itemKey: 'drill_machine',
      title: 'Unpriced Rental Drill',
      description: '',
      category: 'diy',
      mode: 'rent',
      price: null, // Tier 3 Unknown Price
      priceUnit: 'day',
      condition: 'good',
      totalQuantity: 1,
      status: 'active',
      moderationStatus: 'approved',
      reportsCount: 0,
      photos: [],
      ownerTower: 'Tower B',
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('ranks Tier 1 free borrow first, followed by Tier 2A, Tier 2B below Shop New, and Tier 3 at bottom', () => {
    const results = rankOptionsForItem('drill_machine', sampleListings, [mockShop], {
      neededQuantity: 1,
      durationDays: 1,
    });

    // 1. Tier 1 Free borrow
    expect(results[0].id).toBe('opt_lst_free');
    expect(results[0].tier).toBe('tier1_free');
    expect(results[0].totalEstimatedCost).toBe(0);

    // 2. Tier 2A: Rent Drill (100) -> Affordable Used (1000) -> Brand New Shop (2000)
    expect(results[1].id).toBe('opt_lst_rent');
    expect(results[1].totalEstimatedCost).toBe(100);

    expect(results[2].id).toBe('opt_lst_fair_used');
    expect(results[2].totalEstimatedCost).toBe(1000);

    expect(results[3].mode).toBe('buy_new');
    expect(results[3].totalEstimatedCost).toBe(2000);

    // 3. Tier 2B: Demoted expensive used (1800) must appear AFTER Shop New!
    expect(results[4].id).toBe('opt_lst_expensive_used');
    expect(results[4].tier).toBe('tier2b_demoted');
    expect(results[4].warningNote).toBeDefined();

    // 4. Tier 3: Unknown price at the absolute bottom
    expect(results[5].id).toBe('opt_lst_unknown_price');
    expect(results[5].tier).toBe('tier3_unknown');
    expect(results[5].priceUnknown).toBe(true);
    expect(results[5].totalEstimatedCost).toBeNull();
  });

  it('FIX-RANK-04: newOnly toggle filters out second-hand used listings', () => {
    const results = rankOptionsForItem('drill_machine', sampleListings, [mockShop], {
      neededQuantity: 1,
      durationDays: 1,
      newOnly: true,
    });

    const usedOptions = results.filter((o) => o.mode === 'sell_used');
    expect(usedOptions).toHaveLength(0);
  });
});

