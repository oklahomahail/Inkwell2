import { clsx } from 'clsx';
import { Bell } from 'lucide-react';
import { useState } from 'react';

import type { Notification } from '@/types/notifications';
import devLog from '@/utils/devLog';

import { NotificationsPanel } from './NotificationsPanel';

// Mock notifications - replace with real data later
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to Inkwell',
    message: 'Get started with our quick tour of features.',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: '2',
    title: 'Autosave Enabled',
    message: 'Your work will now be saved automatically.',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
];

interface TopbarBellProps {
  className?: string;
}

export default function TopbarBell({ className = '' }: TopbarBellProps) {
  // State
  const [notifications] = useState<Notification[]>(mockNotifications);

  // Handlers
  const handleMarkAsRead = (id: string) => {
    devLog.debug('Mark as read:', id);
  };

  const handleMarkAllAsRead = () => {
    devLog.debug('Mark all as read');
  };

  const handleNotificationClick = (notification: Notification) => {
    devLog.debug('Clicked notification:', notification);
  };
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className={`relative rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      >
        <Bell className="w-5 h-5" />

        {/* Notification badge */}
        {notifications.some((n) => !n.read) && (
          <span
            className={clsx(
              'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center',
              'rounded-full bg-red-600 text-xs font-medium text-white dark:text-gray-100',
            )}
          >
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </button>

      {open && (
        <NotificationsPanel
          notifications={notifications}
          onClose={() => setOpen(false)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNotificationClick={handleNotificationClick}
        />
      )}
    </>
  );
}
