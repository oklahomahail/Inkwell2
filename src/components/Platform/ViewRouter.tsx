// src/components/Platform/ViewRouter.tsx
import React, { JSX, Suspense } from 'react';

import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { useNavigation } from '@/context/NavContext';

const DashboardPanel = React.lazy(() => import('@/components/Panels/DashboardPanel'));
const AnalysisPanel = React.lazy(() => import('@/components/Panels/AnalysisPanel'));
const TimelinePanel = React.lazy(() => import('@/components/Panels/TimelinePanel'));
const SettingsPanel = React.lazy(() => import('@/components/Panels/SettingsPanel'));

type Props = {
  // Parent still provides this (keeps your existing writing pipeline)
  renderWriting: () => JSX.Element;
};

export default function ViewRouter({ renderWriting }: Props) {
  const { currentView } = useNavigation();

  return (
    <ErrorBoundary level="feature">
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        {currentView === 'dashboard' && <DashboardPanel />}
        {currentView === 'analysis' && <AnalysisPanel />}
        {currentView === 'timeline' && <TimelinePanel />}
        {currentView === 'settings' && <SettingsPanel />}
        {currentView === 'writing' && renderWriting()}
      </Suspense>
    </ErrorBoundary>
  );
}
