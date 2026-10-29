import { ExternalShop, ShopItem } from '../types/shop';
import { CATALOG } from '../catalog/catalog';
import { ListingCategory } from '../types/listing';

// SAMPLE indicative new prices (INR) per catalog item. Shown with a SAMPLE badge; never real quotes.
const NEW_PRICE: Record<string, number> = {
  drawing_paper: 120, sketch_pencils: 180, colour_pencils: 250, watercolour_set: 450, glitter_pens: 220,
  coloured_paper: 150, paint_brushes: 300, tabletop_easel: 650, eraser_sharpener: 40, acrylic_paint_set: 550,
  canvas_board: 220, glue_sticks: 60, craft_scissors: 120, steel_ruler: 90, cutting_mat: 450, sketch_markers: 400,
  oil_pastels: 180, drawing_board: 350,
  drill_machine: 2450, drill_bits: 450, screws_plugs: 250, spirit_level: 450, stud_finder: 2800, measuring_tape: 220,
  hammer: 380, screwdriver_set: 550, allen_keys: 280, plier_set: 650, adjustable_wrench: 420, hand_saw: 580,
  orbital_sander: 3900, step_ladder: 3499, tool_kit: 1800, safety_glasses: 180, masking_tape: 110, work_gloves: 150,
  paint_roller: 280, wall_paint: 1450, paint_tray: 180, drop_cloth: 220, putty_knife: 120, sandpaper: 25, wall_brackets: 160,
  extension_cord: 650, power_strip: 750, laptop_machine: 48500, mini_projector: 12500, projector_screen: 3200,
  soldering_iron: 750, multimeter: 950,
  dslr_camera: 42000, tripod: 1800, ring_light: 1600, backdrop_stand: 3500,
  vacuum_wet_dry: 6500, pressure_washer: 7999, carpet_cleaner: 9500, microfiber_cloth: 180, mop_bucket: 1100,
  cleaning_detergent: 220, squeegee: 280, garment_steamer: 2200, scrub_brush: 120,
  hedge_trimmer: 3200, lawn_mower: 9500, leaf_blower: 2800, garden_hose: 900, pruning_shears: 450, garden_gloves: 150,
  plant_pots: 180, potting_soil: 120, watering_can: 350,
  folding_table: 2400, folding_chairs: 650, party_speaker: 3500, microphone: 1500, fairy_lights: 350, balloon_pump: 250,
  party_decorations: 450, serving_set: 1200, cooler_box: 1900,
  stand_mixer: 6500, baking_trays: 450, cake_tins: 400, measuring_cups: 250, piping_bags: 180, pressure_cooker: 1800,
  large_cooking_pot: 1600, blender: 3200, rolling_pin: 150,
  moving_boxes: 60, packing_tape: 90, bubble_wrap: 350, hand_truck: 2800, moving_blankets: 450,
  camping_tent: 3500, sleeping_bag: 1800, bicycle: 12500, badminton_set: 900,
};

// SAMPLE starting prices for repair services
const REPAIR_FROM: Record<string, number> = {
  laptop_machine: 1500, mini_projector: 1200, dslr_camera: 2000,
  vacuum_wet_dry: 600, pressure_washer: 700, garment_steamer: 400, blender: 350, stand_mixer: 500,
  drill_machine: 450, orbital_sander: 450, lawn_mower: 800,
  bicycle: 300,
};

function retail(categories: ListingCategory[], only?: string[]): ShopItem[] {
  return CATALOG.filter((c) => (only ? only.includes(c.itemKey) : categories.includes(c.category)))
    .filter((c) => NEW_PRICE[c.itemKey] !== undefined)
    .map((c) => ({ itemKey: c.itemKey, itemName: `${c.name} (new)`, priceNew: NEW_PRICE[c.itemKey], inStock: true, service: 'buy_new' as const }));
}

function repairs(keys: string[]): ShopItem[] {
  return keys.map((key) => {
    const c = CATALOG.find((i) => i.itemKey === key)!;
    return { itemKey: key, itemName: `${c.name} repair service`, priceNew: REPAIR_FROM[key], inStock: true, service: 'repair' as const, notes: 'Starting price; final quote after inspection.' };
  });
}

const PAINT_KEYS = ['wall_paint', 'paint_roller', 'paint_tray', 'drop_cloth', 'putty_knife', 'sandpaper', 'masking_tape', 'screws_plugs', 'wall_brackets'];

