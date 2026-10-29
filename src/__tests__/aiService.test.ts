import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const generateContent = vi.fn();

vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  return {
    ...actual,
    GoogleGenAI: class {
      models = { generateContent };
    },
  };
});

import { config } from '../config';
import { interpretTaskWithGemini, toChecklistItems, suggestMoreWithGemini } from '../services/aiService';

const original = { ...config };

describe('Gemini task interpretation', () => {
  beforeEach(() => {
    generateContent.mockReset();
    config.geminiEnabled = true;
    config.geminiApiKey = 'test-key';
    config.geminiTimeoutMs = 200;
  });

  afterEach(() => {
    Object.assign(config, original);
  });

  it('returns validated Gemini items with source "gemini"', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        category: 'diy',
        items: [
          { itemKey: 'drill_machine', name: 'Hammer Drill', neededQuantity: 1, reason: 'Drill holes', isConsumable: false },
          { itemKey: 'Wall Plugs', name: 'Wall plugs', neededQuantity: 8, reason: 'Anchors', isConsumable: false },
        ],
      }),
    });

    const result = await interpretTaskWithGemini('Mount a shelf', {}, ['drill_machine']);
    expect(result.source).toBe('gemini');
    expect(result.category).toBe('diy');
    // AI keys are mapped onto the catalog; the list is topped up to at least 10 items from templates
    expect(result.items.slice(0, 2).map((i) => i.itemKey)).toEqual(['drill_machine', 'screws_plugs']);
    expect(result.items.length).toBeGreaterThanOrEqual(10);
    expect(new Set(result.items.map((i) => i.itemKey)).size).toBe(result.items.length);
    expect(result.items.every((i) => i.imageUrl?.startsWith('/images/items/'))).toBe(true);
    // Deterministic catalog/engine overrides the model's consumable flag
    expect(result.items[1].isConsumable).toBe(true);
    expect(result.items[1].safetyClass).toBe('consumable');

    const prompt = generateContent.mock.calls[0][0].contents[0].parts[0].text as string;
    expect(prompt).toContain('drill_machine');
    expect(generateContent.mock.calls[0][0].model).toBe(config.geminiModel);
  });

  it('falls back to the template when Gemini errors', async () => {
    generateContent.mockRejectedValue(new Error('503 high demand test-key'));
    const result = await interpretTaskWithGemini('Balcony deep clean');
    expect(result.source).toBe('template');
    expect(result.category).toBe('cleaning');
  });

  it('falls back to the template when Gemini times out', async () => {
    generateContent.mockImplementation(() => new Promise(() => {}));
    const result = await interpretTaskWithGemini('Trim garden hedges');
    expect(result.source).toBe('template');
    expect(result.category).toBe('gardening');
  });

  it('falls back to the template on schema-invalid output', async () => {
    generateContent.mockResolvedValue({ text: '{"category":"diy","items":[]}' });
    const result = await interpretTaskWithGemini('Mount TV on wall');
    expect(result.source).toBe('template');
    expect(result.category).toBe('diy');
  });

  it('never calls Gemini when disabled or without a key', async () => {
    config.geminiEnabled = false;
    expect((await interpretTaskWithGemini('Fix something')).source).toBe('template');
    config.geminiEnabled = true;
    config.geminiApiKey = '';
    expect((await interpretTaskWithGemini('Fix something')).source).toBe('template');
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('drops prohibited items suggested by the model', () => {
    const items = toChecklistItems([
      { itemKey: 'petrol_can', name: 'Petrol can', neededQuantity: 1, reason: 'Fuel', isConsumable: true },
      { itemKey: 'step_ladder', name: 'Step Ladder', neededQuantity: 1, reason: 'Reach', isConsumable: false },
    ]);
    expect(items.map((i) => i.itemKey)).toEqual(['step_ladder']);
  });

  it('suggests additional items without repeating the plan, with a deterministic fallback', async () => {
    const existing = [{ itemKey: 'drawing_paper', name: 'Drawing Paper' }, { itemKey: 'sketch_pencils', name: 'Sketching Pencils' }] as any[];
    generateContent.mockResolvedValue({
      text: JSON.stringify({ items: [
        { itemKey: 'glitter_pens', name: 'Glitter pens', neededQuantity: 1, reason: 'Sparkle', isConsumable: true },
        { itemKey: 'drawing_paper', name: 'Drawing paper', neededQuantity: 5, reason: 'dup', isConsumable: true },
      ] }),
    });
    const ai = await suggestMoreWithGemini('I want to create a drawing', 'glitter', existing);
    expect(ai.source).toBe('gemini');
    expect(ai.items.map((i) => i.itemKey)).toEqual(['glitter_pens']);

    config.geminiEnabled = false;
    const fallback = await suggestMoreWithGemini('I want to create a drawing', 'coloured paper and glitter pens', existing);
    expect(fallback.source).toBe('template');
    const keys = fallback.items.map((i) => i.itemKey);
    expect(keys.slice(0, 2)).toEqual(['coloured_paper', 'glitter_pens']);
    expect(keys).not.toContain('drawing_paper');
  });
});
