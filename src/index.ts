import * as amqp from 'amqplib';
import { default as request } from './request';
import { default as reply } from './reply';

export const connect = async (url: string) => {

        const connection = await amqp.connect(url);

        const req = await request(connection);
        const rep = await reply(connection);

        return {
            emit: req.emit,
            listen: rep.listen,
            register: rep.register
        }

};