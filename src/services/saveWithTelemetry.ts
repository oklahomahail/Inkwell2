import { track } from '@/services/telemetry';

export function wrapSaveWithTelemetry(
  saveFn: (id: string, content: string) => Promise<{ checksum: string }>,
) {
  return async (chapterId: string, content: string) => {
    const start = performance.now();
    track('autosave.start', { chapterId, bytes: content.length });
    try {
      const res = await saveFn(chapterId, content);
      const durationMs = Math.round(performance.now() - start);
      track('autosave.success', {
        chapterId,
        bytes: content.length,
        durationMs: Math.max(durationMs, 1), // Ensure minimum 1ms for telemetry
      });
      return res;
    } catch (error: any) {
      const durationMs = Math.round(performance.now() - start);
      track('autosave.error', {
        chapterId,
        bytes: content.length,
        durationMs: Math.max(durationMs, 1), // Ensure minimum 1ms for telemetry
        errorCode: error?.code ?? 'UNKNOWN',
      });
      throw error;
    }
  };
}
