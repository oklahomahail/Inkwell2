// src/components/Platform/ViewRouter.tsx
import React, { JSX, Suspense } from 'react';

import ErrorBoundary from '@/components/shared/ErrorBoundary';

const DashboardPanel = React.lazy(() => import('@/components/Panels/DashboardPanel'));
const AnalysisPanel = React.lazy(() => import('@/components/Panels/AnalysisPanel'));

type Props = {
  activeTab: string;
  // Parent provides a renderer that already wires all props to WritingPanel
  renderWriting: () => JSX.Element;
};

export default function ViewRouter({ activeTab, renderWriting }: Props) {
  return (
    <ErrorBoundary level="feature">
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        {activeTab === 'dashboard' && <DashboardPanel />}
        {activeTab === 'analysis' && <AnalysisPanel />}
        {activeTab === 'writing' && renderWriting()}
      </Suspense>
    </ErrorBoundary>
  );
}
