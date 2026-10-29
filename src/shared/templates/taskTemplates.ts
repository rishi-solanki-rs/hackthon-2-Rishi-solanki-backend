import { PlanChecklistItem } from '../types/plan';
import { ListingCategory } from '../types/listing';
import { CATALOG, CatalogItem, getCatalogItem, matchCatalogItem, resolveItemImage, searchCatalog } from '../catalog/catalog';
import { evaluateItemSafety } from '../engines/safetyEngine';

interface TemplateItem {
  key: string;
  qty: number;
  reason: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  category: ListingCategory;
  keywords: string[];
  items: TemplateItem[];
}

const t = (key: string, qty: number, reason: string): TemplateItem => ({ key, qty, reason });

// Curated requirement lists (Detailed Design: "the requirement list comes from a template library we write ourselves").
export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'drawing_art',
    title: 'Drawing & art project',
    category: 'art',
    keywords: ['drawing', 'draw', 'drwaing', 'sketch', 'art', 'artwork', 'colour', 'color', 'colouring', 'coloring', 'craft', 'poster', 'glitter', 'card making', 'greeting card', 'school project', 'chart', 'canvas', 'illustration', 'mandala', 'painting a picture'],
    items: [
      t('drawing_paper', 10, 'Sheets to draw and practise on'),
      t('sketch_pencils', 1, 'Graded pencils for outlines and shading'),
      t('eraser_sharpener', 1, 'Clean up lines and keep pencils sharp'),
      t('colour_pencils', 1, 'Easy colouring with control over detail'),
      t('sketch_markers', 1, 'Bold outlines and bright fills'),
      t('glitter_pens', 1, 'Sparkle highlights and decorative lettering'),
      t('coloured_paper', 10, 'Backgrounds, borders and cut-outs'),
      t('watercolour_set', 1, 'Soft washes of colour'),
      t('paint_brushes', 1, 'Brushes for watercolour or acrylic'),
      t('acrylic_paint_set', 1, 'Opaque, vivid painted areas'),
      t('oil_pastels', 1, 'Rich blended colour without water'),
      t('canvas_board', 1, 'A sturdy surface if the drawing will be displayed'),
      t('steel_ruler', 1, 'Straight lines, borders and measurements'),
      t('craft_scissors', 1, 'Cut paper shapes and borders'),
      t('glue_sticks', 2, 'Stick cut-outs and layered paper'),
      t('cutting_mat', 1, 'Protects the table while cutting'),
      t('drawing_board', 1, 'Firm, portable surface to work on'),
      t('tabletop_easel', 1, 'Holds the work upright at a comfortable angle'),
    ],
  },
  {
    id: 'wall_painting',
    title: 'Painting a room or wall',
    category: 'diy',
    keywords: ['paint the wall', 'paint wall', 'wall paint', 'painting room', 'paint room', 'repaint', 'whitewash', 'paint my room', 'paint the room', 'colour the wall', 'wall painting', 'putty'],
    items: [
      t('wall_paint', 2, 'Paint for the wall area'),
      t('paint_roller', 1, 'Fast, even coverage on large surfaces'),
      t('paint_tray', 1, 'Loads the roller evenly'),
      t('paint_brushes', 1, 'Edges and corners the roller cannot reach'),
      t('masking_tape', 2, 'Sharp edges around switches, frames and skirting'),
      t('drop_cloth', 2, 'Protects floor and furniture from drips'),
      t('putty_knife', 1, 'Fill cracks and holes before painting'),
      t('sandpaper', 5, 'Smooth patched areas'),
      t('step_ladder', 1, 'Reach the top of the wall safely'),
      t('microfiber_cloth', 2, 'Wipe dust before painting and clean drips'),
      t('work_gloves', 1, 'Keeps hands clean'),
      t('safety_glasses', 1, 'Eye protection when painting overhead'),
    ],
  },
  {
    id: 'install_shelf',
    title: 'Mounting a shelf, TV or frames',
    category: 'diy',
    keywords: ['shelf', 'shelves', 'bookshelf', 'mount', 'mounting', 'tv', 'frame', 'mirror', 'bracket', 'hang', 'curtain rod', 'drill', 'wall clock'],
    items: [
      t('drill_machine', 1, 'Drill holes into brick or concrete walls'),
      t('drill_bits', 1, 'Masonry bits sized for the wall plugs'),
      t('screws_plugs', 10, 'Anchor the bracket securely in the wall'),
      t('wall_brackets', 2, 'Hold the shelf or TV'),
      t('stud_finder', 1, 'Avoid hidden pipes and wires before drilling'),
      t('spirit_level', 1, 'Keep everything straight'),
      t('measuring_tape', 1, 'Mark heights and spacing'),
      t('sketch_pencils', 1, 'Mark drill points on the wall'),
      t('screwdriver_set', 1, 'Tighten screws into the plugs'),
      t('hammer', 1, 'Tap wall plugs flush'),
      t('step_ladder', 1, 'Safe reach above eye level'),
      t('safety_glasses', 1, 'Protect eyes from drilling dust'),
      t('vacuum_wet_dry', 1, 'Clean up drilling dust afterwards'),
    ],
  },
  {
    id: 'assemble_furniture',
    title: 'Assembling furniture',
    category: 'diy',
    keywords: ['assemble', 'assembly', 'furniture', 'wardrobe', 'bed frame', 'cupboard', 'study table', 'flat pack', 'ikea', 'almirah', 'cot'],
    items: [
      t('screwdriver_set', 1, 'Most flat-pack screws'),
      t('allen_keys', 1, 'Hex bolts used in flat-pack furniture'),
      t('drill_machine', 1, 'Speeds up long screw runs (use a low setting)'),
      t('hammer', 1, 'Tap in dowels and back panel nails'),
      t('plier_set', 1, 'Grip small parts and bend tabs'),
      t('adjustable_wrench', 1, 'Tighten nuts and bolts'),
      t('measuring_tape', 1, 'Check the space before assembling'),
      t('spirit_level', 1, 'Make sure doors and shelves sit level'),
      t('craft_scissors', 1, 'Open packaging and cut straps'),
      t('moving_blankets', 2, 'Protect the floor and panels while working'),
      t('work_gloves', 1, 'Protect hands from sharp edges'),
      t('step_ladder', 1, 'Reach the top of tall wardrobes'),
      t('tool_kit', 1, 'Everything else in one box'),
    ],
  },
  {
    id: 'small_party',
    title: 'Hosting a party or get-together',
    category: 'party',
    keywords: ['party', 'birthday', 'celebration', 'celebrate', 'get together', 'get-together', 'anniversary', 'kitty party', 'function', 'event', 'gathering', 'housewarming', 'festival', 'diwali party', 'baby shower'],
    items: [
      t('folding_table', 2, 'Food and gift tables'),
      t('folding_chairs', 10, 'Seating for guests'),
      t('party_speaker', 1, 'Music for the evening'),
      t('microphone', 1, 'Speeches, games or karaoke'),
      t('fairy_lights', 2, 'Warm decorative lighting'),
      t('party_decorations', 1, 'Balloons, banners and streamers'),
      t('balloon_pump', 1, 'Inflate balloons quickly'),
      t('serving_set', 2, 'Serve snacks and food'),
      t('large_cooking_pot', 1, 'Cook or keep food warm for many guests'),
      t('cooler_box', 1, 'Keep drinks and desserts cold'),
      t('extension_cord', 1, 'Power for lights and speaker'),
      t('power_strip', 1, 'Several devices from one socket'),
      t('mini_projector', 1, 'Slideshow or movie for guests'),
    ],
  },
  {
    id: 'record_video',
    title: 'Recording a video or photo shoot',
    category: 'photo',
    keywords: ['record', 'recording', 'video', 'shoot', 'photo shoot', 'photoshoot', 'youtube', 'reel', 'vlog', 'photography', 'podcast', 'interview', 'product photos'],
    items: [
      t('dslr_camera', 1, 'Sharp photos and video'),
      t('tripod', 1, 'Steady, repeatable framing'),
      t('ring_light', 1, 'Even, flattering light on faces'),
      t('backdrop_stand', 1, 'Clean, distraction-free background'),
      t('microphone', 1, 'Clear audio'),
      t('extension_cord', 1, 'Power for lights where sockets are far'),
      t('power_strip', 1, 'Charge camera, lights and phone together'),
      t('laptop_machine', 1, 'Review and edit footage'),
      t('folding_table', 1, 'Set up props or gear'),
      t('fairy_lights', 1, 'Background lighting accents'),
    ],
  },
  {
    id: 'movie_night',
    title: 'Movie or match screening',
    category: 'electronics',
    keywords: ['projector', 'movie', 'movie night', 'screening', 'match', 'cricket match', 'world cup', 'watch party', 'film'],
    items: [
      t('mini_projector', 1, 'Big-screen picture'),
      t('projector_screen', 1, 'Bright, even viewing surface'),
      t('party_speaker', 1, 'Room-filling sound'),
      t('laptop_machine', 1, 'Play the movie or stream'),
      t('extension_cord', 1, 'Reach the seating area with power'),
      t('power_strip', 1, 'Projector, speaker and laptop together'),
      t('folding_chairs', 6, 'Seating for viewers'),
      t('fairy_lights', 1, 'Soft ambient light'),
      t('cooler_box', 1, 'Cold drinks during the show'),
      t('tripod', 1, 'Raise the projector to screen height'),
    ],
  },
  {
    id: 'deep_cleaning',
    title: 'Deep cleaning',
    category: 'cleaning',
    keywords: ['clean', 'cleaning', 'balcony', 'wash', 'sofa', 'carpet', 'diwali cleaning', 'dust', 'dusting', 'spring cleaning', 'kitchen cleaning', 'bathroom', 'tiles', 'windows', 'ac unit'],
    items: [
      t('vacuum_wet_dry', 1, 'Dust, debris and spills'),
      t('pressure_washer', 1, 'Balcony floors, grilles and outdoor surfaces'),
      t('carpet_cleaner', 1, 'Deep clean sofa and carpets'),
      t('mop_bucket', 1, 'Floors after vacuuming'),
      t('scrub_brush', 1, 'Tile grout and stubborn stains'),
      t('squeegee', 1, 'Streak-free windows and glass'),
      t('microfiber_cloth', 3, 'Dusting and polishing'),
      t('cleaning_detergent', 2, 'Floor and surface cleaner'),
      t('garment_steamer', 1, 'Refresh curtains and upholstery'),
      t('step_ladder', 1, 'Fans, lights and top shelves'),
      t('extension_cord', 1, 'Power for the washer or vacuum outdoors'),
      t('work_gloves', 1, 'Protect hands from detergents'),
    ],
  },
  {
    id: 'gardening',
    title: 'Gardening & balcony plants',
    category: 'gardening',
    keywords: ['garden', 'gardening', 'plant', 'plants', 'hedge', 'lawn', 'prune', 'pruning', 'repot', 'pots', 'balcony garden', 'terrace garden', 'grass', 'kitchen garden'],
    items: [
      t('pruning_shears', 1, 'Trim stems and dead leaves'),
      t('hedge_trimmer', 1, 'Shape hedges quickly'),
      t('lawn_mower', 1, 'Cut the grass evenly'),
      t('leaf_blower', 1, 'Clear leaves and clippings'),
      t('garden_hose', 1, 'Water large areas'),
      t('watering_can', 1, 'Gentle watering for pots'),
      t('plant_pots', 4, 'New homes for plants'),
      t('potting_soil', 2, 'Fresh nutrient-rich soil'),
      t('garden_gloves', 1, 'Protect hands from thorns and soil'),
      t('extension_cord', 1, 'Power for electric garden tools'),
      t('step_ladder', 1, 'Reach tall hedges'),
    ],
  },
  {
    id: 'baking',
    title: 'Baking',
    category: 'kitchen',
    keywords: ['bake', 'baking', 'cake', 'cookies', 'cupcakes', 'bread', 'brownies', 'birthday cake', 'pastry'],
    items: [
      t('stand_mixer', 1, 'Whip batter and knead dough'),
      t('measuring_cups', 1, 'Accurate quantities'),
      t('cake_tins', 2, 'Bake cake layers'),
      t('baking_trays', 2, 'Cookies and pastries'),
      t('piping_bags', 1, 'Frosting and decoration'),
      t('rolling_pin', 1, 'Roll out dough'),
      t('blender', 1, 'Purées, sauces and fillings'),
      t('serving_set', 1, 'Present the finished bake'),
      t('cooler_box', 1, 'Carry cream cakes safely'),
      t('cleaning_detergent', 1, 'Clean up afterwards'),
    ],
  },
  {
    id: 'cooking_for_guests',
    title: 'Cooking for guests',
    category: 'kitchen',
    keywords: ['cook', 'cooking', 'dinner', 'lunch', 'pooja', 'puja', 'guests', 'biryani', 'feast', 'potluck', 'langar', 'catering'],
    items: [
      t('large_cooking_pot', 2, 'Cook in bulk'),
      t('pressure_cooker', 1, 'Dal, rice and quick cooking'),
      t('blender', 1, 'Grind masalas and chutneys'),
      t('rolling_pin', 1, 'Rotis and puris'),
      t('measuring_cups', 1, 'Scale recipes up correctly'),
      t('serving_set', 3, 'Serve dishes to guests'),
      t('folding_table', 1, 'Buffet table'),
      t('folding_chairs', 6, 'Extra seating'),
      t('cooler_box', 1, 'Keep drinks and raita cold'),
      t('cleaning_detergent', 1, 'Wash up afterwards'),
    ],
  },
  {
    id: 'moving_house',
    title: 'Moving house',
    category: 'moving',
    keywords: ['move', 'moving', 'shift', 'shifting', 'relocate', 'relocation', 'pack', 'packing', 'new flat', 'house shifting'],
    items: [
      t('moving_boxes', 20, 'Pack belongings'),
      t('packing_tape', 4, 'Seal boxes securely'),
      t('bubble_wrap', 2, 'Protect glass and electronics'),
      t('moving_blankets', 4, 'Wrap furniture'),
      t('hand_truck', 1, 'Move heavy boxes and appliances'),
      t('sketch_markers', 1, 'Label boxes by room'),
      t('craft_scissors', 1, 'Cut tape and wrap'),
      t('screwdriver_set', 1, 'Take apart furniture'),
      t('allen_keys', 1, 'Flat-pack furniture bolts'),
      t('measuring_tape', 1, 'Check doorways and furniture sizes'),
      t('work_gloves', 1, 'Grip and protect hands'),
      t('step_ladder', 1, 'Take down curtains and lights'),
    ],
  },
  {
    id: 'camping_trip',
    title: 'Camping or outdoor trip',
    category: 'sports',
    keywords: ['camp', 'camping', 'trek', 'trekking', 'trip', 'picnic', 'cycling', 'hike', 'hiking', 'outdoor', 'weekend getaway'],
    items: [
      t('camping_tent', 1, 'Shelter for the night'),
      t('sleeping_bag', 2, 'Warm sleep outdoors'),
      t('cooler_box', 1, 'Keep food and drinks fresh'),
      t('folding_chairs', 2, 'Sit around the campsite'),
      t('folding_table', 1, 'Cook and eat comfortably'),
      t('fairy_lights', 1, 'Campsite lighting'),
      t('party_speaker', 1, 'Music outdoors'),
      t('badminton_set', 1, 'Games for the group'),
      t('bicycle', 1, 'Explore nearby trails'),
      t('tripod', 1, 'Group photos'),
    ],
  },
  {
    id: 'laptop_issue',
    title: 'Laptop problem',
    category: 'electronics',
    keywords: ['laptop', 'computer', 'pc', 'notebook', 'slow laptop', 'battery'],
    items: [
      t('laptop_machine', 1, 'A replacement or loaner laptop while yours is repaired'),
      t('screwdriver_set', 1, 'Open the back panel (only if out of warranty)'),
      t('microfiber_cloth', 1, 'Clean screen and keyboard'),
      t('power_strip', 1, 'Surge-protected charging'),
      t('extension_cord', 1, 'Reach a working socket'),
      t('multimeter', 1, 'Check the charger output'),
      t('tool_kit', 1, 'General small tools'),
      t('cleaning_detergent', 1, 'Electronics-safe screen cleaner'),
    ],
  },
];

