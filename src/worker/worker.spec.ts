import { Worker } from "./worker";
import { Queue } from "../que/queue";
import { Message, Operations } from "../db/common";

const createMessage = (key: string, id: string): Message => ({
    key,
    id,
    operation: Operations.ADD,
    val: 42,
});

describe("Worker", () => {
    let queue: Queue;
    let worker: Worker;
    let callback: jest.Mock;

    beforeEach(() => {
        queue = new Queue();
        worker = new Worker(1, queue);
        callback = jest.fn().mockResolvedValue(undefined);
    });

    test("processes messages and confirms them", async () => {
        const m1 = createMessage("k1", "1");
        const m2 = createMessage("k2", "2");
        queue.enqueue(m1);
        queue.enqueue(m2);
        await worker.work(callback);
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith(m1);
        expect(callback).toHaveBeenCalledWith(m2);
    });

    test("stops when queue is empty", async () => {
        await worker.work(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    test("calls confirm after each message", async () => {
        const m1 = createMessage("a", "id-a");
        const confirmSpy = jest.spyOn(queue, "confirm");
        queue.enqueue(m1);
        await worker.work(callback);

        expect(confirmSpy).toHaveBeenCalledWith(1, "id-a");
    });

    test("continues processing until queue is empty", async () => {
        const m1 = createMessage("x", "id-1");
        const m2 = createMessage("y", "id-2");
        queue.enqueue(m1);
        queue.enqueue(m2);
        await worker.work(callback);
        expect(callback).toHaveBeenCalledTimes(2);
    });

    test("handles errors in callback without crashing", async () => {
        const m1 = createMessage("e", "id-error");
        queue.enqueue(m1);
        const errorCallback = jest.fn().mockRejectedValue(new Error("fail"));
        await worker.work(errorCallback);
        expect(errorCallback).toHaveBeenCalledTimes(1);
    });
});
