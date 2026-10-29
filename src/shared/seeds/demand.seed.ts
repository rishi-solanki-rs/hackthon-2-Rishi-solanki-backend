import { DemandEntry } from '../types/api';

const HOUR = 3600000;

function d(id: string, userId: string, itemKey: string, itemName: string, hoursAgo: number): DemandEntry {
  return { id, userId, itemKey, itemName, createdAt: new Date(Date.now() - hoursAgo * HOUR).toISOString() };
}

// SAMPLE "Notify me when available" requests so the admin Wanted page has realistic data after a reset.
export const SEED_DEMAND: DemandEntry[] = [
  d('dmd_seed_tile_1', 'usr_rishi', 'tile_cutter', 'Tile Cutter', 6),
  d('dmd_seed_tile_2', 'usr_priya', 'tile_cutter', 'Tile Cutter', 30),
  d('dmd_seed_tile_3', 'usr_deepa', 'tile_cutter', 'Tile Cutter', 54),
  d('dmd_seed_sewing_1', 'usr_neha', 'sewing_machine', 'Sewing Machine', 12),
  d('dmd_seed_sewing_2', 'usr_sana', 'sewing_machine', 'Sewing Machine', 70),
  d('dmd_seed_scope_1', 'usr_karan', 'telescope', 'Telescope', 20),
  d('dmd_seed_console_1', 'usr_priya', 'ps2_console', 'PS2 Game Console', 3),
  d('dmd_seed_mixer_1', 'usr_sneha', 'stand_mixer', 'Stand Mixer', 120),
];
