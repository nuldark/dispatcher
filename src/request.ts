import {ConsumeMessage, Connection, Channel} from 'amqplib';

const requests: Map<string, object> = new Map();

export default async (connection: Connection) => {
    const emit = async (event: string ,...args: any[]): Promise<any> => {
        const channel = await connection.createChannel();
        const { queue } = await channel.assertQueue('', { exclusive: true });

        const correlationId = generateUUID();
        const payload = Buffer.from(JSON.stringify({ event, args}));
        const options = { correlationId,  replyTo: queue };

        requests.set(correlationId, { payload, options });
        channel.sendToQueue('request', payload, options);

        return Promise.race([
            getResponse(queue, channel),
            callTimeout(correlationId)
        ]).catch(e => {
            channel.close();
            throw e;
        });
    }

    return {
        emit
    }
}
const callTimeout = async (correlationId: string): Promise<void>=> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            requests.delete(correlationId);
            reject('[RPC] Timeout');
        }, 25000);
    });
}
const getResponse = async (queue: string, channel: Channel): Promise<any> => {
    return new Promise (async (resolve, _) => {
        await channel.consume(queue, (message: ConsumeMessage | null) => {
            if (!message) {
                return;
            }
            const { correlationId } = message.properties;
            const callback = requests.get(correlationId);

            if (!callback) {
                console.log('[RPC] Unknown event.');
                return;
            }

            const response = JSON.parse(message.content.toString());
            resolve(response);
        });
    })
}

const generateUUID = () : string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}