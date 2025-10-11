type PerformanceData = {
  date: string;
  wordCount: number;
  goalProgress: number;
};

type Row = Record<string, unknown>;
export type PerformanceChartType = 'trend' | 'comparison' | 'success-rate' | 'roi';

export type PerformanceChartProps = {
  title?: string;
  type?: PerformanceChartType;
  rows?: Row[];
  xKey: string;
  yKey: string;
  height?: number;
  className?: string;
};

function _toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function _PerformanceChart({
  title,
  type = 'trend',
  rows = [],
  xKey,
  yKey,
  height = 280,
  className,
}: PerformanceChartProps) {
  const [R, setR] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import('recharts')
      .then((mod) => {
        if (alive) setR(mod);
      })
      .catch((e) => {
        if (alive) setLoadError(String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo(() => {
    const raw = Array.isArray(rows) ? rows : [];
    return raw.map((d) => (toNumber((d as any)[yKey]) == null ? null : d)).filter(Boolean) as Row[];
  }, [rows, yKey]);

  const isArea = type === 'comparison' || type === 'success-rate' || type === 'roi';

  if (loadError) {
    return (
      <div className={className}>
        {title ? <h3 className="font-medium mb-3">{title}</h3> : null}
        <div className="h-64 rounded border border-dashed flex items-center justify-center text-sm text-slate-500">
          Charts failed to load: {loadError}
        </div>
      </div>
    );
  }

  if (!R) {
    return (
      <div className={className}>
        {title ? <h3 className="font-medium mb-3">{title}</h3> : null}
        <div className="h-64 rounded border border-dashed animate-pulse bg-slate-100" />
      </div>
    );
  }

  const {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
  } = R;

  return (
    <div className={className}>
      {title ? <h3 className="font-medium mb-3">{title}</h3> : null}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer>
          {isArea ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={yKey}
                stroke="#8884d8"
                fillOpacity={0.2}
                fill="#8884d8"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#8884d8" dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Import needed types and hooks
import { useEffect, useMemo, useState } from 'react';
