import React from 'react';

import { useNavigation } from '@/context/NavContext';

export default function ViewSwitcher() {
  const { currentView, navigateToView } = useNavigation();

  const Btn = ({ view, label }: { view: typeof currentView; label: string }) => (
    <button
      type="button"
      onClick={() => navigateToView(view)}
      aria-pressed={currentView === view}
      className={`px-3 py-1 rounded ${currentView === view ? 'font-semibold underline' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div role="tablist" aria-label="Views" className="flex gap-2">
      <Btn view="dashboard" label="Dashboard" />
      <Btn view="writing" label="Writing" />
      <Btn view="timeline" label="Timeline" />
      <Btn view="analysis" label="Analysis" />
      <Btn view="settings" label="Settings" />
    </div>
  );
}
