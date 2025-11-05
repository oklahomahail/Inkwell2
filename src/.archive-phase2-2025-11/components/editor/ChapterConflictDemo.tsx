import { useState } from 'react';

import ConflictResolverDialog, { ConflictInfo } from '@/components/editor/ConflictResolverDialog';
// import { track } from "@/services/telemetry"; // Uncomment if telemetry available

export default function ChapterConflictDemo() {
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ id: string; content: string } | null>(null);
  const chapterId = 'demo-chapter-1';

  async function saveChapterContent(id: string, content: string, opts: any) {
    // Simulate checksum mismatch
    if (opts.expectedChecksum && opts.expectedChecksum !== 'valid-checksum') {
      throw {
        code: 'CHECKSUM_MISMATCH',
        remote: {
          content: 'Remote content',
          updatedAt: new Date().toISOString(),
          checksum: 'remote-checksum',
        },
      };
    }
    // Simulate save
    return { checksum: 'valid-checksum' };
  }

  async function fetchRemoteChapter(id: string) {
    // Simulate fetch
    return { content: 'Remote content', updatedAt: new Date().toISOString() };
  }

  const saveFn = async (id: string, content: string) => {
    try {
      await saveChapterContent(id, content, { expectedChecksum: 'invalid-checksum' });
    } catch (e: any) {
      if (e?.code === 'CHECKSUM_MISMATCH') {
        const remote = e.remote ?? (await fetchRemoteChapter(id).catch(() => null));
        setPending({ id, content });
        setConflict({
          chapterId: id,
          localBytes: content.length,
          remoteBytes: remote?.content?.length,
          localUpdatedAt: new Date().toISOString(),
          remoteUpdatedAt: remote?.updatedAt,
        });
        setOpen(true);
      }
    }
  };

  async function handleKeepLocal() {
    if (!pending) return;
    setOpen(false);
    await saveChapterContent(pending.id, pending.content, { force: true });
    // track("autosave.success", { chapterId: pending.id, resolved: "kept-local" });
    setPending(null);
    setConflict(null);
  }

  async function handleUseRemote() {
    if (!pending) return;
    setOpen(false);
    const remote = await fetchRemoteChapter(pending.id);
    // setEditorContent(remote.content); // Simulate editor update
    // track("autosave.success", { chapterId: pending.id, resolved: "used-remote" });
    setPending(null);
    setConflict(null);
  }

  return (
    <>
      <button onClick={() => saveFn(chapterId, 'Local content')}>Simulate Save</button>
      <ConflictResolverDialog
        open={open}
        conflict={conflict}
        onKeepLocal={handleKeepLocal}
        onUseRemote={handleUseRemote}
        onCancel={() => {
          setOpen(false);
          setPending(null);
          setConflict(null);
        }}
      />
    </>
  );
}
