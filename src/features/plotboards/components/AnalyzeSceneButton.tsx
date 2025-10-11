import React from 'react';
interface AnalyzeSceneButtonProps {
  onAnalyze: () => void;
  disabled?: boolean;
}
export function _AnalyzeSceneButton({ onAnalyze, disabled = false }: AnalyzeSceneButtonProps) {
  return (
    <button
      onClick={onAnalyze}
      disabled={disabled}
      className="rounded-md border border-[#D4A537] px-2 py-1 text-xs text-[#D4A537] hover:bg-[#D4A537]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
      title="Analyze this scene for structure and flow"
    >
      {' '}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {' '}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />{' '}
      </svg>{' '}
      <span>Analyze</span>{' '}
    </button>
  );
}
