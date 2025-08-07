export enum Operations {
    ADD,
    SUBTRACT,
    SET,
}

export class Message {
    public key: string;
    public operation: Operations;
    public val: number;
    public id: string;

    constructor(key: string, operation: Operations, val: number) {
        this.key = key;
        this.operation = operation;
        this.val = val;
        this.id = `${key}:${val}:${operation}:${Date.now()}:${Math.random()}`;
    }
}

export type Data = { [key: string]: number };