const RAW_SEED_SHOPS: ExternalShop[] = [
  {
    id: 'shop_tools_new',
    name: 'National Hardware & Tool Mart',
    category: 'Hardware & Tools',
    kind: 'retail',
    address: 'Shop 4, Main Market Road, Palm Avenue',
    distanceKm: 1.2,
    phone: '+91 98111 22201',
    items: retail(['diy']).filter((i) => !PAINT_KEYS.includes(i.itemKey) || i.itemKey === 'screws_plugs'),
  },
  {
    id: 'shop_paint_depot',
    name: 'Colour Hub Paints & Supplies',
    category: 'Paints & Consumables',
    kind: 'retail',
    address: '12 Cross Junction, Sector 4',
    distanceKm: 0.8,
    phone: '+91 98111 33302',
    items: retail([], PAINT_KEYS),
  },
  {
    id: 'shop_art_stationery',
    name: 'Rangrez Art & Stationery',
    category: 'Art & Stationery',
    kind: 'retail',
    address: 'Ground Floor, Palm Plaza, Sector 3',
    distanceKm: 0.6,
    phone: '+91 98111 66606',
    items: retail(['art']),
  },
  {
    id: 'shop_party_supplies',
    name: 'Utsav Party & Event Supplies',
    category: 'Party & Events',
    kind: 'retail',
    address: '8 Celebration Lane, Old Market',
    distanceKm: 2.4,
    phone: '+91 98111 77707',
    items: retail(['party']),
  },
  {
    id: 'shop_home_kitchen',
    name: 'Annapurna Kitchenware',
    category: 'Kitchen & Baking',
    kind: 'retail',
    address: '21 Market Street, Sector 5',
    distanceKm: 1.0,
    phone: '+91 98111 88808',
    items: retail(['kitchen']),
  },
  {
    id: 'shop_cleaning_supplies',
    name: 'SparkleHome Cleaning Supplies',
    category: 'Cleaning',
    kind: 'retail',
    address: 'Shop 11, Palm Avenue Complex',
    distanceKm: 0.9,
    phone: '+91 98111 99909',
    items: retail(['cleaning']),
  },
  {
    id: 'shop_green_nursery',
    name: 'Palm Grove Green Agro Nursery',
    category: 'Gardening & Landscape',
    kind: 'retail',
    address: 'Gate 2 Bypass Road, Near Society West Gate',
    distanceKm: 1.5,
    phone: '+91 98111 44403',
    items: retail(['gardening']),
  },
  {
    id: 'shop_electronics_store',
    name: 'Digital Point Electronics & Cameras',
    category: 'Electronics & Photo',
    kind: 'retail',
    address: 'Cyber Plaza, Ground Floor',
    distanceKm: 2.1,
    phone: '+91 98111 12121',
    items: retail(['electronics', 'photo']),
  },
  {
    id: 'shop_movers_sports',
    name: 'Velo Cycles, Sports & Packing',
    category: 'Sports, Outdoors & Moving',
    kind: 'retail',
    address: '3 Stadium Road, Sector 6',
    distanceKm: 2.8,
    phone: '+91 98111 23232',
    items: retail(['sports', 'moving']),
  },
  {
    id: 'shop_tech_repairs',
    name: 'Infotech Laptop & Gadget Clinic',
    category: 'Laptop & Electronics Repair',
    kind: 'repair',
    address: 'Cyber Plaza, 2nd Floor, Office 204',
    distanceKm: 2.1,
    phone: '+91 98111 55504',
    items: repairs(['laptop_machine', 'mini_projector', 'dslr_camera']),
  },
  {
    id: 'shop_appliance_repair',
    name: 'FixIt Appliance & Tool Repair',
    category: 'Appliance & Power Tool Repair',
    kind: 'repair',
    address: '17 Service Lane, Sector 2',
    distanceKm: 1.7,
    phone: '+91 98111 34343',
    items: repairs(['vacuum_wet_dry', 'pressure_washer', 'garment_steamer', 'blender', 'stand_mixer', 'drill_machine', 'orbital_sander', 'lawn_mower']),
  },
  {
    id: 'shop_cycle_repair',
    name: 'Velo Cycle Repair Bay',
    category: 'Bicycle Repair',
    kind: 'repair',
    address: '3 Stadium Road, Sector 6 (rear entrance)',
    distanceKm: 2.8,
    phone: '+91 98111 45454',
    items: repairs(['bicycle']),
  },
];

export const SEED_SHOPS: ExternalShop[] = RAW_SEED_SHOPS.map((s) => ({ ...s, isSample: true }));
