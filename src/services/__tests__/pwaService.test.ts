// src/services/__tests__/pwaService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PWAService } from '../pwaService';

describe('PWA Service', () => {
  let originalAddEventListener: any;
  let originalRemoveEventListener: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Save original methods
    originalAddEventListener = global.addEventListener;
    originalRemoveEventListener = global.removeEventListener;
    originalNavigator = global.navigator;

    // Mock methods
    global.addEventListener = vi.fn();
    global.removeEventListener = vi.fn();

    // Mock navigator online status
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    // Restore original methods
    global.addEventListener = originalAddEventListener;
    global.removeEventListener = originalRemoveEventListener;
    Object.defineProperty(global.navigator, 'onLine', {
      value: originalNavigator.onLine,
    });
    vi.clearAllMocks();
  });

  it('should setup event listeners on initialization', () => {
    const service = new PWAService();

    expect(global.addEventListener).toHaveBeenCalledWith(
      'beforeinstallprompt',
      expect.any(Function),
    );
    expect(global.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(global.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should allow registering and unregistering offline listeners', () => {
    const service = new PWAService();
    const listener = vi.fn();

    const unsubscribe = service.onOfflineStatusChange(listener);
    expect(service['listeners'].offline).toContain(listener);

    unsubscribe();
    expect(service['listeners'].offline).not.toContain(listener);
  });

  it('should allow registering and unregistering install prompt listeners', () => {
    const service = new PWAService();
    const listener = vi.fn();

    const unsubscribe = service.onInstallPromptReady(listener);
    expect(service['listeners'].installPrompt).toContain(listener);

    unsubscribe();
    expect(service['listeners'].installPrompt).not.toContain(listener);
  });

  it('should allow registering and unregistering update listeners', () => {
    const service = new PWAService();
    const listener = vi.fn();

    const unsubscribe = service.onUpdateAvailable(listener);
    expect(service['listeners'].update).toContain(listener);

    unsubscribe();
    expect(service['listeners'].update).not.toContain(listener);
  });

  it('should notify listeners when going offline', () => {
    const service = new PWAService();
    const listener = vi.fn();
    service.onOfflineStatusChange(listener);

    // Directly trigger the offline event handler
    const offlineHandlers = vi
      .mocked(global.addEventListener)
      .mock.calls.filter((call) => call[0] === 'offline')
      .map((call) => call[1]);

    if (offlineHandlers.length > 0) {
      (offlineHandlers[0] as EventListener)(new Event('offline'));
    }

    expect(listener).toHaveBeenCalledWith(true);
    expect(service.getOfflineStatus()).toBe(true);
  });

  it('should notify listeners when coming online', () => {
    const service = new PWAService();
    service['isOffline'] = true;
    const listener = vi.fn();
    service.onOfflineStatusChange(listener);

    // Directly trigger the online event handler
    const onlineHandlers = vi
      .mocked(global.addEventListener)
      .mock.calls.filter((call) => call[0] === 'online')
      .map((call) => call[1]);

    if (onlineHandlers.length > 0) {
      (onlineHandlers[0] as EventListener)(new Event('online'));
    }

    expect(listener).toHaveBeenCalledWith(false);
    expect(service.getOfflineStatus()).toBe(false);
  });

  it('should check if PWA can be installed', () => {
    const service = new PWAService();
    expect(service.canInstall()).toBe(false);

    // Mock having an install prompt
    service['deferredPrompt'] = {} as any;
    expect(service.canInstall()).toBe(true);
  });

  it('should trigger update available notifications', () => {
    const service = new PWAService();
    const listener = vi.fn();
    service.onUpdateAvailable(listener);

    service.triggerUpdateAvailable();
    expect(listener).toHaveBeenCalled();
  });
});
