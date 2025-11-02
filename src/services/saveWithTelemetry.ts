import { track } from './telemetry';

export function wrapSaveWithTelemetry(
  saveFn: (id: string, content: string) => Promise<{ checksum: string }>,
) {
  return async (chapterId: string, content: string) => {
    const start = performance.now();
    track('autosave.start', { chapterId, bytes: content.length });
    try {
      const res = await saveFn(chapterId, content);
      track('autosave.success', {
        chapterId,
        bytes: content.length,
        durationMs: Math.round(performance.now() - start),
      });
      return res;
    } catch (error: any) {
      track('autosave.error', {
        chapterId,
        bytes: content.length,
        durationMs: Math.round(performance.now() - start),
        errorCode: error?.code ?? 'UNKNOWN',
      });
      throw error;
    }
  };
}