const GENERIC: TaskTemplate = {
  id: 'generic',
  title: 'General household task',
  category: 'general',
  keywords: [],
  items: [
    t('tool_kit', 1, 'Basic tools for most jobs'),
    t('screwdriver_set', 1, 'Screws and fittings'),
    t('hammer', 1, 'Nails and fittings'),
    t('plier_set', 1, 'Grip, bend and cut'),
    t('measuring_tape', 1, 'Measure before you start'),
    t('step_ladder', 1, 'Reach high places safely'),
    t('extension_cord', 1, 'Power where you need it'),
    t('work_gloves', 1, 'Protect hands'),
    t('safety_glasses', 1, 'Protect eyes'),
    t('microfiber_cloth', 2, 'Clean up afterwards'),
  ],
};

function hasKeyword(text: string, keyword: string): boolean {
  return new RegExp(`(^|[^a-z])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(text);
}

function scoreTemplate(text: string, template: TaskTemplate): number {
  return template.keywords.reduce((sum, k) => sum + (hasKeyword(text, k) ? (k.includes(' ') ? 2 : 1) : 0), 0);
}

/** Templates ranked by keyword match against the task (best first); never empty. */
export function rankTemplates(task: string): TaskTemplate[] {
  const text = task.toLowerCase();
  const ranked = TASK_TEMPLATES.map((tpl) => ({ tpl, score: scoreTemplate(text, tpl) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.tpl);
  return ranked.length > 0 ? ranked : [GENERIC];
}

let seq = 0;

export function catalogChecklistItem(
  key: string,
  qty: number,
  reason: string,
  source: PlanChecklistItem['source'],
  nameOverride?: string
): PlanChecklistItem {
  const cat = getCatalogItem(key) || matchCatalogItem(nameOverride || key);
  const name = nameOverride || cat?.name || key.replace(/_/g, ' ');
  const safety = evaluateItemSafety(`${name} ${key.replace(/_/g, ' ')}`);
  const isConsumable = cat ? cat.consumable : safety.isConsumable;
  return {
    id: `item_${Date.now()}_${++seq}`,
    itemKey: cat?.itemKey || key,
    name,
    neededQuantity: qty,
    ownedQuantity: 0,
    missingQuantity: qty,
    reason,
    isConsumable,
    safetyClass: safety.safetyClass !== 'none' && safety.safetyClass !== 'consumable' ? safety.safetyClass : isConsumable ? 'consumable' : 'none',
    source,
    category: cat?.category,
    imageUrl: resolveItemImage(cat?.itemKey || key, name, cat?.category),
  };
}

const ITEM_REQUEST_LEAD = /^(?:i\s+)?(?:need|want|looking\s+for|require|search(?:ing)?\s+for|borrow|rent|buy|get|find)\b(?:\s+(?:a|an|the|some|to\s+borrow|to\s+rent|to\s+buy))?\s*/i;
const HINDI_NEED = /\s*(?:chahiye|chaiye|chahie|chahiya|chaahiye|chiye|chahye)(?:\s+(?:hai|he|tha|thi))?\s*$/i;
const HINDI_LEAD = /^(?:mujhe|meko|muje|mereko|mere\s+ko|hume|humko)\s+(?:ek\s+)?/i;
const TASK_WORDS =
  /\b(install|installation|mount|mounting|fix|repair|clean|cleaning|paint|painting|build|make|create|do|wash|dry|iron|dhona|dhoi|dhoni|dhone|dhulai|sukhana|pakana|sajana|organi[sz]e|plan|party|shift|shifting|move|moving|assemble|decorate|cook|cooking|bake|baking|celebrate|trip|camping|gardening|drawing|lagana|lagwana|banana|saaf|theek|khelna|karna)\b/i;

const displayName = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => (w.length <= 2 && !/^(a|of|to|in|on)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');

export interface DirectItemRequest {
  name: string;
  item?: CatalogItem;
}

/**
 * Detects "I need X" style requests ("need washing machine", "RO chahiye") where the resident names
 * the item itself rather than a job. Those get the item, not a project checklist.
 */
export function parseDirectItemRequest(task: string): DirectItemRequest | null {
  const raw = task.trim().replace(/[.!?]+$/, '');
  if (!raw || raw.split(/\s+/).length > 7 || TASK_WORDS.test(raw)) return null;
  // Hinglish verb phrases ("dhoi he", "karna hai", "khelna hai") describe an action, not an item
  if (/\b\w+(?:na|ni|ne|i)\s+(?:he|hai|h)\b/i.test(raw)) return null;
  const withoutPronoun = raw.replace(HINDI_LEAD, '');
  // "mujhe/meko" alone is not a request; it needs need/want/chahiye
  const hasLead = ITEM_REQUEST_LEAD.test(withoutPronoun);
  const hasHindiNeed = HINDI_NEED.test(raw);
  const stripped = withoutPronoun.replace(ITEM_REQUEST_LEAD, '');
  // "want to create …" describes an action, not an item
  if (/^to\s/i.test(stripped)) return null;
  const name = stripped.replace(HINDI_NEED, '').replace(/^(?:a|an|the|ek)\s+/i, '').trim();
  if (!name || name.split(/\s+/).length > 4) return null;
  const item = matchCatalogItem(name);
  if (!hasLead && !hasHindiNeed && !item) return null;
  return { name: item?.name || displayName(name), item };
}

/** Checklist for a direct item request: just the named item. */
export function buildItemRequestChecklist(req: DirectItemRequest): { category: string; items: PlanChecklistItem[] } {
  const key = req.item?.itemKey || req.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return {
    category: req.item?.category || 'general',
    items: [catalogChecklistItem(key, 1, 'The item you asked for.', 'template', req.item ? undefined : req.name)],
  };
}

/**
 * Deterministic checklist from the best-matching template (used when AI is unavailable).
 * Secondary matching templates contribute up to 4 extra items so mixed tasks are covered.
 */
export function buildTemplateChecklist(task: string): { category: string; items: PlanChecklistItem[] } {
  const direct = parseDirectItemRequest(task);
  if (direct) return buildItemRequestChecklist(direct);
  const [best, ...rest] = rankTemplates(task);
  const items = best.items.map((i) => catalogChecklistItem(i.key, i.qty, i.reason, 'template'));
  const seen = new Set(items.map((i) => i.itemKey));
  let extra = 0;
  for (const tpl of rest) {
    for (const i of tpl.items) {
      if (extra >= 4 || seen.has(i.key)) continue;
      items.push(catalogChecklistItem(i.key, i.qty, i.reason, 'template'));
      seen.add(i.key);
      extra++;
    }
  }
  if (items.length < MIN_CHECKLIST_ITEMS) {
    items.push(...templateTopUp(task, seen, MIN_CHECKLIST_ITEMS - items.length));
  }
  return { category: best.category, items };
}

export const MIN_CHECKLIST_ITEMS = 10;

/** Template items that are not already in the plan, best match first. */
export function templateTopUp(task: string, excludeKeys: Set<string>, limit: number, onlyMatching = false): PlanChecklistItem[] {
  const out: PlanChecklistItem[] = [];
  // onlyMatching: pad an AI list only from the template that really fits the task, never the generic toolbox
  const templates = onlyMatching ? rankTemplates(task).filter((t) => t.id !== GENERIC.id).slice(0, 1) : [...rankTemplates(task), GENERIC];
  for (const tpl of templates) {
    for (const i of tpl.items) {
      if (out.length >= limit) return out;
      if (excludeKeys.has(i.key)) continue;
      excludeKeys.add(i.key);
      out.push(catalogChecklistItem(i.key, i.qty, i.reason, 'template'));
    }
  }
  return out;
}

/**
 * Deterministic "suggest more": items from templates matching the task plus the user's
 * description, and catalog search hits for the description's words.
 */
export function suggestMoreItems(task: string, prompt: string, excludeKeys: Set<string>, limit = 10): PlanChecklistItem[] {
  const out: PlanChecklistItem[] = [];
  const exclude = new Set(excludeKeys);
  const push = (key: string, qty: number, reason: string) => {
    if (out.length >= limit || exclude.has(key)) return;
    exclude.add(key);
    out.push(catalogChecklistItem(key, qty, reason, 'ai_suggested'));
  };

  const text = `${prompt} ${task}`.trim();
  for (const word of prompt.toLowerCase().split(/[,;\n]| and /).map((w) => w.trim()).filter(Boolean)) {
    const direct = matchCatalogItem(word) || searchCatalog(word, 1)[0];
    if (direct) push(direct.itemKey, 1, 'You asked for this.');
  }
  for (const tpl of rankTemplates(text)) {
    if (tpl.id === 'generic' && out.length > 0) break;
    for (const i of tpl.items) push(i.key, i.qty, i.reason);
  }
  if (out.length < limit) {
    const primary = rankTemplates(task)[0]?.category;
    for (const item of CATALOG.filter((c) => c.category === primary)) push(item.itemKey, 1, `Often used for ${primary} tasks`);
  }
  return out;
}
