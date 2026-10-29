import { ListingCategory } from '../types/listing';

export interface CatalogItem {
  itemKey: string;
  name: string;
  category: ListingCategory;
  aliases: string[];
  consumable: boolean;
  repairable?: boolean;
}

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  diy: 'DIY & Tools',
  art: 'Art & Stationery',
  party: 'Party & Events',
  cleaning: 'Cleaning',
  gardening: 'Gardening',
  kitchen: 'Kitchen & Baking',
  electronics: 'Electronics',
  photo: 'Photo & Video',
  moving: 'Moving & Packing',
  sports: 'Sports & Outdoors',
  general: 'General',
};

const c = (
  itemKey: string,
  name: string,
  category: ListingCategory,
  aliases: string[],
  consumable = false,
  repairable = false
): CatalogItem => ({ itemKey, name, category, aliases, consumable, ...(repairable ? { repairable } : {}) });

export const CATALOG: CatalogItem[] = [
  // Art & stationery
  c('drawing_paper', 'Drawing Paper', 'art', ['sketch paper', 'a4 paper', 'cartridge paper', 'drawing sheets', 'paper'], true),
  c('sketch_pencils', 'Sketching Pencils', 'art', ['graphite pencils', 'pencil set', 'hb pencils', 'pencils', 'pencil'], true),
  c('colour_pencils', 'Colour Pencils', 'art', ['colored pencils', 'coloured pencils', 'color pencils', 'pencil colours'], true),
  c('watercolour_set', 'Watercolour Paint Set', 'art', ['watercolor', 'water colours', 'watercolours', 'paint palette'], true),
  c('glitter_pens', 'Glitter Gel Pens', 'art', ['glitter pen', 'gel pens', 'sparkle pens'], true),
  c('coloured_paper', 'Coloured Craft Paper', 'art', ['colored paper', 'colour paper', 'craft paper', 'origami paper', 'chart paper'], true),
  c('paint_brushes', 'Artist Paint Brushes', 'art', ['art brushes', 'brush set', 'paintbrush', 'drawing brushes']),
  c('tabletop_easel', 'Tabletop Easel', 'art', ['easel', 'drawing stand', 'canvas stand']),
  c('eraser_sharpener', 'Eraser & Sharpener', 'art', ['eraser', 'rubber', 'sharpener', 'pencil sharpener'], true),
  c('acrylic_paint_set', 'Acrylic Paint Set', 'art', ['acrylic paints', 'acrylic colours', 'poster colours'], true),
  c('canvas_board', 'Painting Canvas', 'art', ['canvas', 'canvas panel', 'stretched canvas'], true),
  c('glue_sticks', 'Glue Sticks', 'art', ['glue', 'fevistick', 'adhesive', 'craft glue'], true),
  c('craft_scissors', 'Craft Scissors', 'art', ['scissors', 'paper scissors']),
  c('steel_ruler', 'Steel Ruler', 'art', ['ruler', 'scale', 'straight edge']),
  c('cutting_mat', 'Cutting Mat', 'art', ['self healing mat', 'craft mat']),
  c('sketch_markers', 'Sketch Markers', 'art', ['markers', 'marker pens', 'felt pens', 'sketch pens'], true),
  c('oil_pastels', 'Oil Pastels', 'art', ['pastels', 'crayons', 'wax crayons'], true),
  c('drawing_board', 'Drawing Board', 'art', ['clipboard', 'sketch board', 'art board']),

  // DIY & tools
  c('drill_machine', 'Hammer Drill Machine', 'diy', ['drill', 'power drill', 'impact drill', 'cordless drill', 'rotary drill'], false, true),
  c('drill_bits', 'Drill Bit Set', 'diy', ['masonry bits', 'drill bits', 'bits']),
  c('screws_plugs', 'Wall Plugs & Screws', 'diy', ['screws', 'wall plugs', 'anchors', 'rawl plugs', 'nails', 'wall anchors'], true),
  c('spirit_level', 'Spirit Level', 'diy', ['level', 'bubble level']),
  c('stud_finder', 'Stud Finder / Wall Scanner', 'diy', ['wall scanner', 'stud detector', 'pipe detector']),
  c('measuring_tape', 'Measuring Tape', 'diy', ['tape measure', 'inch tape', 'measure tape']),
  c('hammer', 'Claw Hammer', 'diy', ['hammer', 'mallet']),
  c('screwdriver_set', 'Screwdriver Set', 'diy', ['screwdriver', 'screw driver', 'screwdrivers']),
  c('allen_keys', 'Allen Key Set', 'diy', ['allen keys', 'hex keys', 'allen wrench']),
  c('plier_set', 'Plier Set', 'diy', ['pliers', 'cutter', 'wire cutter']),
  c('adjustable_wrench', 'Adjustable Wrench', 'diy', ['wrench', 'spanner', 'adjustable spanner']),
  c('hand_saw', 'Hand Saw', 'diy', ['saw', 'wood saw']),
  c('orbital_sander', 'Orbital Sander', 'diy', ['sander', 'sanding machine'], false, true),
  c('step_ladder', 'Step Ladder', 'diy', ['ladder', 'folding ladder', 'aluminium ladder']),
  c('tool_kit', 'Home Tool Kit', 'diy', ['toolkit', 'tool box', 'toolbox', 'tools']),
  c('safety_glasses', 'Safety Glasses', 'diy', ['goggles', 'safety goggles', 'eye protection']),
  c('masking_tape', 'Masking Tape', 'diy', ['painters tape', 'painter tape'], true),
  c('work_gloves', 'Work Gloves', 'diy', ['gloves', 'safety gloves']),
  c('paint_roller', 'Paint Roller', 'diy', ['roller', 'wall roller']),
  c('wall_paint', 'Wall Paint', 'diy', ['emulsion', 'paint tin', 'interior paint', 'paint'], true),
  c('paint_tray', 'Paint Tray', 'diy', ['roller tray']),
  c('drop_cloth', 'Drop Sheet', 'diy', ['drop cloth', 'dust sheet', 'floor cover']),
  c('putty_knife', 'Putty Knife', 'diy', ['scraper', 'filling knife', 'spatula']),
  c('sandpaper', 'Sandpaper', 'diy', ['emery paper', 'sanding paper'], true),
  c('wall_brackets', 'Shelf Brackets', 'diy', ['brackets', 'shelf bracket', 'l brackets'], true),

  // Electronics
  c('extension_cord', 'Extension Reel', 'electronics', ['extension cord', 'extension cable', 'cable reel', 'extension wire']),
  c('power_strip', 'Power Strip', 'electronics', ['extension board', 'multi plug', 'spike guard', 'surge protector']),
  c('laptop_machine', 'Laptop', 'electronics', ['laptop', 'notebook computer', 'computer'], false, true),
  c('mini_projector', 'Portable Projector', 'electronics', ['projector', 'mini projector', 'beamer'], false, true),
  c('projector_screen', 'Projector Screen', 'electronics', ['screen', 'projection screen']),
  c('soldering_iron', 'Soldering Iron', 'electronics', ['soldering kit', 'solder']),
  c('multimeter', 'Digital Multimeter', 'electronics', ['tester', 'voltage tester', 'meter']),

  // Photo & video
  c('dslr_camera', 'DSLR Camera', 'photo', ['camera', 'dslr', 'mirrorless camera'], false, true),
  c('tripod', 'Tripod', 'photo', ['camera stand', 'phone tripod']),
  c('ring_light', 'Ring Light', 'photo', ['led ring light', 'selfie light', 'studio light', 'light']),
  c('backdrop_stand', 'Photo Backdrop Stand', 'photo', ['backdrop', 'background stand', 'photo backdrop']),

  // Cleaning
  c('vacuum_wet_dry', 'Wet & Dry Vacuum', 'cleaning', ['vacuum', 'vacuum cleaner', 'hoover'], false, true),
  c('pressure_washer', 'Pressure Washer', 'cleaning', ['jet washer', 'power washer', 'high pressure washer'], false, true),
  c('carpet_cleaner', 'Carpet Spot Cleaner', 'cleaning', ['carpet shampooer', 'upholstery cleaner', 'sofa cleaner']),
  c('microfiber_cloth', 'Microfiber Cloths', 'cleaning', ['cleaning cloth', 'duster', 'rags', 'cloth'], true),
  c('mop_bucket', 'Mop & Bucket', 'cleaning', ['mop', 'bucket', 'floor mop']),
  c('cleaning_detergent', 'Cleaning Detergent', 'cleaning', ['detergent', 'floor cleaner', 'soap', 'cleaner'], true),
  c('squeegee', 'Window Squeegee', 'cleaning', ['wiper', 'glass wiper']),
  c('garment_steamer', 'Garment Steamer', 'cleaning', ['steamer', 'clothes steamer'], false, true),
  c('scrub_brush', 'Scrub Brush', 'cleaning', ['scrubber', 'cleaning brush', 'brush']),

  // Gardening
  c('hedge_trimmer', 'Hedge Trimmer', 'gardening', ['trimmer', 'bush trimmer']),
  c('lawn_mower', 'Lawn Mower', 'gardening', ['mower', 'grass cutter'], false, true),
  c('leaf_blower', 'Leaf Blower', 'gardening', ['blower']),
  c('garden_hose', 'Garden Hose', 'gardening', ['hose', 'hose pipe', 'water pipe']),
  c('pruning_shears', 'Pruning Shears', 'gardening', ['secateurs', 'pruner', 'garden scissors']),
  c('garden_gloves', 'Garden Gloves', 'gardening', ['gardening gloves']),
  c('plant_pots', 'Plant Pots', 'gardening', ['pots', 'planters', 'flower pots']),
  c('potting_soil', 'Potting Soil', 'gardening', ['soil', 'potting mix', 'compost', 'manure'], true),
  c('watering_can', 'Watering Can', 'gardening', ['watering pot', 'sprinkler can']),

  // Party & events
  c('folding_table', 'Folding Table', 'party', ['table', 'party table', 'buffet table']),
  c('folding_chairs', 'Folding Chairs', 'party', ['chairs', 'party chairs', 'plastic chairs']),
  c('party_speaker', 'Bluetooth Party Speaker', 'party', ['speaker', 'music system', 'bluetooth speaker', 'sound system']),
  c('microphone', 'Microphone', 'party', ['mic', 'wireless mic', 'karaoke mic']),
  c('fairy_lights', 'Fairy Lights', 'party', ['string lights', 'led lights', 'decoration lights', 'serial lights']),
  c('balloon_pump', 'Balloon Pump', 'party', ['air pump', 'balloon inflator']),
  c('party_decorations', 'Party Decorations', 'party', ['balloons', 'streamers', 'banners', 'decorations'], true),
  c('serving_set', 'Serving Platter Set', 'party', ['serving dishes', 'platters', 'crockery', 'chafing dish']),
  c('cooler_box', 'Cooler Box', 'party', ['ice box', 'cooler', 'ice chest']),

  // Kitchen & baking
  c('stand_mixer', 'Stand Mixer', 'kitchen', ['mixer', 'cake mixer', 'beater', 'hand mixer'], false, true),
  c('baking_trays', 'Baking Trays', 'kitchen', ['baking tray', 'cookie sheet', 'oven tray']),
  c('cake_tins', 'Cake Tins', 'kitchen', ['cake mould', 'cake pan', 'baking tin']),
  c('measuring_cups', 'Measuring Cups & Spoons', 'kitchen', ['measuring cups', 'measuring spoons']),
  c('piping_bags', 'Piping Bags & Nozzles', 'kitchen', ['icing bags', 'piping nozzles', 'frosting bags'], true),
  c('pressure_cooker', 'Pressure Cooker', 'kitchen', ['cooker']),
  c('large_cooking_pot', 'Large Cooking Pot', 'kitchen', ['stock pot', 'big vessel', 'patila', 'handi']),
  c('blender', 'Blender', 'kitchen', ['mixer grinder', 'juicer', 'blender jar'], false, true),
  c('rolling_pin', 'Rolling Pin', 'kitchen', ['belan', 'dough roller']),

  // Moving & packing
  c('moving_boxes', 'Moving Boxes', 'moving', ['cartons', 'cardboard boxes', 'packing boxes', 'boxes'], true),
  c('packing_tape', 'Packing Tape', 'moving', ['brown tape', 'cello tape', 'box tape'], true),
  c('bubble_wrap', 'Bubble Wrap', 'moving', ['bubble roll', 'packing wrap'], true),
  c('hand_truck', 'Hand Truck Trolley', 'moving', ['trolley', 'dolly', 'sack truck', 'luggage trolley']),
  c('moving_blankets', 'Moving Blankets', 'moving', ['furniture pads', 'padding blankets']),

  // Sports & outdoors
  c('camping_tent', 'Camping Tent', 'sports', ['tent']),
  c('sleeping_bag', 'Sleeping Bag', 'sports', ['sleep bag']),
  c('bicycle', 'Bicycle', 'sports', ['cycle', 'bike', 'mountain bike'], false, true),
  c('badminton_set', 'Badminton Set', 'sports', ['badminton', 'rackets', 'shuttlecock']),
];

