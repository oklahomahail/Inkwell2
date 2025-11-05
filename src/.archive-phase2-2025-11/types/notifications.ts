export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  link?: string; // Optional URL to navigate to when clicked
  actionLabel?: string; // Optional label for the action button
  onAction?: () => void; // Optional callback for the action button
  groupId?: string; // Optional group ID for related notifications
  category?: string; // Optional category for filtering
}

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: Notification[];
  collapsed?: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  categories: {
    [key: string]: boolean;
  };
}

export interface NotificationFilter {
  type?: NotificationType;
  read?: boolean;
  category?: string;
  groupId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  groups: NotificationGroup[];
}
