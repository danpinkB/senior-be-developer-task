import { config as configure } from "dotenv";
configure({ quiet: true });
import { DatabaseStorage } from "./db/db.storage";
import { Operations, Message } from "./db/common";
import { Queue } from "./que/queue";
import { range, sleep, getRandomIntInRange } from "./util/util";
import { Worker } from "./worker/worker";
import { logger } from "./log/logger";
import express from "express";
import { config } from "./config/config";
import {
    queueDepthGauge,
    queueInFlightGauge,
    queuePendingGauge,
    register,
} from "./service/metrics";

const ITEMS_NUMBER = getRandomIntInRange(3, 6);
const WORKERS_NUMBER = getRandomIntInRange(3, 6);

const ITEMS = range(ITEMS_NUMBER).map((item) => `item${item}`);

const applyToAll = (queue: Queue, operation: Operations, val: number): void => {
    for (const product of ITEMS) {
        queue.enqueue(new Message(product, operation, val));
    }
};

const app = express();
const db = new DatabaseStorage();
const queue = new Queue();

function updateMetrics() {
    queueDepthGauge.set(queue.size());
    queueInFlightGauge.set(queue.inFlightSize());
    queuePendingGauge.set(queue.pendingSize());
}

setInterval(updateMetrics, 5000);

app.get("/healthz", (_, res) => {
    res.status(200).send("OK");
});

app.get("/metrics", async (_, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

const main = async () => {
    logger.debug(`Number of items:${ITEMS_NUMBER}`);
    logger.debug(`Number of workers:${WORKERS_NUMBER}`);

    applyToAll(queue, Operations.SET, 50);
    for (let i = 0; i < 10; i++) {
        applyToAll(queue, Operations.ADD, i);
    }
    range(WORKERS_NUMBER).forEach((i) => {
        const worker = new Worker(i, queue);
        worker.work(db.set);
    });
    await sleep(10000);
    logger.debug(`Queue size: ${await queue.size()}`);
    logger.debug(`DB state:\n ${JSON.stringify(await db.state(), null, 4)}`);
};
process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);

const server = app.listen(config.PORT, () => {
    logger.debug(`app listening on port ${config.PORT}`);
});

main();

function shutDown() {
    logger.debug("received kill signal: shutting down");
    server.close(() => {
        queue.shutdown();
        process.exit(0);
    });
}
