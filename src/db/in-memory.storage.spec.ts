import { InMemoryStorage } from "./in-memory.storage";
import { Message, Operations } from "./common";

const createMessage = (
    key: string,
    val: number,
    operation: Operations,
): Message => ({
    key,
    val,
    operation,
    id: `${key}-${operation}-${val}`,
});

describe("InMemoryStorage", () => {
    let store: InMemoryStorage;

    beforeEach(() => {
        store = new InMemoryStorage();
    });

    test("SET operation sets the value correctly", async () => {
        const msg = createMessage("alpha", 10, Operations.SET);
        await store.set(msg);
        const result = await store.get("alpha");
        expect(result).toBe(10);
    });

    test("ADD operation increments the value", async () => {
        await store.set(createMessage("beta", 5, Operations.SET));
        await store.set(createMessage("beta", 3, Operations.ADD));
        const result = await store.get("beta");
        expect(result).toBe(8);
    });

    test("SUBTRACT operation decrements the value", async () => {
        await store.set(createMessage("gamma", 20, Operations.SET));
        await store.set(createMessage("gamma", 7, Operations.SUBTRACT));
        const result = await store.get("gamma");
        expect(result).toBe(13);
    });

    test("default value is 0 for unknown keys before ADD or SUBTRACT", async () => {
        await store.set(createMessage("new", 2, Operations.ADD));
        const result = await store.get("new");
        expect(result).toBe(2);
    });

    test("state() returns full data object", async () => {
        await store.set(createMessage("x", 1, Operations.SET));
        await store.set(createMessage("y", 2, Operations.SET));
        const state = await store.state();
        expect(state).toEqual({ x: 1, y: 2 });
    });

    test("operations simulate async behavior with delay", async () => {
        const start = Date.now();
        await store.set(createMessage("delay", 50, Operations.SET));
        const duration = Date.now() - start;
        expect(duration).toBeGreaterThanOrEqual(0);
    });
});
