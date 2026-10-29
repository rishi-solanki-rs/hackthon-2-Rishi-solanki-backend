import { Listing, ListingCategory, ListingCondition, ListingMode, ModerationStatus } from '../types/listing';
import { getCatalogItem } from '../catalog/catalog';
import { SEED_USERS } from './users.seed';

interface ExtraOptions {
  qty?: number;
  description?: string;
  moderation?: ModerationStatus;
  rejectionReason?: string;
  deposit?: number;
  pickup?: string;
  category?: ListingCategory;
}

let day = 0;

function L(
  id: string,
  ownerId: string,
  itemKey: string,
  title: string,
  mode: ListingMode,
  price: number | null,
  condition: ListingCondition,
  opts: ExtraOptions = {}
): Listing {
  const owner = SEED_USERS.find((u) => u.id === ownerId)!;
  const cat = getCatalogItem(itemKey);
  day += 1;
  const createdAt = new Date(Date.UTC(2026, 2, 1) + day * 2 * 86400000).toISOString();
  return {
    id,
    ownerId,
    itemKey,
    title,
    description: opts.description || `${title}. ${mode === 'lend' ? 'Free to borrow for neighbours.' : mode === 'rent' ? 'Available for short rentals.' : 'Selling to a neighbour who will use it.'}`,
    category: opts.category || cat?.category || 'general',
    mode,
    price: mode === 'lend' ? null : price,
    priceUnit: mode === 'lend' ? null : mode === 'rent' ? 'day' : 'item',
    condition,
    totalQuantity: opts.qty ?? 1,
    status: 'active',
    moderationStatus: opts.moderation || 'approved',
    rejectionReason: opts.rejectionReason,
    reportsCount: 0,
    reportedBy: [],
    pickupNote: opts.pickup || `Pick up from ${owner.tower}, evenings after 6 PM.`,
    comfortRules: { returnClean: true, noCommercialUse: true, ...(opts.deposit ? { depositRequired: true, depositAmount: opts.deposit } : {}) },
    photos: [],
    ownerDisplayName: owner.displayName,
    ownerTower: owner.tower,
    createdAt,
    updatedAt: createdAt,
  };
}

