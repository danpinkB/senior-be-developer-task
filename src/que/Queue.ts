import { Message } from "../db/common";
import { logger } from "../log/logger";

type Resolver = () => void;

export class Queue {
    private isShutdown: boolean = false;
    private messages: Message[] = [];
    private processingMessages = new Map<string, Message>();
    private keyWorkers = new Map<string, number>();
    private waitQueues = new Map<string, Resolver[]>();

    enqueue(message: Message): void {
        logger.debug(`ENQUEUE ${message.id}`);
        this.messages.push(message);
    }

    async dequeue(workerId: number): Promise<Message> {
        if (!this.messages.length || this.isShutdown) return;

        const msg = this.messages.shift();
        if (!this.keyWorkers.has(msg.key)) {
            this.processingMessages.set(msg.id, msg);
            this.keyWorkers.set(msg.key, workerId);
            logger.debug(`DEQUEUE THE MESSAGE ${msg.id}`);
            return msg;
        }
        const key = msg.key;
        if (!this.waitQueues.has(key)) {
            this.waitQueues.set(key, []);
        }
        logger.debug(`PLASE THE MESSAGE ${msg.id} IN WAITING QUEUE`);
        return new Promise<Message>((resolve) => {
            this.waitQueues.set(
                key,
                this.waitQueues.get(key).concat([
                    () => {
                        if (this.isShutdown) return resolve(undefined);
                        this.keyWorkers.set(msg.key, workerId);
                        this.processingMessages.set(msg.id, msg);
                        resolve(msg);
                    },
                ]),
            );
        });
    }

    confirm(workerId: number, messageId: string): void {
        const message = this.processingMessages.get(messageId);
        if (!message) return;

        this.processingMessages.delete(messageId);
        this.keyWorkers.delete(message.key);
        this.processNextKey(message.key);
    }

    processNextKey(key: string) {
        let resolvers = this.waitQueues.get(key);
        if (resolvers && resolvers.length) {
            resolvers.shift()();
        }
    }

    size(): number {
        return this.messages.length;
    }

    inFlightSize(): number {
        return this.processingMessages.size
    }

    pendingSize(): number {
        let c =0;
        this.waitQueues.forEach((val)=>{
            c+=val.length
        })
        return this.messages.length + c;
    }

    shutdown(): void {
        this.isShutdown = true;

        for (const [key, resolvers] of this.waitQueues.entries()) {
            for (const resolve of resolvers) {
                resolve();
            }
            this.waitQueues.set(key, []);
        }
    }
}
