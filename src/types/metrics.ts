export interface PerformanceMetrics {
  p50: number; // 50th percentile latency in ms
  p95: number; // 95th percentile latency in ms
  queries: number; // Total query count

  // Optional extended stats
  latencies?: {
    min: number;
    max: number;
    mean: number;
  };

  // System info
  system?: {
    memory: {
      total: number;
      used: number;
      free: number;
    };
    cpu: number; // CPU usage percentage
  };
}

export interface MetricsSample {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface MetricsSnapshot {
  metrics: PerformanceMetrics;
  samples: MetricsSample[];
  timestamp: number;
}
