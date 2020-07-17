import * as amqp from 'amqplib';
import { default as request } from './request';
import { default as reply } from './reply';

export default async (url: string) => {
    let module: any = {};
    try {
        const connection = await amqp.connect(url);

        const req = await request(connection);
        const rep = await reply(connection);

        module.emit = req.emit;
        module.listen = rep.listen;
        module.register = rep.register;

    } catch (e) {
        console.log(e.message);
    }

    return module;
};