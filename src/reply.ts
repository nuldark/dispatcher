import {ConsumeMessage, Connection, Message, Channel} from 'amqplib';
import { RequestContent } from './interfaces';

const events: Map<string, (...args: any[]) => any> = new Map();
const queue = 'request';

export default async (connection: Connection) => {
    const listen = async () => {
        let channel: Channel;

        try {
            channel = await connection.createChannel();

            await channel.assertQueue(queue, {durable: false});
            await channel.prefetch(1);

            console.log('[RPC] Awaiting for request..');
            await channel.consume(queue, msg => onMessageHandler(channel, msg));
        } catch (e) {
            throw new Error(e.message);
        }
    };

    const register = (event: string, callback: (...args: any[]) => any) =>
    {
        events.set(event, callback);
    }

    return {
        listen,
        register
    }
};

const onMessageHandler = async (channel: Channel, message: ConsumeMessage | null): Promise<any> => {
    if (!message) {
        return;
    }
    channel.ack(message);

    const replyTo = message.properties.replyTo;
    const correlationId = message.properties.correlationId;
    const persistent = message.properties.deliveryMode !== 1;

    try {
        const requestContent = await getRequestContent(message);
        const result = await call(requestContent.event, requestContent.args || []);
        const content = Buffer.from(JSON.stringify(result));

        await channel.sendToQueue(replyTo, content, { correlationId, persistent });
    } catch (e) {
        console.log(e.message);
        //TODO:
        // send error as response
    }
}

const getRequestContent = async (message: Message): Promise<RequestContent> => {
    let content: RequestContent;

    try {
        content = JSON.parse(message.content.toString());
    } catch (e) {
        throw new Error(`Parse error: ${e.message}`);
    }

    return content;
}

const call = async(event: string, ...args: any[]): Promise<any> => {
    const cb = events.get(event);

    if (!cb) {
        throw new Error(`Unknown event: ${event}`);
    }

    return await cb(...args);
}