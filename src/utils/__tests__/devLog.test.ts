/**
 * devLog Tests
 *
 * Tests for development logging utilities
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

import devLog, {
  debug,
  warn,
  error,
  log,
  trace,
  devWarn,
  devDebug,
  devTrace,
  devError,
} from '../devLog';

describe('devLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('devLog object methods', () => {
    it('should have all expected methods', () => {
      expect(devLog.debug).toBeDefined();
      expect(devLog.warn).toBeDefined();
      expect(devLog.error).toBeDefined();
      expect(devLog.log).toBeDefined();
      expect(devLog.trace).toBeDefined();
    });

    it('devLog.error calls console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      devLog.error('test error', { code: 123 });
      expect(spy).toHaveBeenCalledWith('test error', { code: 123 });
      spy.mockRestore();
    });

    it('devLog.debug calls console.debug', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      devLog.debug('test debug message');
      expect(spy).toHaveBeenCalledWith('test debug message');
      spy.mockRestore();
    });

    it('devLog.warn calls console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      devLog.warn('test warning');
      expect(spy).toHaveBeenCalledWith('test warning');
      spy.mockRestore();
    });

    it('devLog.log delegates to devLog.debug', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      devLog.log('test log');
      expect(spy).toHaveBeenCalledWith('test log');
      spy.mockRestore();
    });

    it('devLog.trace calls console.trace', () => {
      const spy = vi.spyOn(console, 'trace').mockImplementation(() => {});
      devLog.trace('stack trace here', { context: 'test' });
      expect(spy).toHaveBeenCalledWith('stack trace here', { context: 'test' });
      spy.mockRestore();
    });
  });

  describe('named exports', () => {
    it('debug is exported', () => {
      expect(debug).toBe(devLog.debug);
    });

    it('warn is exported', () => {
      expect(warn).toBe(devLog.warn);
    });

    it('error is exported', () => {
      expect(error).toBe(devLog.error);
    });

    it('log is exported', () => {
      expect(log).toBe(devLog.log);
    });

    it('trace is exported', () => {
      expect(trace).toBe(devLog.trace);
    });
  });

  describe('standalone functions', () => {
    it('devWarn calls console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      devWarn('standalone warn', { data: 'test' });
      expect(spy).toHaveBeenCalledWith('standalone warn', { data: 'test' });
      spy.mockRestore();
    });

    it('devDebug calls console.debug', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      devDebug('standalone debug', 123);
      expect(spy).toHaveBeenCalledWith('standalone debug', 123);
      spy.mockRestore();
    });

    it('devTrace calls console.trace', () => {
      const spy = vi.spyOn(console, 'trace').mockImplementation(() => {});
      devTrace('standalone trace');
      expect(spy).toHaveBeenCalledWith('standalone trace');
      spy.mockRestore();
    });

    it('devError calls console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('test');
      devError('standalone error', err);
      expect(spy).toHaveBeenCalledWith('standalone error', err);
      spy.mockRestore();
    });
  });

  describe('multiple arguments', () => {
    it('passes through all arguments to console methods', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      devLog.error('msg', 1, 2, 3, { a: 'b' });
      expect(spy).toHaveBeenCalledWith('msg', 1, 2, 3, { a: 'b' });
      spy.mockRestore();
    });
  });
});
