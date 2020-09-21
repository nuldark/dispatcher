import * as amqp from 'amqplib';
import Request from './request';
import Response from './response';

export class EventDispatcher
{
    private req?: Request
    private res?: Response

    constructor () {}

    public static create = async (url: string) => {
        const self = new EventDispatcher()
        const conn = await amqp.connect(url)

        self.req = new Request(conn)
        self.res = new Response(conn)

        return self
    }

    public async emit(event: string, ...args: any[]): Promise<any>
    {
        return this.req?.emit(event, args)
    }

    public register (event: string, callback: (...args: any[]) => any)
    {
        this.res?.register(event, callback)
    }

    public async listen ()
    {
        this.res?.listen()
    }
}