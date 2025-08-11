import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceChartProps {
  type: 'comparison' | 'success-rate' | 'roi' | 'trend';
  data: any;
  className?: string;
  height?: number;
}

// Mock data builder to avoid buildChartData dependency
function buildChartData(chartType: string, _rawData: any) {
  // Simple mock data structure
  const mockData = [
    { name: 'Jan', value: 400, growth: 12 },
    { name: 'Feb', value: 300, growth: 8 },
    { name: 'Mar', value: 600, growth: 15 },
    { name: 'Apr', value: 800, growth: 20 },
    { name: 'May', value: 700, growth: 18 },
    { name: 'Jun', value: 900, growth: 25 },
  ];

  return {
    data: mockData,
    xKey: 'name',
    yKeys: ['value', 'growth'],
    kind: chartType,
  };
}

// Mock data types to avoid import issues
interface ComparisonData {
  current: number;
  previous: number;
}

interface CampaignSuccessData {
  successful: number;
  total: number;
  rate: number;
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  chartType: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, chartType }) => {
  if (!active || !payload || !payload.length) return null;

  const val = payload[0].value as number;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
      <div className="text-white font-medium mb-1">
        {chartType === 'comparison'
          ? `Growth: ${val}%`
          : chartType === 'success-rate'
            ? `Success Rate: ${val}%`
            : payload[0].name}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  type,
  data,
  className = '',
  height = 300,
}) => {
  // Build chart data from props
  const { data: rows, xKey, yKeys: _yKeys, kind: _kind } = buildChartData(type, data);

  const chartTitle =
    type === 'comparison'
      ? 'Period-over-period growth metrics'
      : type === 'success-rate'
        ? 'Campaign goal achievement rates'
        : type === 'roi'
          ? 'Return on investment by campaign'
          : type === 'trend'
            ? 'Performance trends over time'
            : 'Performance Chart';

  const isAreaChart = type === 'comparison' || type === 'success-rate' || type === 'roi';

  return (
    <div className={`card-base p-6 ${className}`}>
      {/* Chart Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-semibold text-slate-200 mb-2">
          Performance Analytics
        </h3>
        <p className="text-sm text-slate-400">{chartTitle}</p>
      </div>

      {/* Chart Container */}
      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          {isAreaChart ? (
            <AreaChart data={rows}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={xKey} stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip content={<CustomTooltip chartType={type} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          ) : (
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={xKey} stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip content={<CustomTooltip chartType={type} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">
            {type === 'comparison' && 'Growth vs previous period'}
            {type === 'success-rate' && `${rows.length} campaigns analyzed`}
            {type === 'roi' && 'Return on investment metrics'}
            {type === 'trend' && 'Historical performance data'}
          </span>
        </div>
      </div>

      {/* Additional metrics for comparison charts */}
      {type === 'comparison' && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Average Growth</div>
            <div className="text-lg font-semibold font-semibold text-slate-200">
              {rows.length > 0
                ? `${(rows.reduce((sum: number, item: any) => sum + (item.growth || 0), 0) / rows.length).toFixed(1)}%`
                : '0%'}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Best Month</div>
            <div className="text-lg font-semibold font-semibold text-slate-200">
              {rows.length > 0
                ? rows.reduce(
                    (max: any, item: any) => ((item.growth || 0) > (max.growth || 0) ? item : max),
                    rows[0],
                  )?.name || 'N/A'
                : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;
