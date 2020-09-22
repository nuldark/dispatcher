import * as amqp from 'amqplib'
import Request from './request'
import Response from './response'

export class EventDispatcher {
    private req?: Request
    private res?: Response

    public static create = async (url: string): Promise<EventDispatcher> => {
      const self = new EventDispatcher()
      const conn = await amqp.connect(url)

      self.req = new Request(conn)
      self.res = new Response(conn)

      return self
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
