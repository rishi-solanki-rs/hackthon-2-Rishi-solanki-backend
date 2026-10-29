import { SafetyClass } from '../types/plan';
import { RequestStatus } from '../types/request';
import { matchCatalogItem } from '../catalog/catalog';

// Prohibited terms (Class 1 - Hard Block)
const PROHIBITED_KEYWORDS = [
  'weapon',
  'gun',
  'pistol',
  'firearm',
  'ammunition',
  'explosive',
  'firework',
  'cracker',
  'petrol',
  'diesel',
  'kerosene',
  'prescription medicine',
  'drug',
  'hazardous chemical',
  'acid',
  'cyanide',
];

// Consumable terms (Class 2 - Buy/Keep Only)
const CONSUMABLE_KEYWORDS = [
  'paint',
  'masking tape',
  'tape',
  'rawl plug',
  'wall plug',
  'screw',
  'nail',
  'sandpaper',
  'cable tie',
  'zip tie',
  'lubricant',
  'wd-40',
  'fertilizer',
  'cement',
  'grout',
  'sealant',
  'silicone',
  'cloth',
  'detergent',
];

// Caution items (Class 3 - High Liability)
const CAUTION_KEYWORDS = [
  'chainsaw',
  'welder',
  'arc welder',
  'demolition hammer',
  'heavy jackhammer',
  'table saw',
];

export function evaluateItemSafety(itemNameOrQuery: string): {
  safetyClass: SafetyClass;
  isBlocked: boolean;
  isConsumable: boolean;
  warning?: string;
} {
  const normalized = itemNameOrQuery.toLowerCase().trim();

  // 1. Prohibited Check
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return {
        safetyClass: 'prohibited',
        isBlocked: true,
        isConsumable: false,
        warning: `Safety Policy: Listing or requesting "${keyword}" is strictly prohibited for community safety and legal compliance.`,
      };
    }
  }

  // 2. Consumable Check — curated catalog first (so "screwdriver" or "measuring tape" are not
  // mistaken for screws or tape), keywords only for items outside the catalog
  const catalogItem = matchCatalogItem(itemNameOrQuery);
  if (catalogItem && !catalogItem.consumable) {
    return checkCaution(normalized);
  }
  if (catalogItem?.consumable) {
    return {
      safetyClass: 'consumable',
      isBlocked: false,
      isConsumable: true,
      warning: `Consumable item: "${itemNameOrQuery}" is consumed during use. It can only be purchased (new/used) or kept, not borrowed or rented.`,
    };
  }
  for (const keyword of CONSUMABLE_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return {
        safetyClass: 'consumable',
        isBlocked: false,
        isConsumable: true,
        warning: `Consumable item: "${itemNameOrQuery}" is consumed during use. It can only be purchased (new/used) or kept, not borrowed or rented.`,
      };
    }
  }

  return checkCaution(normalized);
}

// 3. Caution / Specialized Tool Check
function checkCaution(normalized: string): { safetyClass: SafetyClass; isBlocked: boolean; isConsumable: boolean; warning?: string } {
  for (const keyword of CAUTION_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return {
        safetyClass: 'caution',
        isBlocked: false,
        isConsumable: false,
        warning: `High Liability Equipment: Ensure proper eye/ear protection and safety guard verification prior to handover.`,
      };
    }
  }

  return {
    safetyClass: 'none',
    isBlocked: false,
    isConsumable: false,
  };
}

/**
 * Privacy Masking Rules:
 * Phone: "+91 98765 43210" -> "+91 98765 •••••"
 * Flat:  "A-402"           -> "Flat •••"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '••••••••••';
  const clean = phone.trim();
  if (clean.length <= 6) return '••••••';
  return clean.slice(0, clean.length - 5) + '•••••';
}

export function maskFlat(flat: string): string {
  return 'Flat •••';
}

export function getVisibleContact(
  phone: string,
  flat: string,
  requestStatus?: RequestStatus
): { phone: string; flat: string; isMasked: boolean } {
  // Only reveal phone and exact flat if request has been accepted or handed over
  const isRevealed = requestStatus === 'accepted' || requestStatus === 'handed_over';

  if (isRevealed) {
    return {
      phone,
      flat,
      isMasked: false,
    };
  }

  return {
    phone: maskPhone(phone),
    flat: maskFlat(flat),
    isMasked: true,
  };
}

