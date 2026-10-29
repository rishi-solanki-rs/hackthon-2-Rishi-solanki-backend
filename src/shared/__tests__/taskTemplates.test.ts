import { describe, it, expect } from 'vitest';
import { buildTemplateChecklist, rankTemplates, suggestMoreItems, TASK_TEMPLATES, MIN_CHECKLIST_ITEMS } from '../templates/taskTemplates';
import { getCatalogItem } from '../catalog/catalog';

describe('Task templates', () => {
  it('every template item is a catalog item', () => {
    for (const tpl of TASK_TEMPLATES) {
      for (const i of tpl.items) expect(getCatalogItem(i.key), `${tpl.id}:${i.key}`).toBeDefined();
    }
  });

  it('a drawing task (even misspelt) gets a full art checklist with photos', () => {
    const { category, items } = buildTemplateChecklist('i want to create drwaing');
    expect(category).toBe('art');
    expect(items.length).toBeGreaterThanOrEqual(15);
    const keys = items.map((i) => i.itemKey);
    expect(keys).toEqual(expect.arrayContaining(['drawing_paper', 'colour_pencils', 'glitter_pens', 'coloured_paper', 'eraser_sharpener']));
    expect(items.every((i) => i.imageUrl?.startsWith('/images/items/'))).toBe(true);
    expect(items.find((i) => i.itemKey === 'craft_scissors')!.isConsumable).toBe(false);
  });

  it('always returns at least the minimum number of items', () => {
    for (const task of ['Balcony deep clean', 'Throw a birthday party', 'Shift to a new flat', 'Fix something random']) {
      expect(buildTemplateChecklist(task).items.length).toBeGreaterThanOrEqual(MIN_CHECKLIST_ITEMS);
    }
    expect(rankTemplates('Throw a birthday party')[0].id).toBe('small_party');
  });

  it('suggest-more puts what the resident described first and never repeats the plan', () => {
    const more = suggestMoreItems('I want to create a drawing', 'coloured paper and glitter pens', new Set(['drawing_paper']));
    expect(more.slice(0, 2).map((i) => i.itemKey)).toEqual(['coloured_paper', 'glitter_pens']);
    expect(more.map((i) => i.itemKey)).not.toContain('drawing_paper');
  });
});
