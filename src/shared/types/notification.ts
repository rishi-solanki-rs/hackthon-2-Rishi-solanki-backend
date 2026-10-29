export type NotificationType =
  | 'request_received'
  | 'request_accepted'
  | 'request_declined'
  | 'request_cancelled'
  | 'handover_reminder'
  | 'return_due'
  | 'listing_reported'
  | 'listing_hidden'
  | 'thank_you';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

