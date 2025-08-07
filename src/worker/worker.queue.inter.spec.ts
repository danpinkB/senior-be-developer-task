import { Queue } from "../que/queue";
import { Worker } from "./worker";
import { Message, Operations } from "../db/common";

const createMessage = (key: string, id: string): Message => ({
    key,
    id,
    operation: Operations.ADD,
    val: 1,
});

describe("Integration: Queue + Worker", () => {
    let queue: Queue;

    beforeEach(() => {
        queue = new Queue();
    });

    test("one worker processes all messages in order", async () => {
        const processed: string[] = [];
        const messages = [
            createMessage("a", "1"),
            createMessage("b", "2"),
            createMessage("c", "3"),
        ];
        messages.forEach((msg) => queue.enqueue(msg));

        const worker = new Worker(1, queue);
        await worker.work(async (msg) => {
            processed.push(msg.id);
        });

        expect(processed).toEqual(["1", "2", "3"]);
    });

    test("two workers process messages with different keys in parallel", async () => {
        const processed: { id: string; by: number }[] = [];

        queue.enqueue(createMessage("k1", "m1"));
        queue.enqueue(createMessage("k2", "m2"));

        const w1 = new Worker(1, queue);
        const w2 = new Worker(2, queue);

        await Promise.all([
            w1.work(async (msg) => {
                processed.push({ id: msg.id, by: 1 });
            }),
            w2.work(async (msg) => {
                processed.push({ id: msg.id, by: 2 });
            }),
        ]);

        expect(processed.length).toBe(2);
        const ids = processed.map((p) => p.id).sort();
        expect(ids).toEqual(["m1", "m2"]);
    });

    test("messages with the same key are not processed in parallel", async () => {
        const events: string[] = [];
        queue.enqueue(createMessage("x", "1"));
        queue.enqueue(createMessage("x", "2"));

        const w1 = new Worker(1, queue);
        const w2 = new Worker(2, queue);

        await Promise.all([
            w1.work(async (msg) => {
                events.push(`start:${msg.id}:w1`);
                await new Promise((r) => setTimeout(r, 100));
                events.push(`done:${msg.id}:w1`);
            }),
            w2.work(async (msg) => {
                events.push(`start:${msg.id}:w2`);
                await new Promise((r) => setTimeout(r, 100));
                events.push(`done:${msg.id}:w2`);
            }),
        ]);

        const firstDone = events.indexOf("done:1:w1");
        const secondStart = events.indexOf("start:2:w2");
        expect(firstDone).toBeLessThan(secondStart);
    });

    test("queue releases lock after confirm", async () => {
        const log: string[] = [];

        queue.enqueue(createMessage("k1", "m1"));
        queue.enqueue(createMessage("k1", "m2"));

        const worker = new Worker(1, queue);
        await worker.work(async (msg) => {
            log.push(`processing:${msg.id}`);
        });

        expect(log).toEqual(["processing:m1", "processing:m2"]);
    });
});
