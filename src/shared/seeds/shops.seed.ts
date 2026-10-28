import { ExternalShop } from '../types/shop';

export const SEED_SHOPS: ExternalShop[] = [
  {
    id: 'shop_tools_new',
    name: 'National Hardware & Tool Mart',
    category: 'Hardware & Tools',
    address: 'Shop 4, Main Market Road, Palm Avenue',
    distanceKm: 1.2,
    phone: '+91 98111 22201',
    items: [
      {
        itemKey: 'drill_machine',
        itemName: 'Bosch GSB 500W Impact Drill Kit (Brand New)',
        priceNew: 2450,
        inStock: true,
        notes: 'Includes 1-year manufacturer warranty and auxiliary handle.',
      },
      {
        itemKey: 'pressure_washer',
        itemName: 'Bosch Aquatak 120 High-Pressure Cleaner (Brand New)',
        priceNew: 7999,
        inStock: true,
      },
      {
        itemKey: 'step_ladder',
        itemName: 'Bathla 5-Step Aluminium Ladder (Brand New)',
        priceNew: 3499,
        inStock: true,
      },
      {
        itemKey: 'extension_cord',
        itemName: 'Anchor 10A Heavy Extension Cord (Brand New)',
        priceNew: 650,
        inStock: true,
      },
      {
        itemKey: 'hand_saw',
        itemName: 'Stanley Cross-Cut Hand Wood Saw (Brand New)',
        priceNew: 580,
        inStock: true,
      },
    ],
  },
  {
    id: 'shop_paint_depot',
    name: 'Asian Paints & Color Hub',
    category: 'Paints & Consumables',
    address: '12 Cross Junction, Sector 4',
    distanceKm: 0.8,
    phone: '+91 98111 33302',
    items: [
      {
        itemKey: 'masking_tape',
        itemName: '3M Precision Painter Masking Tape (Brand New)',
        priceNew: 110,
        inStock: true,
      },
      {
        itemKey: 'screws_plugs',
        itemName: 'Fischer Nylon Wall Plug & Screw Set (Brand New)',
        priceNew: 250,
        inStock: true,
      },
      {
        itemKey: 'microfiber_cloth',
        itemName: 'Scotch-Brite Microfiber Cloth 3-Pack (Brand New)',
        priceNew: 180,
        inStock: true,
      },
    ],
  },
  {
    id: 'shop_green_nursery',
    name: 'Palm Grove Green Agro Nursery',
    category: 'Gardening & Landscape',
    address: 'Gate 2 Bypass Road, Near Society West Gate',
    distanceKm: 1.5,
    phone: '+91 98111 44403',
    items: [
      {
        itemKey: 'hedge_trimmer',
        itemName: 'Falcon Garden Hedge Shears (Brand New)',
        priceNew: 1200,
        inStock: true,
      },
      {
        itemKey: 'lawn_mower',
        itemName: 'Makita Corded Electric Lawn Mower (Brand New)',
        priceNew: 9500,
        inStock: true,
      },
    ],
  },
  {
    id: 'shop_tech_repairs',
    name: 'Infotech Laptop & Gadget Clinic',
    category: 'Laptop & Electronics Repair',
    address: 'Cyber Plaza, 2nd Floor, Office 204',
    distanceKm: 2.1,
    phone: '+91 98111 55504',
    items: [
      {
        itemKey: 'laptop_machine',
        itemName: 'Lenovo ThinkPad E14 Gen 4 (Brand New)',
        priceNew: 48500,
        inStock: true,
        notes: 'Commercial warranty 3 years onsite.',
      },
    ],
  },
];

