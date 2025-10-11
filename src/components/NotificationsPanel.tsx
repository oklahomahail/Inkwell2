import { clsx } from 'clsx';
import { Bell, Check, ChevronDown, X } from 'lucide-react';
import { FC, MouseEvent } from 'react';

import type { Notification } from '@/types/notifications';

export interface NotificationsPanelProps {
  notifications: Notification[];
  onClose?: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationsPanel: FC<NotificationsPanelProps> = ({
  notifications,
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

import React from 'react';
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}
interface NotificationsPanelProps {
  notifications?: Notification[];
  onClose?: () => void;
  onMarkAsRead?: (_id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (_notification: Notification) => void;
}
const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications = [],
  _onClose,
  _onMarkAsRead,
  _onMarkAllAsRead,
  _onNotificationClick,
}) => {
  const sampleNotifications: Notification[] = [
    {
      id: '1',
      title: 'New Donation Received',
      message: 'John Smith donated $500 to the Annual Fund campaign',
      type: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      read: false,
    },
    {
      id: '2',
      title: 'Campaign Goal Achieved',
      message: 'Spring Fundraiser has reached 100% of its goal',
      type: 'success',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: false,
    },
    {
      id: '3',
      title: 'Monthly Report Available',
      message: 'Your monthly analytics report is ready for download',
      type: 'info',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: true,
    },
  ];
  const items = notifications.length ? notifications : sampleNotifications;
  const unread = items.filter((n) => !n.read).length;
  const dot = (_color: string) => (
    <span className={`inline-block w-2 h-2 rounded-full ${color}`} aria-hidden />
  );
  const colorFor = (_t: Notification['type']) => {
    switch (t) {
      case 'success':
        return 'bg-green-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-blue-400';
    }
  };
  const rowBg = (_t: Notification['type'], _read: boolean) => {
    if (read) return 'bg-slate-900/30 border-slate-800';
    switch (t) {
      case 'success':
        return 'bg-green-900/15 border-green-800/50';
      case 'warning':
        return 'bg-yellow-900/15 border-yellow-800/50';
      case 'error':
        return 'bg-red-900/15 border-red-800/50';
      default:
        return 'bg-blue-900/15 border-blue-800/50';
    }
  };
  const formatAgo = (_d: Date) => {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };
  return (
    <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-xl p-6 max-w-md text-white">
      {' '}
      <div className="flex justify-between items-center mb-4">
        {' '}
        <div className="flex items-center space-x-2">
          {' '}
          <h3 className="text-lg font-semibold font-semibold">Notifications</h3>{' '}
          {unread > 0 && (
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              {' '}
              {unread}{' '}
            </span>
          )}{' '}
        </div>{' '}
        <div className="flex items-center gap-2">
          {' '}
          <button
            onClick={() => onMarkAllAsRead?.()}
            className="text-slate-300 hover:text-white text-xs"
          >
            {' '}
            Mark all read{' '}
          </button>{' '}
          <button
            onClick={() => onClose?.()}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
            title="Close"
          >
            {' '}
            ✕{' '}
          </button>{' '}
        </div>{' '}
      </div>{' '}
      <div className="space-y-3">
        {' '}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => onNotificationClick?.(n)}
            className={`w-full text-left p-3 border rounded-lg ${rowBg(n.type, n.read)}`}
          >
            {' '}
            <div className="flex items-start space-x-3">
              {' '}
              <div className="mt-2">{dot(colorFor(n.type))}</div>{' '}
              <div className="flex-1">
                {' '}
                <p className="text-sm font-medium">{n.title}</p>{' '}
                <p className="text-sm text-slate-300 mt-1">{n.message}</p>{' '}
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  {' '}
                  <span>{formatAgo(n.timestamp)}</span>{' '}
                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead?.(n.id);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {' '}
                      Mark read{' '}
                    </button>
                  )}{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </button>
        ))}{' '}
      </div>{' '}
      <div className="mt-4 pt-4 border-t border-slate-800">
        {' '}
        <button className="w-full text-sm text-blue-400 hover:text-blue-300 font-medium">
          {' '}
          View all notifications{' '}
        </button>{' '}
      </div>{' '}
    </div>
  );
};
export default NotificationsPanel;
