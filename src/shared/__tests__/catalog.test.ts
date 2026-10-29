import { describe, it, expect } from 'vitest';
import { CATALOG, matchCatalogItem, searchCatalog, resolveItemImage, CATEGORY_IMAGE_KEY } from '../catalog/catalog';
import { evaluateItemSafety } from '../engines/safetyEngine';

describe('Item catalog', () => {
  it('has unique keys and every category fallback points to a real item', () => {
    const keys = CATALOG.map((i) => i.itemKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of Object.values(CATEGORY_IMAGE_KEY)) {
      expect(keys).toContain(key);
    }
  });

  it('matches free-text names and AI keys to catalog items', () => {
    expect(matchCatalogItem('Microfiber Cleaning Cloths (3-Pack)')?.itemKey).toBe('microfiber_cloth');
    expect(matchCatalogItem('colored_pencils')?.itemKey).toBe('colour_pencils');
    expect(matchCatalogItem('Paint Roller')?.itemKey).toBe('paint_roller');
    expect(matchCatalogItem('Heavy Extension Reel (15m)')?.itemKey).toBe('extension_cord');
    expect(matchCatalogItem('flux capacitor')).toBeUndefined();
  });

  it('searches by name prefix and aliases', () => {
    expect(searchCatalog('glit')[0].itemKey).toBe('glitter_pens');
    expect(searchCatalog('colour').map((i) => i.itemKey)).toContain('coloured_paper');
    expect(searchCatalog('x')).toHaveLength(0);
  });

  it('always resolves a photo, falling back to the category image', () => {
    expect(resolveItemImage('drill_machine')).toBe('/images/items/drill_machine.webp');
    expect(resolveItemImage('custom_thing', 'Something Unknown', 'art')).toBe('/images/items/colour_pencils.webp');
    expect(resolveItemImage(undefined, undefined, undefined)).toBe('/images/items/moving_boxes.webp');
  });
});

describe('Catalog-aware consumable classification', () => {
  it('does not treat tools as consumables because of keyword overlap', () => {
    expect(evaluateItemSafety('Screwdriver Set').isConsumable).toBe(false);
    expect(evaluateItemSafety('Measuring Tape').isConsumable).toBe(false);
    expect(evaluateItemSafety('Paint Roller').isConsumable).toBe(false);
  });

  it('still treats real consumables as consumables and blocks prohibited items', () => {
    expect(evaluateItemSafety('Masking Tape').isConsumable).toBe(true);
    expect(evaluateItemSafety('Wall paint 4L').isConsumable).toBe(true);
    expect(evaluateItemSafety('Glitter Gel Pens').isConsumable).toBe(true);
    expect(evaluateItemSafety('Petrol can').isBlocked).toBe(true);
  });
});
