import { Message, Data } from "./common";

export interface IMessageStore {
    set(message: Message): Promise<void>;
    get(key: string): Promise<number>;
    state(): Promise<Data>;
}
