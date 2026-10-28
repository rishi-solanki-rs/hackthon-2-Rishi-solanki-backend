export interface User {
  id: string;
  name: string;
  displayName: string; // e.g. "Rishi S."
  email: string;
  phone: string;       // e.g. "+91 98765 43210"
  flat: string;        // e.g. "A-402"
  tower: string;       // e.g. "Tower A"
  role: 'member' | 'admin';
  rating: number;      // e.g. 4.9
  reviewCount: number;
  itemsSharedCount: number;
  totalEstimatedSavings: number; // in INR
  avatarUrl?: string;
  bio?: string;
  joinedAt: string;
  thankYouNotes?: Array<{
    id: string;
    fromUserId: string;
    fromUserName: string;
    message: string;
    createdAt: string;
  }>;
}

export interface DemoPersona {
  id: string;
  name: string;
  displayName: string;
  role: 'requester' | 'owner' | 'hybrid' | 'admin';
  tower: string;
  flat: string;
  description: string;
}

