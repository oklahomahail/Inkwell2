import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';

export type ConflictInfo = {
  chapterId: string;
  localBytes: number;
  remoteBytes?: number;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
};

export default function ConflictResolverDialog({
  open,
  conflict,
  onKeepLocal,
  onUseRemote,
  onCancel,
}: {
  open: boolean;
  conflict: ConflictInfo | null;
  onKeepLocal: () => Promise<void> | void;
  onUseRemote: () => Promise<void> | void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open || !conflict) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="conflict-dialog"
      className="fixed inset-0 grid place-items-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Resolve edit conflict</h2>
        <p className="mt-2 text-sm opacity-80">
          The local and cloud versions are different. Choose which one to keep.
        </p>
        <ul className="mt-3 text-sm">
          <li>Local bytes: {conflict.localBytes}</li>
          {conflict.remoteBytes != null && <li>Remote bytes: {conflict.remoteBytes}</li>}
          {conflict.localUpdatedAt && <li>Local updated: {conflict.localUpdatedAt}</li>}
          {conflict.remoteUpdatedAt && <li>Remote updated: {conflict.remoteUpdatedAt}</li>}
        </ul>
        <div className="mt-4 flex gap-2">
          <Button data-testid="conflict-keep-local" onClick={() => void onKeepLocal()}>
            Keep local
          </Button>
          <Button
            data-testid="conflict-use-remote"
            variant="secondary"
            onClick={() => void onUseRemote()}
          >
            Use remote
          </Button>
          <Button data-testid="conflict-cancel" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
