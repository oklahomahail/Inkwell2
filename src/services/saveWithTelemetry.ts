import { track } from '@/services/telemetry';

export function wrapSaveWithTelemetry(
  saveFn: (id: string, content: string) => Promise<{ checksum: string }>,
) {
  return async (chapterId: string, content: string) => {
    const start = performance.now();
    const contentSize = new Blob([content]).size;

    track('autosave.start', { chapterId, bytes: contentSize });

    try {
      const res = await saveFn(chapterId, content);
      const durationMs = Math.round(performance.now() - start);

      // Emit anonymized editor.autosave.latency event
      track('editor.autosave.latency', {
        latency_ms: Math.max(durationMs, 1),
        content_size_bytes: contentSize,
        success: true,
      });

      track('autosave.success', {
        chapterId,
        bytes: contentSize,
        durationMs: Math.max(durationMs, 1),
      });

      return res;
    } catch (error: any) {
      const durationMs = Math.round(performance.now() - start);

      // Emit anonymized editor.autosave.latency event (with error)
      track('editor.autosave.latency', {
        latency_ms: Math.max(durationMs, 1),
        content_size_bytes: contentSize,
        success: false,
        error_code: error?.code ?? 'UNKNOWN',
      });

      track('autosave.error', {
        chapterId,
        bytes: contentSize,
        durationMs: Math.max(durationMs, 1),
        errorCode: error?.code ?? 'UNKNOWN',
      });

      throw error;
    }
  };
}
