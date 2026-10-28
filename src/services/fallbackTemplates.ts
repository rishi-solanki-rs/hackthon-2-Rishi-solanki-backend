import { PlanChecklistItem } from '@sidekit/shared';

export function getDeterministicTemplateItems(taskDescription: string): {
  category: string;
  items: PlanChecklistItem[];
} {
  const descLower = taskDescription.toLowerCase();

  if (descLower.includes('clean') || descLower.includes('balcony') || descLower.includes('wash') || descLower.includes('sofa')) {
    return {
      category: 'cleaning',
      items: [
        {
          id: `item_${Date.now()}_1`,
          itemKey: 'pressure_washer',
          name: 'Pressure Washer',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'High pressure wash for balcony tiles and AC outdoor unit.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_2`,
          itemKey: 'extension_cord',
          name: '15-Metre Heavy Extension Reel',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'To reach balcony from indoor 16A socket.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_3`,
          itemKey: 'microfiber_cloth',
          name: 'Microfiber Cleaning Cloths (3-Pack)',
          neededQuantity: 3,
          ownedQuantity: 0,
          missingQuantity: 3,
          reason: 'Lint-free glass and railing wipe down.',
          isConsumable: true,
          safetyClass: 'consumable',
          source: 'template',
        },
      ],
    };
  }

  if (descLower.includes('drill') || descLower.includes('mount') || descLower.includes('frame') || descLower.includes('shelf') || descLower.includes('tv')) {
    return {
      category: 'diy',
      items: [
        {
          id: `item_${Date.now()}_1`,
          itemKey: 'drill_machine',
          name: 'Hammer Drill Machine',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'To drill into concrete and masonry walls.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_2`,
          itemKey: 'spirit_level',
          name: 'Spirit Level',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'To ensure horizontal alignment of mounts.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_3`,
          itemKey: 'step_ladder',
          name: '5-Step Aluminium Ladder',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Safe elevated reach above eye level.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_4`,
          itemKey: 'screws_plugs',
          name: 'Wall Plugs & Screws Set',
          neededQuantity: 10,
          ownedQuantity: 0,
          missingQuantity: 10,
          reason: 'Masonry wall anchors and matching screws.',
          isConsumable: true,
          safetyClass: 'consumable',
          source: 'template',
        },
      ],
    };
  }

  if (descLower.includes('garden') || descLower.includes('hedge') || descLower.includes('lawn') || descLower.includes('plant') || descLower.includes('prune')) {
    return {
      category: 'gardening',
      items: [
        {
          id: `item_${Date.now()}_1`,
          itemKey: 'hedge_trimmer',
          name: 'Electric Hedge Trimmer',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Pruning overgrown balcony shrubs and bushes.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_2`,
          itemKey: 'extension_cord',
          name: 'Outdoor Extension Reel',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'To supply electrical power outdoors.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
      ],
    };
  }

  // Default Fallback
  return {
    category: 'general',
    items: [
      {
        id: `item_${Date.now()}_1`,
        itemKey: 'tool_kit',
        name: 'Home Tool Kit',
        neededQuantity: 1,
        ownedQuantity: 0,
        missingQuantity: 1,
        reason: 'Basic screwdrivers, wrenches, and fixtures.',
        isConsumable: false,
        safetyClass: 'none',
        source: 'template',
      },
    ],
  };
}

