import React from 'react';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';

export const LazyLineChart = React.lazy(() => import('./LineChartImpl'));

interface ChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  height?: number;
  width?: string | number;
}

export function LineChart(props: ChartProps) {
  const advancedAnalyticsEnabled = useFeatureFlag('enableAdvancedAnalytics');

  if (!advancedAnalyticsEnabled) {
    return null;
  }

  return (
    <React.Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded" />}>
      <LazyLineChart {...props} />
    </React.Suspense>
  );
}
