import { ConsumeMessage, Connection } from 'amqplib';
import { RequestPayload } from './interfaces';

const events: Map<string, (...args: any[]) => any> = new Map();

export default async (connection: Connection) => {
    const listen = async () => {
        if (events.size === 0) {
            console.log('[RPC] No registers callbacks');
        }
        const queue = 'request';
            const channel = await connection.createChannel().catch(e => { throw e });

        try {
            await channel.assertQueue(queue, {durable: false});
            await channel.prefetch(1);
        } catch (e) {
            throw e;
        }
        
        console.log('[RPC] Awaiting for request..');

        await channel.consume(queue, async (msg: ConsumeMessage | null) => {
            if (!msg) {
                return;
            }
            try {
                let content: RequestPayload = JSON.parse(msg.content.toString());
                console.log(`[RPC] Request event: ${content.event}`);

                const response = await Promise.resolve(
                    call(content.event, content.args || [])
                );

                channel.sendToQueue(
                    msg!.properties.replyTo,
                    Buffer.from(JSON.stringify(response)),
                    {
                        correlationId: msg!.properties.correlationId,
                        replyTo: msg!.properties.replyTo
                    });

                channel.ack(msg);
            } catch (e) {
                throw e;
            }
        }, { noAck: true });
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

const call = async(event: string, args: any[]): Promise<any> => {
    if (!event) {
        throw new Error('No event given');
    }

    const cb = events.get(event);
    if (!cb) {
        throw new Error('No such callback');
    }

    return await cb(...args);
}