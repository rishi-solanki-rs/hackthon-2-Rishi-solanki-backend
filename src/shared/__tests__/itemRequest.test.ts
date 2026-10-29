import { describe, it, expect } from 'vitest';
import { parseDirectItemRequest, buildTemplateChecklist } from '../templates/taskTemplates';
import { buildAdminWanted } from '../engines/adminEngine';
import { SEED_DEMAND, SEED_LISTINGS, SEED_USERS } from '../seeds';

describe('Direct item requests', () => {
  it('detects named items in English and Hinglish', () => {
    expect(parseDirectItemRequest('need washing machine')?.name).toBe('Washing Machine');
    expect(parseDirectItemRequest('meko RO chahiye')?.name).toBe('RO');
    expect(parseDirectItemRequest('I need a ladder')?.item?.itemKey).toBe('step_ladder');
    expect(parseDirectItemRequest('drill machine')?.item?.itemKey).toBe('drill_machine');
  });

  it('leaves jobs and activities to the task checklist', () => {
    expect(parseDirectItemRequest('install a washing machine in the utility area')).toBeNull();
    expect(parseDirectItemRequest('need to clean the balcony')).toBeNull();
    expect(parseDirectItemRequest('drawing with my kids this weekend')).toBeNull();
    expect(parseDirectItemRequest('washing machine')).toBeNull();
  });

  it('fallback checklist for a named item contains only that item', () => {
    const plan = buildTemplateChecklist('need washing machine');
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].name).toBe('Washing Machine');
    expect(buildTemplateChecklist('need a ladder').items.map((i) => i.itemKey)).toEqual(['step_ladder']);
    expect(buildTemplateChecklist('Mount a TV on the bedroom wall').items.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Admin wanted items', () => {
  it('groups requests per item, hides contacts and marks items that are now listed', () => {
    const wanted = buildAdminWanted(SEED_DEMAND, SEED_USERS, SEED_LISTINGS);
    const tile = wanted.find((w) => w.itemKey === 'tile_cutter')!;
    expect(tile.requestCount).toBe(3);
    expect(tile.status).toBe('open');
    expect(JSON.stringify(tile.requesters)).not.toMatch(/\+91|@/);
    const mixer = wanted.find((w) => w.itemKey === 'stand_mixer')!;
    expect(mixer.status).toBe('available');
    expect(mixer.availableListings.length).toBeGreaterThan(0);
    expect(wanted[wanted.length - 1].status).toBe('available');
  });
});
