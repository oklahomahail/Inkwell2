// src/components/Modals/NotificationsModal.tsx
import { X, Bell, Check, AlertCircle, Info } from 'lucide-react';
import React from 'react';

import devLog from "@/utils/devLog";

import type { Notification } from '@/types/notifications';

interface NotificationsModalProps {
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Project saved',
    message: 'Your changes have been saved successfully.',
    createdAt: new Date(Date.now() - 2 * 60000),
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'Writing goal achieved',
    message: "Congratulations! You've reached your daily writing goal of 500 words.",
    createdAt: new Date(Date.now() - 60 * 60000),
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Backup reminder',
    message: "Don't forget to back up your work regularly.",
    createdAt: new Date(Date.now() - 3 * 60 * 60000),
    read: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <Check className="w-4 h-4 text-green-600" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-600" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-blue-600" />;
  }
};

const getTimeString = (date: Date): string => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return date.toLocaleDateString();
};

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const handleMarkAllRead = () => {
    devLog.debug('Mark all notifications as read');
  };

  const handleNotificationClick = (id: string) => {
    devLog.debug(`Clicked notification: ${id}`);
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute top-16 right-4 w-80 max-h-96 bg-white rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[color:var(--ink-fg-muted)]" />
            <h3 className="font-medium text-[color:var(--ink-fg-strong)]">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[color:var(--ink-deep-navy)] hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="text-[color:var(--ink-fg-muted)] hover:text-[color:var(--ink-fg)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {mockNotifications.length > 0 ? (
            mockNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[color:var(--ink-fg-strong)] truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--ink-fg-muted)] mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[color:var(--ink-fg-muted)] mt-1">
                      {getTimeString(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-[color:var(--ink-fg-muted)]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
