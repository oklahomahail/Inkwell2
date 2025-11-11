import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  mergeConsecutiveSessions,
  archiveOldSessions,
  calculateSessionStats,
  cleanupSessions,
  checkStorageUsage,
} from '../sessionUtils';

describe('sessionUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('mergeConsecutiveSessions', () => {
    it('should merge sessions within threshold', () => {
      const sessions = [
        {
          date: '2025-11-10',
          wordCount: 100,
          duration: 5,
          startedAt: '2025-11-10T10:00:00Z',
        },
        {
          date: '2025-11-10',
          wordCount: 150,
          duration: 5,
          startedAt: '2025-11-10T10:01:00Z',
        },
      ];

      const merged = mergeConsecutiveSessions(sessions, 2);

      expect(merged).toHaveLength(1);
      expect(merged[0]?.wordCount).toBe(250);
      expect(merged[0]?.duration).toBe(10);
    });

    it('should not merge sessions beyond threshold', () => {
      const sessions = [
        {
          date: '2025-11-10',
          wordCount: 100,
          duration: 5,
          startedAt: '2025-11-10T10:00:00Z',
        },
        {
          date: '2025-11-10',
          wordCount: 150,
          duration: 5,
          startedAt: '2025-11-10T10:15:00Z',
        },
      ];

      const merged = mergeConsecutiveSessions(sessions, 2);

      expect(merged).toHaveLength(2);
      expect(merged[0]?.wordCount).toBe(100);
      expect(merged[1]?.wordCount).toBe(150);
    });

    it('should not merge sessions from different days', () => {
      const sessions = [
        {
          date: '2025-11-10',
          wordCount: 100,
          duration: 5,
          startedAt: '2025-11-10T23:59:00Z',
        },
        {
          date: '2025-11-11',
          wordCount: 150,
          duration: 5,
          startedAt: '2025-11-11T00:01:00Z',
        },
      ];

      const merged = mergeConsecutiveSessions(sessions, 5);

      expect(merged).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const merged = mergeConsecutiveSessions([]);
      expect(merged).toHaveLength(0);
    });

    it('should handle single session', () => {
      const sessions = [{ date: '2025-11-10', wordCount: 100, duration: 5 }];
      const merged = mergeConsecutiveSessions(sessions);
      expect(merged).toHaveLength(1);
      expect(merged[0]).toEqual(sessions[0]);
    });
  });

  describe('archiveOldSessions', () => {
    it('should separate old and new sessions', () => {
      const today = new Date().toISOString().split('T')[0];
      const old = new Date();
      old.setDate(old.getDate() - 100);
      const oldDate = old.toISOString().split('T')[0];

      const sessions = [
        { date: today, wordCount: 100 },
        { date: oldDate, wordCount: 50 },
      ];

      const { active, archived } = archiveOldSessions(sessions, 90);

      expect(active).toHaveLength(1);
      expect(active[0]?.date).toBe(today);
      expect(archived).toHaveLength(1);
      expect(archived[0]?.date).toBe(oldDate);
    });

    it('should keep all sessions if within threshold', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 30);
      const recentDate = recent.toISOString().split('T')[0];

      const sessions = [{ date: recentDate, wordCount: 100 }];

      const { active, archived } = archiveOldSessions(sessions, 90);

      expect(active).toHaveLength(1);
      expect(archived).toHaveLength(0);
    });
  });

  describe('calculateSessionStats', () => {
    it('should calculate basic stats correctly', () => {
      const sessions = [
        { date: '2025-11-10', wordCount: 100, duration: 10 },
        { date: '2025-11-10', wordCount: 200, duration: 20 },
        { date: '2025-11-11', wordCount: 150, duration: 15 },
      ];

      const stats = calculateSessionStats(sessions);

      expect(stats.totalSessions).toBe(3);
      expect(stats.totalWords).toBe(450);
      expect(stats.totalDuration).toBe(45);
      expect(stats.avgWordsPerSession).toBe(150);
      expect(stats.avgDurationPerSession).toBe(15);
      expect(stats.avgWordsPerMinute).toBe(10);
      expect(stats.daysWithSessions).toBe(2);
    });

    it('should find longest session', () => {
      const sessions = [
        { date: '2025-11-10', wordCount: 100, duration: 10 },
        { date: '2025-11-11', wordCount: 200, duration: 30 },
        { date: '2025-11-12', wordCount: 150, duration: 15 },
      ];

      const stats = calculateSessionStats(sessions);

      expect(stats.longestSession?.duration).toBe(30);
      expect(stats.longestSession?.wordCount).toBe(200);
    });

    it('should find most productive day', () => {
      const sessions = [
        { date: '2025-11-10', wordCount: 100, duration: 10 },
        { date: '2025-11-10', wordCount: 200, duration: 20 },
        { date: '2025-11-11', wordCount: 150, duration: 15 },
      ];

      const stats = calculateSessionStats(sessions);

      expect(stats.mostProductiveDay?.date).toBe('2025-11-10');
      expect(stats.mostProductiveDay?.words).toBe(300);
    });

    it('should handle empty sessions', () => {
      const stats = calculateSessionStats([]);

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalWords).toBe(0);
      expect(stats.avgWordsPerSession).toBe(0);
      expect(stats.longestSession).toBeUndefined();
      expect(stats.mostProductiveDay).toBeUndefined();
    });
  });

  describe('cleanupSessions', () => {
    it('should remove invalid sessions', () => {
      const projectId = 'test-project';
      const sessions = [
        { date: '2025-11-10', wordCount: 100 },
        { date: 'invalid-date', wordCount: 50 },
        { date: '2025-11-11', wordCount: -10 },
        { date: '2025-11-12', wordCount: 200 },
      ];

      localStorage.setItem(`sessions-${projectId}`, JSON.stringify(sessions));

      const cleaned = cleanupSessions(projectId);

      expect(cleaned).toHaveLength(2);
      expect(cleaned.every((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.date))).toBe(true);
      expect(cleaned.every((s) => s.wordCount >= 0)).toBe(true);
    });

    it('should remove duplicate sessions', () => {
      const projectId = 'test-project';
      const sessions = [
        { date: '2025-11-10', wordCount: 100 },
        { date: '2025-11-10', wordCount: 200 },
        { date: '2025-11-11', wordCount: 150 },
      ];

      localStorage.setItem(`sessions-${projectId}`, JSON.stringify(sessions));

      const cleaned = cleanupSessions(projectId);

      expect(cleaned).toHaveLength(2);
      // Should keep the higher word count for duplicate date
      const nov10 = cleaned.find((s) => s.date === '2025-11-10');
      expect(nov10?.wordCount).toBe(200);
    });

    it('should return empty array for non-existent project', () => {
      const cleaned = cleanupSessions('non-existent-project');
      expect(cleaned).toHaveLength(0);
    });

    it('should handle corrupted localStorage data', () => {
      const projectId = 'test-project';
      localStorage.setItem(`sessions-${projectId}`, 'invalid json{');

      const cleaned = cleanupSessions(projectId);
      expect(cleaned).toHaveLength(0);
    });
  });

  describe('checkStorageUsage', () => {
    it('should calculate storage usage', () => {
      localStorage.setItem('test-key-1', 'a'.repeat(1000));
      localStorage.setItem('test-key-2', 'b'.repeat(2000));

      const usage = checkStorageUsage();

      expect(usage.totalBytes).toBeGreaterThan(0);
      expect(usage.totalMB).toBeGreaterThan(0);
      expect(usage.items).toHaveLength(2);
    });

    it('should warn when storage is high', () => {
      // Create large data (4 MB)
      const largeData = 'x'.repeat(2 * 1024 * 1024);
      localStorage.setItem('large-key', largeData);

      const usage = checkStorageUsage();

      expect(usage.percentage).toBeGreaterThanOrEqual(80);
      expect(usage.warning).toBe(true);
    });

    it('should sort items by size', () => {
      localStorage.setItem('small', 'a');
      localStorage.setItem('large', 'b'.repeat(1000));
      localStorage.setItem('medium', 'c'.repeat(500));

      const usage = checkStorageUsage();

      expect(usage.items[0]?.key).toBe('large');
      expect(usage.items[1]?.key).toBe('medium');
      expect(usage.items[2]?.key).toBe('small');
    });
  });
});
