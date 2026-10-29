import { Listing } from '../types/listing';
import { ExternalShop } from '../types/shop';
import { Plan, PlanChecklistItem, PlanOptionsMatrix, TaskRiskFlag, TaskSafetyGate } from '../types/plan';
import { rankOptionsForItem } from './rankingEngine';
import { evaluateItemSafety } from './safetyEngine';

const HOLLOW_WALL_ANSWERS = ['hollow', 'unsure'];

const SOLID_WALL_ANSWERS = ['brick', 'concrete', 'wood'];
const MOUNTING_TEXT = /\b(shelf|shelves|bookshelf|mount|mounting|bracket|brackets|hang|hanging|tv|mirror|cabinet|wall)\b/i;
const HOLLOW_WALL_TEXT = /\b(hollow|drywall|dry wall|plasterboard|gypsum|partition wall)\b/i;
const HEAVY_LOAD_TEXT = /\b(heavy|(1[6-9]|[2-9]\d|\d{3,})\s*kg)\b/i;
const ELECTRICAL_TEXT =
  /\b(rewir\w*|wiring|electrical (work|panel|repair|fault)|circuit breaker|breaker box|mcb|fuse box|distribution board|mains|install(ing)? (a |new )?(socket|switch(board)?|light fixture|ceiling fan)|replace (a |the )?(socket|switch(board)?))\b/i;
const GAS_TEXT = /\b(gas (pipe|pipeline|line|leak|connection|geyser|regulator)|(lpg|png) (pipe|line|connection|leak))\b/i;

// DIY fastening rows hidden when a heavy load goes on a hollow/unknown wall
const WALL_LOAD_DIY_TERMS = /\b(drill|drills|anchor|anchors|plug|plugs|rawl|screw|screws|bracket|brackets|stud|toggle|bit|bits)\b/i;

/**
 * Deterministic task-level safety gate. Unknown wall type counts as hollow.
 */
export function evaluateTaskSafetyGate(
  taskDescription: string,
  answers: Record<string, string> = {}
): TaskSafetyGate | null {
  const text = taskDescription || '';
  const flags: TaskRiskFlag[] = [];

  const wallType = (answers.wall_type || '').toLowerCase();
  const shelfLoad = (answers.shelf_load || '').toLowerCase();
  // An unanswered wall type on a mounting task is unknown, and unknown counts as hollow
  const hollowWall = wallType
    ? HOLLOW_WALL_ANSWERS.includes(wallType) || !SOLID_WALL_ANSWERS.includes(wallType)
    : HOLLOW_WALL_TEXT.test(text) || MOUNTING_TEXT.test(text);
  const heavyLoad = shelfLoad === 'heavy' || (!shelfLoad && HEAVY_LOAD_TEXT.test(text));
  if (hollowWall && heavyLoad) flags.push('wall_load');

  if (ELECTRICAL_TEXT.test(text)) flags.push('electrical');
  if (GAS_TEXT.test(text)) flags.push('gas');

  if (flags.length === 0) return null;

  const suppressAllTools = flags.includes('electrical') || flags.includes('gas');
  if (suppressAllTools) {
    const kind = flags.includes('electrical') && flags.includes('gas')
      ? 'Electrical and gas work'
      : flags.includes('electrical') ? 'Electrical work' : 'Gas work';
    return {
      flags,
      suppressAllTools,
      title: 'Hire a qualified professional',
      message: `${kind} must be done by a licensed professional. Sidekit does not suggest tools to borrow or buy for this part of the task.`,
    };
  }

  return {
    flags,
    suppressAllTools,
    title: 'Professional installation advised',
    message:
      'Mounting heavy loads (> 15 kg) onto hollow drywall or unknown wall structures risks wall tear-out and serious injury. Standard plastic wall plugs are inadequate. We strongly advise hiring a professional carpenter.',
  };
}

export function isItemSuppressedByGate(item: Pick<PlanChecklistItem, 'itemKey' | 'name'>, gate?: TaskSafetyGate | null): boolean {
  if (!gate) return false;
  if (gate.suppressAllTools) return true;
  if (gate.flags.includes('wall_load')) {
    return WALL_LOAD_DIY_TERMS.test(`${item.itemKey.replace(/_/g, ' ')} ${item.name}`);
  }
  return false;
}

export function applySafetyGate(items: PlanChecklistItem[], gate?: TaskSafetyGate | null): PlanChecklistItem[] {
  return items.filter((i) => !isItemSuppressedByGate(i, gate));
}

