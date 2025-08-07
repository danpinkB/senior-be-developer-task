import { getRandomInt, sleep } from "../util/util";
import { Message, Operations } from "./common";
import { IMessageStore } from "./abstract";

export class InMemoryStorage implements IMessageStore {
    private data: { [key: string]: number };

    constructor() {
        this.data = {};
    }

    set = async (message: Message) => {
        const current = this.data[message.key] || 0;
        let result: number;
        switch (message.operation) {
            case Operations.ADD:
                result = current + message.val;
                break;
            case Operations.SUBTRACT:
                result = current - message.val;
                break;
            case Operations.SET:
                result = message.val;
                break;
            default:
                throw Error(`Invalid operation ${message.operation}`);
        }
        const randomDelay = getRandomInt(100);
        await sleep(randomDelay);
        this.data[message.key] = result;
    };

    get = async (key: string) => {
        return this.data[key]!;
    };

    state = async () => {
        return this.data;
    };
}
