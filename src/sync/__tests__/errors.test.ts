/**
 * Tests for sync error classes
 */

import { describe, it, expect } from 'vitest';
import {
  SyncError,
  OrphanedOperationError,
  RLSError,
  AuthenticationError,
  NetworkError,
  isNonRetryableError,
  isOrphanedOperationError,
} from '../errors';

describe('Sync Errors', () => {
  describe('SyncError', () => {
    it('should create a retryable error by default', () => {
      const error = new SyncError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SyncError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('SyncError');
      expect(error.retryable).toBe(true);
    });

    it('should create a non-retryable error when specified', () => {
      const error = new SyncError('Non-retryable error', false);

      expect(error.retryable).toBe(false);
    });

    it('should preserve stack trace', () => {
      const error = new SyncError('Test error');

      expect(error.stack).toBeDefined();
    });
  });

  describe('OrphanedOperationError', () => {
    it('should create a non-retryable orphaned operation error', () => {
      const error = new OrphanedOperationError('Record not found', 'chapters', 'chapter-123');

      expect(error).toBeInstanceOf(SyncError);
      expect(error).toBeInstanceOf(OrphanedOperationError);
      expect(error.message).toBe('Record not found');
      expect(error.name).toBe('OrphanedOperationError');
      expect(error.recordType).toBe('chapters');
      expect(error.recordId).toBe('chapter-123');
      expect(error.retryable).toBe(false);
    });

    it('should be identifiable via isOrphanedOperationError', () => {
      const error = new OrphanedOperationError('Record not found', 'projects', 'proj-456');

      expect(isOrphanedOperationError(error)).toBe(true);
    });
  });

  describe('RLSError', () => {
    it('should create a non-retryable RLS error by default', () => {
      const error = new RLSError('Access denied', 'PGRST301');

      expect(error).toBeInstanceOf(SyncError);
      expect(error).toBeInstanceOf(RLSError);
      expect(error.message).toBe('Access denied');
      expect(error.name).toBe('RLSError');
      expect(error.code).toBe('PGRST301');
      expect(error.retryable).toBe(false);
    });

    it('should create a retryable RLS error when specified', () => {
      const error = new RLSError('Temporary auth issue', 'PGRST302', true);

      expect(error.retryable).toBe(true);
    });
  });

  describe('AuthenticationError', () => {
    it('should create a retryable authentication error', () => {
      const error = new AuthenticationError('Token expired');

      expect(error).toBeInstanceOf(SyncError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Token expired');
      expect(error.name).toBe('AuthenticationError');
      expect(error.retryable).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('should create a retryable network error', () => {
      const error = new NetworkError('Connection lost');

      expect(error).toBeInstanceOf(SyncError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Connection lost');
      expect(error.name).toBe('NetworkError');
      expect(error.retryable).toBe(true);
    });
  });

  describe('isNonRetryableError', () => {
    it('should return true for non-retryable SyncError', () => {
      const error = new SyncError('Non-retryable', false);

      expect(isNonRetryableError(error)).toBe(true);
    });

    it('should return false for retryable SyncError', () => {
      const error = new SyncError('Retryable', true);

      expect(isNonRetryableError(error)).toBe(false);
    });

    it('should return true for OrphanedOperationError', () => {
      const error = new OrphanedOperationError('Orphaned', 'chapters', '123');

      expect(isNonRetryableError(error)).toBe(true);
    });

    it('should return false for AuthenticationError', () => {
      const error = new AuthenticationError('Auth failed');

      expect(isNonRetryableError(error)).toBe(false);
    });

    it('should return false for NetworkError', () => {
      const error = new NetworkError('Network failed');

      expect(isNonRetryableError(error)).toBe(false);
    });

    it('should return false for non-SyncError errors', () => {
      const error = new Error('Regular error');

      expect(isNonRetryableError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isNonRetryableError('string')).toBe(false);
      expect(isNonRetryableError(123)).toBe(false);
      expect(isNonRetryableError(null)).toBe(false);
      expect(isNonRetryableError(undefined)).toBe(false);
    });
  });

  describe('isOrphanedOperationError', () => {
    it('should return true for OrphanedOperationError', () => {
      const error = new OrphanedOperationError('Orphaned', 'chapters', '123');

      expect(isOrphanedOperationError(error)).toBe(true);
    });

    it('should return false for other SyncError types', () => {
      expect(isOrphanedOperationError(new SyncError('Test'))).toBe(false);
      expect(isOrphanedOperationError(new RLSError('Test', '123'))).toBe(false);
      expect(isOrphanedOperationError(new AuthenticationError('Test'))).toBe(false);
      expect(isOrphanedOperationError(new NetworkError('Test'))).toBe(false);
    });

    it('should return false for non-SyncError errors', () => {
      const error = new Error('Regular error');

      expect(isOrphanedOperationError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isOrphanedOperationError('string')).toBe(false);
      expect(isOrphanedOperationError(123)).toBe(false);
      expect(isOrphanedOperationError(null)).toBe(false);
      expect(isOrphanedOperationError(undefined)).toBe(false);
    });
  });
});
