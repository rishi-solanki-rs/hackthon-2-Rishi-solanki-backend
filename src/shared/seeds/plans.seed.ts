import { Plan } from '../types/plan';
import { Request, RequestKind, RequestStatus } from '../types/request';
import { computeRequestTotal } from '../engines/planEngine';
import { SEED_LISTINGS } from './listings.seed';
import { SEED_USERS } from './users.seed';

export const SEED_PLANS: Plan[] = [
  {
    id: 'plan_balcony_clean',
    userId: 'usr_rishi',
    taskDescription: 'Balcony deep clean and AC outdoor unit wash',
    interpretedCategory: 'cleaning',
    clarificationAnswers: {
      scope: 'Standard residential balcony (approx 80 sq ft)',
      waterSource: 'Tap connection available nearby',
      duration: 'Single afternoon (approx 4 hours)',
    },
    items: [
      {
        id: 'item_pw_1',
        itemKey: 'pressure_washer',
        name: 'Pressure Washer',
        neededQuantity: 1,
        ownedQuantity: 0,
        missingQuantity: 1,
        reason: 'Required to clear stubborn moss and algae on exterior balcony tiles.',
        isConsumable: false,
        safetyClass: 'none',
        source: 'ai_suggested',
      },
      {
        id: 'item_cord_1',
        itemKey: 'extension_cord',
        name: '15-Metre Extension Cord',
        neededQuantity: 1,
        ownedQuantity: 1, // User already owns this!
        missingQuantity: 0,
        reason: 'Needed to power washer from indoor 16A socket.',
        isConsumable: false,
        safetyClass: 'none',
        source: 'ai_suggested',
      },
      {
        id: 'item_cloth_1',
        itemKey: 'microfiber_cloth',
        name: 'Microfiber Cleaning Cloths (3-Pack)',
        neededQuantity: 3,
        ownedQuantity: 0,
        missingQuantity: 3,
        reason: 'For wiping down railing and AC outdoor grille.',
        isConsumable: true,
        safetyClass: 'consumable',
        source: 'ai_suggested',
      },
    ],
    status: 'active',
    createdAt: '2026-02-14T10:00:00.000Z',
    updatedAt: '2026-02-14T10:00:00.000Z',
  },
];

