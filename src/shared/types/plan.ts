export type SafetyClass = 'none' | 'consumable' | 'prohibited' | 'caution';

export interface PlanChecklistItem {
  id: string;
  itemKey: string;
  name: string;
  neededQuantity: number;
  ownedQuantity: number;
  missingQuantity: number;
  reason: string;
  isConsumable: boolean;
  safetyClass: SafetyClass;
  source: 'template' | 'ai_suggested' | 'user_added';
  category?: string;
  imageUrl?: string; // Derived from the catalog (illustrative photo)
}

export type TaskRiskFlag = 'wall_load' | 'electrical' | 'gas';

export interface TaskSafetyGate {
  flags: TaskRiskFlag[];
  title: string;
  message: string;
  // true: every tool row is suppressed (electrical/gas); false: only DIY fastening rows (wall load)
  suppressAllTools: boolean;
}

export interface Plan {
  id: string;
  userId: string;
  taskDescription: string;
  interpretedCategory: string;
  clarificationAnswers?: Record<string, string>;
  items: PlanChecklistItem[];
  safetyGate?: TaskSafetyGate;
  aiSource?: 'gemini' | 'template';
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export type OptionTier = 'tier1_free' | 'tier2a_cost' | 'tier2b_demoted' | 'tier3_unknown';

export type OptionMode = 'lend' | 'rent' | 'sell_used' | 'buy_new' | 'repair';

export interface RankedOption {
  id: string;
  source: 'community' | 'external_shop';
  listingId?: string;
  shopId?: string;
  title: string;
  mode: OptionMode;
  tier: OptionTier;
  unitPrice: number | null;
  priceUnit: 'day' | 'item' | null;
  totalEstimatedCost: number | null; // null if unpriced
  priceUnknown: boolean;
  condition: 'like_new' | 'good' | 'fair' | 'unknown' | 'new';
  conditionScore: number; // like_new: 3, good: 2, fair: 1, unknown: 0, new: 4
  ownerDisplayName?: string;
  ownerTower?: string;
  isSameTower?: boolean;
  availableQuantity: number;
  totalQuantity: number;
  warningNote?: string;
  explanation: string;
  shopAddress?: string;
  shopPhone?: string;
  isSample?: boolean;
  imageUrl?: string;
}

export type RecommendedMethod = 'borrow' | 'rent' | 'buy_used' | 'buy_new' | 'repair' | 'notify';

/** Deterministic "best way to get this item" with a plain-language reason. */
export interface ItemRecommendation {
  method: RecommendedMethod;
  optionId?: string;
  reason: string;
}

export interface PlanOptionsItem {
  itemKey: string;
  itemName: string;
  category?: string;
  imageUrl?: string;
  neededQuantity: number;
  missingQuantity: number;
  isConsumable: boolean;
  requesterListsItem?: boolean; // The requester already lists this item themselves
  rankedOptions: RankedOption[];
  repairOptions?: RankedOption[]; // Informational: repair shops for items you may already own broken
  recommendation?: ItemRecommendation;
}

export interface PlanOptionsMatrix {
  planId: string;
  safetyGate?: TaskSafetyGate;
  suppressedItemNames?: string[];
  durationDays?: number;
  items: PlanOptionsItem[];
}

export interface RepairEvaluationInput {
  brand: string;
  model: string;
  originalPrice: number;
  ageYears: number;
  issue: string;
  batteryHealthPercent?: number;
}

export interface RepairEvaluationResult {
  estimatedRepairCostMin: number;
  estimatedRepairCostMax: number;
  currentResidualValue: number;
  repairRatioPercent: number; // (avgRepairCost / residualValue) * 100
  recommendation: 'repair' | 'replace';
  headline: string;
  reasons: string[];
  batteryAction?: string;
  suggestedAlternativeListingId?: string; // e.g. ThinkPad T480
}
