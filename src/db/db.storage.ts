import { Message, Operations } from "./common";
import { IMessageStore } from "./abstract";
import { PrismaClient } from "@prisma/client";

export class DatabaseStorage implements IMessageStore {
    private storage: PrismaClient;

    constructor() {
        this.storage = new PrismaClient();
    }

    set = async (message: Message) => {
        switch (message.operation) {
            case Operations.ADD:
                await this.storage.item.update({
                    where: { key: message.key },
                    data: {
                        value: {
                            increment: message.val,
                        },
                    },
                });
                break;
            case Operations.SUBTRACT:
                await this.storage.item.update({
                    where: { key: message.key },
                    data: {
                        value: {
                            decrement: message.val,
                        },
                    },
                });
                break;
            case Operations.SET:
                await this.storage.item.upsert({
                    where: { key: message.key },
                    create: {
                        key: message.key,
                        value: message.val,
                    },
                    update: {
                        value: message.val,
                    },
                });
                break;
            default:
                throw Error(`Invalid operation ${message.operation}`);
        }
    };

    get = async (key: string) => {
        return await this.storage.item
            .findFirst({
                where: { key: key },
            })
            .then((res) => res.value);
    };

    state = async () => {
        return await this.storage.item.findMany({}).then((res) =>
            res.reduce((data, item) => {
                data[item.key] = item.value;
                return data;
            }, {}),
        );
    };
}