export const EXTRA_SEED_LISTINGS: Listing[] = [
  // Art & stationery
  L('lst_colour_pencils_ananya', 'usr_ananya', 'colour_pencils', '48-Colour Pencil Set (half used)', 'sell_used', 120, 'good'),
  L('lst_colour_pencils_priya', 'usr_priya', 'colour_pencils', '24 Colour Pencils in Tin', 'sell_used', 90, 'fair'),
  L('lst_sketch_pencils_ananya', 'usr_ananya', 'sketch_pencils', 'Graphite Sketching Pencils 2H–8B', 'sell_used', 80, 'like_new'),
  L('lst_watercolour_ananya', 'usr_ananya', 'watercolour_set', 'Watercolour Pan Set (24 colours)', 'sell_used', 220, 'good'),
  L('lst_glitter_pens_sana', 'usr_sana', 'glitter_pens', 'Glitter Gel Pens, 20 colours', 'sell_used', 100, 'like_new'),
  L('lst_coloured_paper_sana', 'usr_sana', 'coloured_paper', 'Coloured Craft Paper (50 sheets)', 'sell_used', 60, 'like_new', { qty: 2 }),
  L('lst_drawing_paper_ananya', 'usr_ananya', 'drawing_paper', 'A3 Cartridge Drawing Sheets (pack of 25)', 'sell_used', 70, 'like_new', { qty: 3 }),
  L('lst_brushes_ananya', 'usr_ananya', 'paint_brushes', 'Artist Brush Set (12 brushes)', 'lend', null, 'good'),
  L('lst_brushes_kavya', 'usr_kavya', 'paint_brushes', 'Round & Flat Brush Set', 'rent', 20, 'fair'),
  L('lst_easel_ananya', 'usr_ananya', 'tabletop_easel', 'Wooden Tabletop Easel', 'lend', null, 'good'),
  L('lst_easel_arjun', 'usr_arjun', 'tabletop_easel', 'Adjustable Field Easel', 'rent', 40, 'good'),
  L('lst_acrylic_priya', 'usr_priya', 'acrylic_paint_set', 'Acrylic Paints, 12 tubes (some used)', 'sell_used', 200, 'fair'),
  L('lst_canvas_ananya', 'usr_ananya', 'canvas_board', 'Blank Canvas Boards 30×40 cm (pack of 3)', 'sell_used', 150, 'like_new'),
  L('lst_scissors_sana', 'usr_sana', 'craft_scissors', 'Craft Scissors with Pattern Blades', 'lend', null, 'good'),
  L('lst_ruler_karan', 'usr_karan', 'steel_ruler', '30 cm Steel Ruler', 'lend', null, 'good'),
  L('lst_cutting_mat_ananya', 'usr_ananya', 'cutting_mat', 'A3 Self-healing Cutting Mat', 'lend', null, 'like_new'),
  L('lst_markers_kavya', 'usr_kavya', 'sketch_markers', 'Dual-tip Sketch Markers (36)', 'sell_used', 350, 'like_new'),
  L('lst_markers_amit', 'usr_amit', 'sketch_markers', 'Felt Tip Marker Set (24)', 'sell_used', 150, 'good'),
  L('lst_oil_pastels_priya', 'usr_priya', 'oil_pastels', 'Oil Pastels, 25 shades', 'sell_used', 80, 'good'),
  L('lst_drawing_board_arjun', 'usr_arjun', 'drawing_board', 'A3 Drawing Board with Clip', 'lend', null, 'good'),
  L('lst_glue_sana', 'usr_sana', 'glue_sticks', 'Glue Sticks, unused (pack of 4)', 'sell_used', 40, 'like_new'),
  L('lst_eraser_ananya', 'usr_ananya', 'eraser_sharpener', 'Eraser & Metal Sharpener Kit', 'sell_used', 20, 'like_new'),

  // DIY & tools
  L('lst_tool_kit_arjun', 'usr_arjun', 'tool_kit', 'Home Tool Kit (108 pieces)', 'rent', 50, 'good'),
  L('lst_paint_tray_meera', 'usr_meera', 'paint_tray', 'Roller Paint Tray', 'lend', null, 'good'),
  L('lst_drop_cloth_deepa', 'usr_deepa', 'drop_cloth', 'Reusable Canvas Drop Sheet', 'lend', null, 'good'),
  L('lst_putty_knife_vikram', 'usr_vikram', 'putty_knife', 'Putty Knife Set (3 sizes)', 'lend', null, 'fair'),
  L('lst_wall_paint_sana', 'usr_sana', 'wall_paint', 'Leftover Interior Emulsion, 4 L (off-white)', 'sell_used', 500, 'good'),
  L('lst_work_gloves_karan', 'usr_karan', 'work_gloves', 'Work Gloves (pair)', 'lend', null, 'good', { qty: 2 }),
  L('lst_stud_finder_amit', 'usr_amit', 'stud_finder', 'Wall & Pipe Scanner', 'rent', 80, 'good', { deposit: 500 }),
  L('lst_level_karan', 'usr_karan', 'spirit_level', '60 cm Spirit Level', 'rent', 30, 'good'),

  // Electronics & photo
  L('lst_projector_arjun', 'usr_arjun', 'mini_projector', 'Portable LED Projector (1080p)', 'rent', 450, 'good', { deposit: 2000 }),
  L('lst_cord_amit', 'usr_amit', 'extension_cord', '10 m Extension Reel', 'lend', null, 'good'),
  L('lst_dslr_arjun', 'usr_arjun', 'dslr_camera', 'DSLR Camera with 18–55 mm Lens', 'rent', 800, 'good', { deposit: 5000 }),
  L('lst_backdrop_arjun', 'usr_arjun', 'backdrop_stand', 'Backdrop Stand with Grey Paper', 'rent', 250, 'good'),
  L('lst_laptop_rent_karan', 'usr_karan', 'laptop_machine', 'Spare Laptop for Short Loans (i5, 8 GB)', 'rent', 400, 'fair', { deposit: 5000 }),

  // Cleaning
  L('lst_vacuum_meera', 'usr_meera', 'vacuum_wet_dry', 'Wet & Dry Vacuum 20 L', 'lend', null, 'good'),
  L('lst_squeegee_meera', 'usr_meera', 'squeegee', 'Window Squeegee with Pole', 'lend', null, 'good'),
  L('lst_steamer_sana', 'usr_sana', 'garment_steamer', 'Handheld Garment Steamer', 'rent', 100, 'like_new'),
  L('lst_carpet_used_kavya', 'usr_kavya', 'carpet_cleaner', 'Carpet Spot Cleaner', 'sell_used', 4200, 'good'),
  L('lst_scrub_brush_meera', 'usr_meera', 'scrub_brush', 'Stiff Scrub Brush', 'lend', null, 'good'),

  // Gardening
  L('lst_watering_can_priya', 'usr_priya', 'watering_can', '5 L Watering Can', 'lend', null, 'good'),
  L('lst_pots_meera', 'usr_meera', 'plant_pots', 'Terracotta Pots (set of 6)', 'sell_used', 300, 'good'),
  L('lst_garden_gloves_priya', 'usr_priya', 'garden_gloves', 'Garden Gloves', 'lend', null, 'good'),
  L('lst_soil_meera', 'usr_meera', 'potting_soil', 'Potting Mix 10 kg (unopened)', 'sell_used', 100, 'like_new'),

  // Party & events
  L('lst_fairy_lights_kavya', 'usr_kavya', 'fairy_lights', 'Warm White Fairy Lights 10 m', 'lend', null, 'good', { qty: 4 }),
  L('lst_balloon_pump_sana', 'usr_sana', 'balloon_pump', 'Balloon Pump', 'lend', null, 'like_new'),
  L('lst_decor_sana', 'usr_sana', 'party_decorations', 'Birthday Decoration Kit (unused)', 'sell_used', 200, 'like_new'),

  // Kitchen & baking
  L('lst_mixer_kavya', 'usr_kavya', 'stand_mixer', 'Stand Mixer 5 L', 'rent', 250, 'good', { deposit: 1000 }),
  L('lst_baking_trays_kavya', 'usr_kavya', 'baking_trays', 'Baking Trays (set of 2)', 'lend', null, 'good'),
  L('lst_cake_tins_kavya', 'usr_kavya', 'cake_tins', 'Round Cake Tins 8-inch (pair)', 'lend', null, 'good'),
  L('lst_measuring_cups_priya', 'usr_priya', 'measuring_cups', 'Measuring Cups & Spoons', 'lend', null, 'like_new'),
  L('lst_piping_kavya', 'usr_kavya', 'piping_bags', 'Piping Bags & 12 Nozzles (new)', 'sell_used', 90, 'like_new'),
  L('lst_big_pot_vikram', 'usr_vikram', 'large_cooking_pot', '15 L Stock Pot', 'lend', null, 'good'),
  L('lst_blender_amit', 'usr_amit', 'blender', 'Blender 1.5 L', 'rent', 80, 'good'),
  L('lst_rolling_pin_deepa', 'usr_deepa', 'rolling_pin', 'Rolling Pin & Board', 'lend', null, 'good'),

  // Moving & packing
  L('lst_boxes_karan', 'usr_karan', 'moving_boxes', 'Sturdy Moving Boxes (20)', 'sell_used', 400, 'good'),
  L('lst_blankets_karan', 'usr_karan', 'moving_blankets', 'Moving Blankets (set of 4)', 'lend', null, 'good'),
  L('lst_bubble_wrap_sana', 'usr_sana', 'bubble_wrap', 'Bubble Wrap Roll (half left)', 'sell_used', 120, 'good'),

  // Sports & outdoors
  L('lst_tent_free_arjun', 'usr_arjun', 'camping_tent', '4-Person Dome Tent', 'lend', null, 'good'),
  L('lst_cycle_used_meera', 'usr_meera', 'bicycle', 'City Bicycle with Basket', 'sell_used', 4500, 'good'),

  // Moderation demo: awaiting admin approval / rejected
  L('lst_pending_ring_light_kavya', 'usr_kavya', 'ring_light', 'Mini Ring Light for Phone Videos', 'rent', 60, 'like_new', { moderation: 'pending_review' }),
  L('lst_pending_mic_karan', 'usr_karan', 'microphone', 'Clip-on Lapel Microphone', 'lend', null, 'good', { moderation: 'pending_review' }),
  L('lst_pending_cricket_kit', 'usr_karan', 'cricket_kit', 'Junior Cricket Kit (bat, pads, gloves)', 'rent', 100, 'good', { moderation: 'pending_review', category: 'sports' }),
  L('lst_rejected_thinner_vikram', 'usr_vikram', 'paint_thinner', 'Paint Thinner, half bottle', 'sell_used', 80, 'unknown', {
    moderation: 'rejected',
    category: 'diy',
    rejectionReason: 'Flammable solvents cannot be shared on Sidekit (hazardous chemical policy).',
  }),
];
