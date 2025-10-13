import { vi } from 'vitest';

type StatusCallback = (status: { isOnline: boolean }) => void;

// Create consistent mock implementation with properly typed methods
export const mockConnectivityService = {
  enqueue: vi.fn().mockImplementation(async () => 'mock_queue_id'),
  dequeue: vi.fn().mockImplementation(async () => {}),
  getStatus: vi.fn().mockReturnValue({ isOnline: true }),
  onStatusChange: vi.fn().mockImplementation((callback: StatusCallback) => {
    setTimeout(() => callback({ isOnline: true }), 0);
    return () => {};
  }),
  queueWrite: vi.fn().mockImplementation(async (op: string, key: string, data: string) => {
    return { queued: true };
  }),
  processQueue: vi.fn().mockImplementation(async () => {}),
};

// Helper to reset all mock state with default implementations
// Ensure mock reset helper is available before mock
export const resetMocks = () => {
  // Recreate spies to avoid cases where mockReset is unavailable
  (mockConnectivityService as any).enqueue = vi
    .fn()
    .mockImplementation(async () => 'mock_queue_id');
  (mockConnectivityService as any).dequeue = vi.fn().mockImplementation(async () => {});
  (mockConnectivityService as any).getStatus = vi.fn().mockReturnValue({ isOnline: true });
  (mockConnectivityService as any).onStatusChange = vi
    .fn()
    .mockImplementation((callback: StatusCallback) => {
      setTimeout(() => callback({ isOnline: true }), 0);
      return () => {};
    });
  (mockConnectivityService as any).queueWrite = vi
    .fn()
    .mockImplementation(async (_op: string, _key: string, _data: string) => {
      return { queued: true };
    });
  (mockConnectivityService as any).processQueue = vi.fn().mockImplementation(async () => {});
};

export default mockConnectivityService;
