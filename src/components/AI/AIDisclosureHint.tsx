/**
 * AIDisclosureHint Component
 *
 * Provides a compact "Copy AI note" button in the AI suggestion dialog that allows
 * authors to easily copy a ready-made citation for inline use in their manuscript.
 *
 * Features:
 * - One-click copy to clipboard
 * - Toast notification on successful copy
 * - Subtle, unobtrusive styling
 * - Stateless (no tracking or persistence)
 *
 * Usage: Appears in the AI suggestion dialog after content is generated.
 *
 * @see docs/features/ai-disclosure.md
 */
import { Copy, Check } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/context/toast';
import { INLINE_AI_NOTE } from '@/types/aiDisclosure';

export const AIDisclosureHint: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INLINE_AI_NOTE);
      setCopied(true);
      showToast('AI note copied to clipboard', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy AI note', error);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-slate-800/50 border border-slate-700 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-300">Need a note about AI assistance?</p>
        <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
          Copy a short statement you can paste as a footnote or endnote.
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-label="Copy AI assistance note to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy AI note</span>
          </>
        )}
      </button>
    </div>
  );
};
