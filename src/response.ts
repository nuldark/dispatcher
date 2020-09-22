import { ConsumeMessage, Connection, Message, Channel } from 'amqplib'
import { IRequest } from './request'

export default class Response {
    private queue = 'request'
    private connection: Connection
    private events: Map<string, (...args: any[]) => any>

    constructor (connection: Connection) {
      this.connection = connection
      this.events = new Map()
    }

    // Public API
    public async listen (): Promise<void> {
      const channel: Channel = await this.connection.createChannel()

      await channel.assertQueue(this.queue, { durable: false })
      await channel.prefetch(1)

      console.log('[Dispatcher] Awaiting for request..')
      await channel.consume(this.queue, msg => this.onMessageHandler(channel, msg))
    }

    public register (event: string, callback: (...args: any[]) => any): void {
      this.events.set(event, callback)
    }

    // Private API
    private async onMessageHandler (channel: Channel, message: ConsumeMessage | null) {
      if (!message) return
      channel.ack(message)

      const { replyTo, correlationId, deliveryMode } = message.properties
      const persistent = deliveryMode !== -1

      const req = this.parseRequest(message)
      const result = await this.call(req.event, req.args || [])
      const content = Buffer.from(JSON.stringify(result))

      channel.sendToQueue(replyTo, content, { correlationId, persistent })
    }

    private parseRequest (message: Message): IRequest {
      const content: IRequest = JSON.parse(message.content.toString())

      return content
    }

    private async call (event: string, ...args: any[]): Promise<any> {
      const cb = this.events.get(event)

      if (!cb) throw new Error(`[Dispatcher] Unknown event: ${event}`)
      return await cb(...args)
    }
}
