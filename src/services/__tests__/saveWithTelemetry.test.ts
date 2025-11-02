import { describe, it, expect, vi } from 'vitest';
import { track } from '../telemetry';

// Basic tests for the telemetry-enabled save operation
describe('saveWithTelemetry', () => {
  it('should export track function', () => {
    expect(track).toBeDefined();
    expect(typeof track).toBe('function');
  });

  it('should not throw when tracking events', () => {
    expect(() => {
      track('autosave.start', { projectId: 'test' });
    }).not.toThrow();
  });
});
