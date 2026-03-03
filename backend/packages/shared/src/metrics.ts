export interface Metric {
  name: string;
  value: number;
  unit?: 'Count' | 'Milliseconds';
  dimensions?: Record<string, string>;
}

export const emitMetric = (namespace: string, metric: Metric): void => {
  // EMF-compatible structured logs for CloudWatch metrics extraction.
  console.log(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: namespace,
            Dimensions: [Object.keys(metric.dimensions ?? {})],
            Metrics: [{ Name: metric.name, Unit: metric.unit ?? 'Count' }],
          },
        ],
      },
      ...metric.dimensions,
      [metric.name]: metric.value,
    }),
  );
};
