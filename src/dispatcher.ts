import * as amqp from 'amqplib'
import Request from './request'
import Response from './response'
import AmqpWrapper from './wrapper'

export default class EventDispatcher {
    private req: Request
    private res: Response

    constructor (url: string) {
        const wrapper = new AmqpWrapper(url)

        this.req = new Request(wrapper)
        this.res = new Response(wrapper)
    }
    public async emit (event: string, ...args: any[]): Promise<any> {
      return this.req?.emit(event, args)
    }

    public register (event: string, callback: (...args: any[]) => any): void {
        this.res?.register(event, callback)
    }

    public async listen (): Promise<void> {
        this.res?.listen()
    }
}
