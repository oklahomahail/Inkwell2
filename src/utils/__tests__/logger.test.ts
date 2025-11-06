/**
 * Logger Tests
 *
 * Tests for the logger utility that wraps devLog
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

import devLog from '../devLog';
import { log } from '../logger';

vi.mock('../devLog', () => ({
  default: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log.info', () => {
    it('should call devLog.debug with provided arguments', () => {
      log.info('test message', { data: 123 });

      // In test environment (not PROD), it should call devLog.debug
      expect(devLog.debug).toHaveBeenCalledWith('test message', { data: 123 });
    });

    it('should handle multiple arguments', () => {
      log.info('arg1', 'arg2', 'arg3');
      expect(devLog.debug).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('log.warn', () => {
    it('should call devLog.warn with provided arguments', () => {
      log.warn('warning message', { code: 'WARN_001' });

      // In test environment (not PROD), it should call devLog.warn
      expect(devLog.warn).toHaveBeenCalledWith('warning message', { code: 'WARN_001' });
    });

    it('should handle multiple arguments', () => {
      log.warn('warn1', 'warn2');
      expect(devLog.warn).toHaveBeenCalledWith('warn1', 'warn2');
    });
  });

  describe('log.error', () => {
    it('should call devLog.error with provided arguments', () => {
      const error = new Error('test error');
      log.error('error occurred', error);

      // Error logs should always be visible, even in prod
      expect(devLog.error).toHaveBeenCalledWith('error occurred', error);
    });

    it('should handle multiple arguments', () => {
      log.error('error1', 'error2', { stack: 'trace' });
      expect(devLog.error).toHaveBeenCalledWith('error1', 'error2', { stack: 'trace' });
    });
  });
});