export const SEED_REQUESTS: Request[] = [
  {
    id: 'req_drill_active',
    listingId: 'lst_drill_rent',
    planId: 'plan_diy_mount',
    requesterId: 'usr_rishi',
    ownerId: 'usr_amit',
    kind: 'rent',
    requestedQuantity: 1,
    neededFrom: '2026-10-29',
    neededTo: '2026-10-31',
    totalPrice: 300,
    deposit: 0,
    note: 'Hi Amit, need to mount 4 bookshelves in study room.',
    status: 'accepted',
    handoverConfirmedAt: undefined,
    listingTitle: 'Black+Decker Hammer Drill 550W',
    listingCategory: 'diy',
    requesterName: 'Rishi S.',
    requesterTower: 'Tower A',
    requesterPhone: '+91 98765 11001',
    requesterFlat: 'A-402',
    ownerName: 'Amit K.',
    ownerTower: 'Tower B',
    ownerPhone: '+91 98765 22002',
    ownerFlat: 'B-704',
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-27T11:00:00.000Z',
  },
  {
    id: 'req_exp_fixture',
    listingId: 'lst_ladder_rent',
    requesterId: 'usr_priya',
    ownerId: 'usr_deepa',
    kind: 'rent',
    requestedQuantity: 1,
    neededFrom: '2026-10-26',
    neededTo: '2026-10-27',
    totalPrice: 100,
    note: 'Checking ladder for balcony curtain rail.',
    status: 'pending',
    createdAt: '2026-10-25T10:00:00.000Z', // > 72 hours old compared to simulated 2026-10-28
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
];

const HOUR = 3600000;
const DAY = 24 * HOUR;
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

interface SeedRequestOptions {
  qty?: number;
  /** Days from now the booking starts (negative = in the past). */
  startInDays: number;
  days?: number;
  createdHoursAgo: number;
  note?: string;
  thankYouNote?: string;
  declineReason?: string;
  cancellationReason?: string;
}

// Timestamps are relative to load time so pending requests stay inside the 72-hour window after a reset.
function seedRequest(id: string, listingId: string, requesterId: string, status: RequestStatus, opts: SeedRequestOptions): Request {
  const listing = SEED_LISTINGS.find((l) => l.id === listingId)!;
  const requester = SEED_USERS.find((u) => u.id === requesterId)!;
  const owner = SEED_USERS.find((u) => u.id === listing.ownerId)!;
  const now = Date.now();
  const kind: RequestKind = listing.mode === 'lend' ? 'borrow' : listing.mode === 'rent' ? 'rent' : 'buy';
  const qty = opts.qty ?? 1;
  const start = now + opts.startInDays * DAY;
  const neededFrom = kind === 'buy' ? undefined : isoDate(start);
  const neededTo = kind === 'buy' ? undefined : isoDate(start + ((opts.days ?? 1) - 1) * DAY);
  const createdAt = new Date(now - opts.createdHoursAgo * HOUR).toISOString();
  const progressed = status !== 'pending';
  return {
    id,
    listingId,
    requesterId,
    ownerId: owner.id,
    kind,
    requestedQuantity: qty,
    neededFrom,
    neededTo,
    totalPrice: computeRequestTotal(listing.price, kind, qty, neededFrom, neededTo) ?? undefined,
    deposit: listing.comfortRules?.depositAmount,
    note: opts.note,
    status,
    declineReason: opts.declineReason,
    cancellationReason: opts.cancellationReason,
    cancelledBy: status === 'cancelled' ? requesterId : undefined,
    handoverConfirmedAt: status === 'handed_over' || status === 'completed' ? new Date(start).toISOString() : undefined,
    returnedAt: status === 'completed' ? new Date(start + (opts.days ?? 1) * DAY).toISOString() : undefined,
    thankYouNote: opts.thankYouNote,
    listingTitle: listing.title,
    listingCategory: listing.category,
    requesterName: requester.displayName,
    requesterTower: requester.tower,
    requesterPhone: requester.phone,
    requesterFlat: requester.flat,
    ownerName: owner.displayName,
    ownerTower: owner.tower,
    ownerPhone: owner.phone,
    ownerFlat: owner.flat,
    createdAt,
    updatedAt: progressed ? new Date(now - Math.max(0, opts.createdHoursAgo - 2) * HOUR).toISOString() : createdAt,
  };
}

SEED_REQUESTS.push(
  seedRequest('req_roller_pending', 'lst_roller_rent', 'usr_rishi', 'pending', {
    startInDays: 2, days: 2, createdHoursAgo: 3, note: 'Painting the bedroom wall this weekend. Can I pick up Friday evening?',
  }),
  seedRequest('req_pencils_pending', 'lst_colour_pencils_ananya', 'usr_rishi', 'pending', {
    startInDays: 1, createdHoursAgo: 5, note: 'For my niece’s drawing class. Happy to collect any time.',
  }),
  seedRequest('req_projector_pending', 'lst_projector_arjun', 'usr_priya', 'pending', {
    startInDays: 3, days: 2, createdHoursAgo: 8, note: 'Movie night on the terrace for the kids.',
  }),
  seedRequest('req_mixer_accepted', 'lst_mixer_kavya', 'usr_deepa', 'accepted', {
    startInDays: 1, days: 1, createdHoursAgo: 20, note: 'Baking a birthday cake on Saturday.',
  }),
  seedRequest('req_watercolour_accepted', 'lst_watercolour_ananya', 'usr_rishi', 'accepted', {
    startInDays: 0, createdHoursAgo: 26,
  }),
  seedRequest('req_tent_handed', 'lst_tent_free_arjun', 'usr_karan', 'handed_over', {
    startInDays: -1, days: 3, createdHoursAgo: 60, note: 'Weekend trek to Nandi Hills.',
  }),
  seedRequest('req_toolkit_handed', 'lst_tool_kit_arjun', 'usr_rajesh', 'handed_over', {
    startInDays: -1, days: 2, createdHoursAgo: 50,
  }),
  seedRequest('req_chairs_completed', 'lst_chairs_rent', 'usr_rishi', 'completed', {
    startInDays: -12, days: 1, createdHoursAgo: 15 * 24, thankYouNote: 'Chairs were spotless — thank you Neha!',
  }),
  seedRequest('req_easel_completed', 'lst_easel_ananya', 'usr_priya', 'completed', {
    startInDays: -20, days: 4, createdHoursAgo: 22 * 24, thankYouNote: 'My daughter finished her school painting on it. Thanks!',
  }),
  seedRequest('req_boxes_completed', 'lst_boxes_karan', 'usr_sneha', 'completed', {
    startInDays: -9, createdHoursAgo: 10 * 24,
  }),
  seedRequest('req_hose_completed', 'lst_hose_free', 'usr_meera', 'completed', {
    startInDays: -6, days: 1, createdHoursAgo: 7 * 24,
  }),
  seedRequest('req_dslr_declined', 'lst_dslr_arjun', 'usr_meera', 'declined', {
    startInDays: 4, days: 1, createdHoursAgo: 30, declineReason: 'The camera is booked for a wedding shoot that day, sorry!',
  }),
  seedRequest('req_cycle_cancelled', 'lst_cycle_used_meera', 'usr_amit', 'cancelled', {
    startInDays: 0, createdHoursAgo: 40, cancellationReason: 'Found a second-hand cycle at work.',
  }),
);

