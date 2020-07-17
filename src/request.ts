import { RequestPayload, RequestMessage } from './interfaces';
import { ConsumeMessage, Connection } from 'amqplib';

export default async (connection: Connection) => {
    const emit = async (event: string ,...args: any[]): Promise<any> => {
        const channel = await connection.createChannel().catch(e => { throw e });
        const q = await channel.assertQueue('', { exclusive: true });

        const message = createMessage(q.queue, { event, args: args });

        channel.sendToQueue('request', message.content, message.options);

        return Promise.race([
            new Promise( async (resolve, _) => {
                await channel.consume(q.queue, async (msg: ConsumeMessage | null) => {
                    if (msg!.properties.correlationId === message.options.correlationId) {
                        resolve(JSON.parse(msg!.content.toString()));

                        await channel.close();
                    }
                });
            }),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject('rpc timeout');
                }, 20000)
            })
        ]).catch(e => {
            channel.close();
            throw e;
        });

    }

    return {
        emit
    }
}

const createMessage = (queue: string, content: RequestPayload): RequestMessage => {
    const correlationId = generateUUID();
    const payload = Buffer.from(JSON.stringify(content));
    const options = {
        correlationId,
        replyTo: queue
    };

    const message: RequestMessage = {
        queue,
        content: payload,
        options
    };

    return message;
}

const generateUUID = () : string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}