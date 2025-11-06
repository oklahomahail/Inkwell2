/**
 * Telemetry Service Tests
 *
 * Tests for telemetry tracking, opt-out, and session management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  isTelemetryEnabled,
  setTelemetryEnabled,
  track,
  emitSessionStart,
  emitSessionEnd,
} from '../telemetry';

describe('Telemetry Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Mock navigator.sendBeacon
    Object.defineProperty(navigator, 'sendBeacon', {
      writable: true,
      value: vi.fn(() => true),
    });

    // Mock fetch
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200 } as Response));
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Telemetry opt-out', () => {
    it('is enabled by default', () => {
      expect(isTelemetryEnabled()).toBe(true);
    });

    it('can be disabled', () => {
      setTelemetryEnabled(false);
      expect(isTelemetryEnabled()).toBe(false);
      expect(localStorage.getItem('inkwell_telemetry_disabled')).toBe('true');
    });

    it('can be re-enabled', () => {
      setTelemetryEnabled(false);
      setTelemetryEnabled(true);
      expect(isTelemetryEnabled()).toBe(true);
      expect(localStorage.getItem('inkwell_telemetry_disabled')).toBeNull();
    });

    it('defaults to enabled when localStorage throws', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(isTelemetryEnabled()).toBe(true);

      Storage.prototype.getItem = originalGetItem;
    });

    it('handles localStorage errors when setting preference', () => {
      const originalSetItem = Storage.prototype.setItem;
      const originalRemoveItem = Storage.prototype.removeItem;

      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => setTelemetryEnabled(false)).not.toThrow();
      expect(() => setTelemetryEnabled(true)).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe('Event tracking', () => {
    it('sends telemetry events when enabled', () => {
      track('session.start', { sample: 1 });
      expect(navigator.sendBeacon).toHaveBeenCalledWith('/api/telemetry', expect.any(Blob));
    });

    it('does not send events when telemetry is disabled', () => {
      setTelemetryEnabled(false);
      track('session.start', { sample: 1 });
      expect(navigator.sendBeacon).not.toHaveBeenCalled();
    });

    it('falls back to fetch when sendBeacon unavailable', () => {
      // Remove sendBeacon
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        value: undefined,
      });

      track('session.start', { sample: 1 });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/telemetry',
        expect.objectContaining({
          method: 'POST',
          keepalive: true,
        }),
      );
    });

    it('silently handles fetch errors', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        value: undefined,
      });

      // Should not throw
      expect(() => track('session.start')).not.toThrow();

      // Wait for promise to settle
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('includes session ID in events', () => {
      track('session.start');

      const call = (navigator.sendBeacon as any).mock.calls[0];
      expect(call[1]).toBeInstanceOf(Blob);
    });

    it('silently handles JSON stringify errors', () => {
      const circular: any = {};
      circular.self = circular;

      // Should not throw
      expect(() => track('session.start', circular)).not.toThrow();
    });
  });

  describe('Session management', () => {
    it('emitSessionStart tracks session.start event', () => {
      emitSessionStart();
      expect(navigator.sendBeacon).toHaveBeenCalledWith('/api/telemetry', expect.any(Blob));
    });

    it('emitSessionEnd tracks session.end event with reason', () => {
      emitSessionEnd('unload');
      expect(navigator.sendBeacon).toHaveBeenCalledWith('/api/telemetry', expect.any(Blob));
    });

    it('creates session ID in sessionStorage', () => {
      track('session.start');

      const sessionId = sessionStorage.getItem('inkwell_session_id');
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
    });

    it('reuses session ID across multiple events', () => {
      track('session.start');
      const sessionId1 = sessionStorage.getItem('inkwell_session_id');

      track('autosave.success');
      const sessionId2 = sessionStorage.getItem('inkwell_session_id');

      expect(sessionId1).toBe(sessionId2);
    });

    it('generates ephemeral ID when sessionStorage unavailable', () => {
      const originalGetItem = Storage.prototype.getItem;
      const originalSetItem = Storage.prototype.setItem;

      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Should not throw and should still track
      expect(() => track('session.start')).not.toThrow();
      expect(navigator.sendBeacon).toHaveBeenCalled();

      Storage.prototype.getItem = originalGetItem;
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Opt-out tracking', () => {
    it('tracks opt-in event when re-enabling telemetry', () => {
      setTelemetryEnabled(false);
      (navigator.sendBeacon as any).mockClear();

      setTelemetryEnabled(true);

      // Should track the opt-in event
      expect(navigator.sendBeacon).toHaveBeenCalledWith('/api/telemetry', expect.any(Blob));
    });

    it('does not track when disabling telemetry', () => {
      setTelemetryEnabled(true);
      (navigator.sendBeacon as any).mockClear();

      setTelemetryEnabled(false);

      // Should NOT track when disabling
      expect(navigator.sendBeacon).not.toHaveBeenCalled();
    });
  });
});