/**
 * Normalizes client-submitted checklist items: recomputes missing quantity,
 * re-derives consumable/safety class deterministically and drops prohibited items.
 */
export function normalizeChecklistItems(items: PlanChecklistItem[]): PlanChecklistItem[] {
  return items
    .map((i) => {
      const neededQuantity = Math.max(1, Math.floor(Number(i.neededQuantity) || 1));
      const ownedQuantity = Math.max(0, Math.floor(Number(i.ownedQuantity) || 0));
      const safety = evaluateItemSafety(`${i.name} ${String(i.itemKey).replace(/_/g, ' ')}`);
      const isConsumable = safety.isConsumable || i.isConsumable === true;
      return {
        ...i,
        neededQuantity,
        ownedQuantity,
        missingQuantity: Math.max(0, neededQuantity - ownedQuantity),
        isConsumable,
        safetyClass: safety.safetyClass !== 'none' ? safety.safetyClass : isConsumable ? 'consumable' : 'none',
        blocked: safety.isBlocked,
      };
    })
    .filter((i) => !i.blocked)
    .map(({ blocked: _blocked, ...rest }) => rest as PlanChecklistItem);
}

const DURATION_DAYS: Record<string, number> = {
  'a few hours': 1,
  '1 day': 1,
  'full weekend': 2,
};

/** Suggested booking length from the plan's bounded duration answer. */
export function suggestedBookingDays(answers?: Record<string, string>): number {
  return DURATION_DAYS[(answers?.duration || '').toLowerCase()] ?? 1;
}

/** Number of billable days for a [from, to) booking; at least one. */
export function bookingDays(neededFrom?: string, neededTo?: string): number {
  if (!neededFrom || !neededTo) return 1;
  const ms = new Date(neededTo).getTime() - new Date(neededFrom).getTime();
  return Number.isFinite(ms) ? Math.max(1, Math.round(ms / 86400000)) : 1;
}

/**
 * Request total in INR. Null when the listing has no price (unknown stays unknown);
 * free borrows are genuinely 0.
 */
export function computeRequestTotal(
  price: number | null | undefined,
  kind: 'borrow' | 'rent' | 'buy',
  quantity: number,
  neededFrom?: string,
  neededTo?: string
): number | null {
  if (kind === 'borrow') return 0;
  if (price === null || price === undefined) return null;
  return kind === 'rent' ? price * bookingDays(neededFrom, neededTo) * quantity : price * quantity;
}

export interface PlanOptionsContext {
  requesterTower?: string;
  requesterId?: string;
  newOnly?: boolean;
}

/**
 * Builds the options matrix for every missing item of a plan.
 * Consumables never get borrow/rent options; safety-gated rows get no options at all.
 */
export function buildPlanOptionsMatrix(
  plan: Plan,
  listings: Listing[],
  shops: ExternalShop[],
  context: PlanOptionsContext = {}
): PlanOptionsMatrix {
  const gate = plan.safetyGate ?? evaluateTaskSafetyGate(plan.taskDescription, plan.clarificationAnswers);
  const visibleListings = listings.filter((l) => l.moderationStatus !== 'hidden_by_admin' && l.status === 'active');

  const missing = plan.items.filter((item) => item.missingQuantity > 0);
  const suppressed = missing.filter((item) => isItemSuppressedByGate(item, gate));

  const items = missing
    .filter((item) => !isItemSuppressedByGate(item, gate))
    .map((item) => {
      let ranked = rankOptionsForItem(item.itemKey, visibleListings, shops, {
        neededQuantity: item.missingQuantity,
        durationDays: 1,
        requesterTower: context.requesterTower,
        requesterId: context.requesterId,
        newOnly: context.newOnly ?? false,
      });
      if (item.isConsumable) {
        ranked = ranked.filter((o) => o.mode !== 'lend' && o.mode !== 'rent');
      }
      const requesterListsItem = Boolean(
        context.requesterId && visibleListings.some((l) => l.itemKey === item.itemKey && l.ownerId === context.requesterId)
      );
      return {
        itemKey: item.itemKey,
        itemName: item.name,
        neededQuantity: item.neededQuantity,
        missingQuantity: item.missingQuantity,
        isConsumable: item.isConsumable,
        requesterListsItem,
        rankedOptions: ranked,
      };
    });

  return {
    planId: plan.id,
    safetyGate: gate ?? undefined,
    suppressedItemNames: suppressed.length > 0 ? suppressed.map((i) => i.name) : undefined,
    items,
  };
}
