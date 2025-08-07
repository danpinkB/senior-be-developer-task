import { Queue } from "./queue";
import { Message, Operations } from "../db/common";

describe("queue-tests", () => {
    const createMessage = (key: string, id: string): Message => ({
        key,
        id,
        operation: Operations.ADD,
        val: 42,
    });

    let queue: Queue;
    beforeEach(() => {
        queue = new Queue();
    });

    test("dequeue returns message immediately if key is not locked", async () => {
        const message = createMessage("key1", "m1");
        queue.enqueue(message);

        const result = await queue.dequeue(1);
        expect(result).toEqual(message);
    });

    test("dequeue waits if key is locked by another worker", async () => {
        const msg1 = createMessage("key1", "m1");
        const msg2 = createMessage("key1", "m2");

        queue.enqueue(msg1);
        queue.enqueue(msg2);

        const res1 = await queue.dequeue(1);
        expect(res1).toEqual(msg1);

        const promise = queue.dequeue(2);
        let resolved = false;
        promise.then(() => (resolved = true));

        await new Promise((r) => setTimeout(r, 50));
        expect(resolved).toBe(false);

        queue.confirm(1, "m1");
        const res2 = await promise;
        expect(res2).toEqual(msg2);
    });

    test("confirm unlocks the key and processes next message with same key", async () => {
        const msg1 = createMessage("keyX", "x1");
        const msg2 = createMessage("keyX", "x2");
        queue.enqueue(msg1);
        queue.enqueue(msg2);

        await queue.dequeue(1);
        const next = queue.dequeue(2);

        let done = false;
        next.then(() => (done = true));

        await new Promise((r) => setTimeout(r, 20));
        expect(done).toBe(false);

        queue.confirm(1, "x1");

        const r2 = await next;
        expect(r2.id).toBe("x2");
    });

    test("multiple keys are handled independently", async () => {
        const m1 = createMessage("k1", "a");
        const m2 = createMessage("k2", "b");
        queue.enqueue(m1);
        queue.enqueue(m2);

        const r1 = await queue.dequeue(1);
        const r2 = await queue.dequeue(2);

        expect(r1.id).toBe("a");
        expect(r2.id).toBe("b");
    });

    test("size returns correct number of queued messages", () => {
        expect(queue.size()).toBe(0);
        queue.enqueue(createMessage("a", "1"));
        queue.enqueue(createMessage("b", "2"));
        expect(queue.size()).toBe(2);
    });
});
