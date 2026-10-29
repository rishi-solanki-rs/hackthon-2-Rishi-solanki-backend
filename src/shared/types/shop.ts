export interface ShopItem {
  itemKey: string;
  itemName: string;
  priceNew: number; // For repair services: the starting ("from") price
  inStock: boolean;
  notes?: string;
  service?: 'buy_new' | 'repair';
}

export interface ExternalShop {
  id: string;
  name: string;
  category: string;
  kind?: 'retail' | 'repair';
  address: string;
  distanceKm: number;
  phone: string;
  items: ShopItem[];
  isSample?: boolean; // Seeded demo shop and prices; UI must show a SAMPLE badge
}
