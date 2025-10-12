import { clsx } from 'clsx';
import { Bell, Check, ChevronDown, X } from 'lucide-react';
import { FC, MouseEvent } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  read: boolean;
}

export interface NotificationsPanelProps {
  notifications?: Notification[];
  onClose?: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationsPanel: FC<NotificationsPanelProps> = ({
  notifications = [], // Provide default empty array
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}) => {
  const getNotificationTypeColor = (type: Notification['type']): string => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getNotificationRowClasses = (notification: Notification): string => {
    const baseClasses = 'flex items-start gap-4 p-4 rounded-lg transition-colors';
    if (notification.read) return clsx(baseClasses, 'bg-slate-900/30 border-slate-800');

    switch (notification.type) {
      case 'success':
        return clsx(baseClasses, 'bg-green-50 dark:bg-green-500/10');
      case 'warning':
        return clsx(baseClasses, 'bg-yellow-50 dark:bg-yellow-500/10');
      case 'error':
        return clsx(baseClasses, 'bg-red-50 dark:bg-red-500/10');
      default:
        return clsx(baseClasses, 'bg-blue-50 dark:bg-blue-500/10');
    }
  };

  const getTimeString = (date: Date): string => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-32 z-50"
      onClick={(e: MouseEvent) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
          <div className="flex items-center gap-2">
            {/* Mark all as read */}
            {onMarkAllAsRead && (
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-800"
                onClick={() => onMarkAllAsRead()}
              >
                <Check className="w-5 h-5" />
              </button>
            )}
            {/* Close button */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-800"
              onClick={() => onClose?.()}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={getNotificationRowClasses(n)}
                onClick={() => onNotificationClick?.(n)}
              >
                {/* Type indicator */}
                <span
                  className={clsx('w-2 h-2 mt-2 rounded-full', getNotificationTypeColor(n.type))}
                />

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-white">{n.title}</h4>
                    <time className="text-xs text-gray-400">{getTimeString(n.createdAt)}</time>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">{n.message}</p>
                </div>

                {/* Read indicator & actions */}
                <div className="flex items-center gap-2">
                  {!n.read && onMarkAsRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead?.(n.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
