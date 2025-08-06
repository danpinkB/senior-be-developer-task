import {  Message } from "./Database";
import { sleep } from "./Util";

export class Queue {
    private messages: Message[]
    private processingMessages: Map<string, Message> = new Map();
    private keyWorkers: Map<string, number> = new Map();

    constructor() {
        this.messages = []
    }


    Enqueue(message: Message): void {
        this.messages.push(message);
    }
    
    Dequeue(workerId: number): Message | undefined {
        if (!this.messages.length) return;
        let message;
        const helper = async() => {
            if (!this.keyWorkers.has(this.messages[this.messages.length-1].key)){
                message = this.messages.shift();
                this.keyWorkers.set(message.key, workerId);
                this.processingMessages.set(message.id, message)
            }
            else {
                await sleep(1).then(()=>{
                    helper()
                })
            }
        }
         
        helper();
        return message;
    }

    Confirm(workerId: number, messageId: string): void {
        let message = this.processingMessages.get(messageId);
        if (message){
            this.keyWorkers.delete(message.key);
            this.processingMessages.delete(messageId)
        } 
    }

    Size = () => {
        return this.messages.length
    }
}