const BY_KEY = new Map(CATALOG.map((i) => [i.itemKey, i]));

// Representative catalog photo per category, used when an item has no photo of its own
export const CATEGORY_IMAGE_KEY: Record<ListingCategory, string> = {
  diy: 'tool_kit',
  art: 'colour_pencils',
  party: 'fairy_lights',
  cleaning: 'mop_bucket',
  gardening: 'watering_can',
  kitchen: 'baking_trays',
  electronics: 'power_strip',
  photo: 'dslr_camera',
  moving: 'moving_boxes',
  sports: 'camping_tent',
  general: 'moving_boxes',
};

function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map(singular)
    .join(' ');
}

export function getCatalogItem(itemKey: string | undefined): CatalogItem | undefined {
  return itemKey ? BY_KEY.get(itemKey) : undefined;
}

/**
 * Maps a free-text name or key to a catalog item: exact key, exact name/alias,
 * then whole-word alias containment (longest alias wins).
 */
export function matchCatalogItem(keyOrName: string | undefined): CatalogItem | undefined {
  if (!keyOrName) return undefined;
  const direct = BY_KEY.get(keyOrName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
  if (direct) return direct;

  const text = normalize(keyOrName);
  let best: { item: CatalogItem; score: number } | undefined;
  for (const item of CATALOG) {
    const names = [item.name, ...item.aliases].map(normalize);
    for (const n of names) {
      if (!n) continue;
      if (n === text) return item;
      if (` ${text} `.includes(` ${n} `) && (!best || n.length > best.score)) {
        best = { item, score: n.length };
      }
    }
  }
  return best?.item;
}

/** Ranked catalog search for "add item" autocomplete. */
export function searchCatalog(query: string, limit = 8): CatalogItem[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored: Array<{ item: CatalogItem; score: number }> = [];
  for (const item of CATALOG) {
    const name = normalize(item.name);
    const aliases = item.aliases.map(normalize);
    let score = 0;
    if (name.startsWith(q)) score = 100;
    else if (aliases.some((a) => a.startsWith(q))) score = 80;
    else if (name.includes(q)) score = 60;
    else if (aliases.some((a) => a.includes(q))) score = 40;
    else if (q.split(' ').every((w) => name.includes(w) || aliases.some((a) => a.includes(w)))) score = 20;
    if (score > 0) scored.push({ item, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map((s) => s.item);
}

export const ITEM_IMAGE_BASE = '/images/items';

/** Every item resolves to a photo: its own, else its category's representative photo. */
export function resolveItemImage(itemKey?: string, name?: string, category?: ListingCategory | string): string {
  const item = getCatalogItem(itemKey) || matchCatalogItem(name) || matchCatalogItem(itemKey);
  if (item) return `${ITEM_IMAGE_BASE}/${item.itemKey}.webp`;
  const cat = (category && category in CATEGORY_IMAGE_KEY ? category : 'general') as ListingCategory;
  return `${ITEM_IMAGE_BASE}/${CATEGORY_IMAGE_KEY[cat]}.webp`;
}

/** Curated consumable flag when the item is in the catalog; undefined otherwise. */
export function catalogConsumable(itemKey?: string, name?: string): boolean | undefined {
  const item = getCatalogItem(itemKey) || matchCatalogItem(name);
  return item?.consumable;
}
