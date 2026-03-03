export const emitMetric = (namespace, metric) => {
    // EMF-compatible structured logs for CloudWatch metrics extraction.
    console.log(JSON.stringify({
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
    }));
};
