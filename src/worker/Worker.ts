import { logger } from "../log/logger";
import { Message } from "../db/common";
import { Queue } from "../que/queue";
import { queueErrorCounter, queueProcessedCounter } from "../service/metrics";

export class Worker {
    private queue: Queue;
    private workerId: number;

    constructor(workerId: number, queue: Queue) {
        this.queue = queue;
        this.workerId = workerId;
    }

    work = async (
        callback: (message: Message) => Promise<void>,
    ): Promise<void> => {
        while (true) {
            try {
                const message = await this.queue.dequeue(this.workerId);
                if (!message) {
                    break;
                }
                await callback(message);
                this.queue.confirm(this.workerId, message.id);
                queueProcessedCounter.inc();
            } catch (e) {
                logger.error(e);
                queueErrorCounter.inc();
            }
        }
    };
}
