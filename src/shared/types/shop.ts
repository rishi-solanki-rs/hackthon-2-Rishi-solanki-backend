export interface ShopItem {
  itemKey: string;
  itemName: string;
  priceNew: number;
  inStock: boolean;
  notes?: string;
}

export interface ExternalShop {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceKm: number;
  phone: string;
  items: ShopItem[];
  isSample?: boolean; // Seeded demo shop and prices; UI must show a SAMPLE badge
}

