import { describe, it, expect, vi } from 'vitest';
import { wrapSaveWithTelemetry } from '../saveWithTelemetry';

const trackMock = vi.fn();
vi.mock('../telemetry', () => ({ track: trackMock }));

describe('wrapSaveWithTelemetry', () => {
  it('should track start and success on resolve', async () => {
    trackMock.mockClear();
    const saveFn = vi.fn().mockResolvedValue({ checksum: 'abc123' });
    const wrapped = wrapSaveWithTelemetry(saveFn);
    const content = 'hello world';
    const chapterId = 'ch1';
    const res = await wrapped(chapterId, content);
    expect(res.checksum).toBe('abc123');
    expect(trackMock).toHaveBeenCalledWith(
      'autosave.start',
      expect.objectContaining({ chapterId, bytes: content.length }),
    );
    expect(trackMock).toHaveBeenCalledWith(
      'autosave.success',
      expect.objectContaining({ chapterId, bytes: content.length }),
    );
    const successCall = trackMock.mock.calls.find(([event]) => event === 'autosave.success');
    expect(successCall).toBeDefined();
    expect(successCall?.[1].durationMs).toBeGreaterThan(0);
  });

  it('should track start and error on reject', async () => {
    trackMock.mockClear();
    const saveFn = vi.fn().mockRejectedValue({ code: 'FAIL' });
    const wrapped = wrapSaveWithTelemetry(saveFn);
    const content = 'fail content';
    const chapterId = 'ch2';
    await expect(wrapped(chapterId, content)).rejects.toMatchObject({ code: 'FAIL' });
    expect(trackMock).toHaveBeenCalledWith(
      'autosave.start',
      expect.objectContaining({ chapterId, bytes: content.length }),
    );
    expect(trackMock).toHaveBeenCalledWith(
      'autosave.error',
      expect.objectContaining({ chapterId, bytes: content.length, errorCode: 'FAIL' }),
    );
    const errorCall = trackMock.mock.calls.find(([event]) => event === 'autosave.error');
    expect(errorCall).toBeDefined();
    expect(errorCall?.[1].durationMs).toBeGreaterThan(0);
  });
});
