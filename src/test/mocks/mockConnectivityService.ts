import { vi } from 'vitest';

export const mockConnectivityService = {
  enqueue: vi.fn(async () => 'mock_queue_id'),
  dequeue: vi.fn(async () => void 0),
  getStatus: vi.fn(() => ({ isOnline: true })),
  onStatusChange: vi.fn(() => () => void 0),
  queueWrite: vi.fn(async () => void 0),
  processQueue: vi.fn(async () => void 0),
};

export default mockConnectivityService;
