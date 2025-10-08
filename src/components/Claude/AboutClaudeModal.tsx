// components/claude/AboutClaudeModal.tsx
import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onGetKey?: () => void; // optional: open Anthropic Console in a new tab
};

export default function AboutClaudeModal({ open, onClose, onGetKey }: Props) {
  if (!open) return null;
  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">About Claude AI in Inkwell</h2>
          <p className="mt-2 text-sm text-gray-600">
            Inkwell's core features work without any setup, including projects, notes, chapters,
            progress tracking, and local storage on your device.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">AI features (optional)</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Rewrite suggestions and line edits</li>
            <li>Brainstorming and idea generation</li>
            <li>Summaries and tone/style transforms</li>
          </ul>

          <div className="mt-3 rounded-lg border p-3">
            <p className="text-sm">
              To enable these, add a <strong>Claude API key</strong> from Anthropic. You do not need
              a Claude Pro subscription. Create a free developer account at the Anthropic Console
              and generate a key that looks like{' '}
              <code className="mx-1 rounded bg-gray-100 px-1">sk-ant-…</code>.
            </p>
          </div>

          <dl className="mt-2 grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="font-medium">Do I need Claude Pro?</dt>
              <dd className="text-gray-700">
                No. A Console developer key is separate from Claude Pro.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Where is my key stored?</dt>
              <dd className="text-gray-700">
                Locally on your device for this profile. It is not uploaded to a server.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Can I use Inkwell without a key?</dt>
              <dd className="text-gray-700">Yes. All non-AI features work normally without it.</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={onClose}>
            Close
          </button>
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-black px-3 py-2 text-sm text-white"
            onClick={onGetKey}
          >
            Open Anthropic Console
          </a>
        </div>
      </div>
    </div>
  );
}
