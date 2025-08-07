import { collectDefaultMetrics, Counter, Gauge, Registry } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const queueDepthGauge = new Gauge({
    name: 'queue_depth_total',
    help: 'Number of messages in the queue',
    registers: [register]
});

export const queueInFlightGauge = new Gauge({
    name: 'queue_in_flight_total',
    help: 'Number of messages currently being processed',
    registers: [register]
});

export const queuePendingGauge = new Gauge({
    name: 'queue_pending_total',
    help: 'Number of pending messages with locked keys',
    registers: [register]
});

export const queueErrorCounter = new Counter({
    name: 'queue_errors_total',
    help: 'Number of queue processing errors',
    registers: [register]
});

export const queueProcessedCounter = new Counter({
    name: 'queue_processed_total',
    help: 'Number of successfully processed messages',
    registers: [register]
});