import { useCallback, useMemo, useRef, useState } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

export interface UseNotificationsApi {
  open: boolean;
  toggle: () => void;
  notifications: NotificationItem[];
  add: (
    _n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & {
      id?: string;
      timestamp?: Date;
      read?: boolean;
    },
  ) => string;
  markAsRead: (_id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
}

export function useNotifications(): UseNotificationsApi {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const idSeq = useRef(1000);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const add: UseNotificationsApi['add'] = useCallback((n) => {
    const id = n.id ?? `n_${idSeq.current++}`;
    const item: NotificationItem = {
      id,
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.timestamp ?? new Date(),
      read: n.read ?? false,
    };
    setItems((prev) => [item, ...prev]);
    return id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return useMemo(
    () => ({
      open,
      toggle,
      notifications: items,
      add,
      markAsRead,
      markAllAsRead,
      clear,
    }),
    [open, toggle, items, add, markAsRead, markAllAsRead, clear],
  );
}

// simple starter data
function _seed(): NotificationItem[] {
  return [
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
}
