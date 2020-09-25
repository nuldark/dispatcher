import { ConsumeMessage, Connection, Channel } from 'amqplib'
import AmqpWrapper from './wrapper';

export interface IRequest {
    event: string,
    args?: any[]
}

export default class Request {
    private readonly wrapper: AmqpWrapper 
    private readonly queue: string = 'events'
    private requests: Map<string, unknown> = new Map();

    constructor (wrapper: AmqpWrapper) {      
      this.wrapper = wrapper
      this.requests = new Map()
    }

    // Public API
    public async emit (event: string, ...args: any[]): Promise<any> {
      const connection = await this.wrapper.connect()
      const channel = await connection.createChannel()
      const { queue } = await channel.assertQueue('', { exclusive: true })

      const correlationId = this.generateUUID()
      const payload = Buffer.from(JSON.stringify({ event, args }))
      const options = { correlationId, replyTo: queue }

      this.requests.set(correlationId, { payload, options })
      channel.sendToQueue(this.queue, payload, options)

      return Promise.race([ this.getResponse(queue, channel), this.callTimeout(correlationId) ])
        .catch(e => {
          channel.close()
          throw e
        })
        .finally(() => connection.close())
    }

    // Private API
    private callTimeout (correlationId: string): Promise<void> {
      return new Promise((_, reject) => {
        setTimeout(() => {
          this.requests.delete(correlationId)
          reject(new Error('Request Timeout'))
        }, 10000)
      })
    }

    private getResponse (queue: string, channel: Channel): Promise<any> {
      return new Promise((resolve, reject) => {
        channel.consume(queue, (message: ConsumeMessage | null) => {
          if (!message) return

          const { correlationId } = message.properties
          const callback = this.requests.get(correlationId)

          if (!callback) reject(new Error('Unknown event'))

          const response = JSON.parse(message.content.toString())

          resolve(response)
        }, { noAck: true })
      })
    }

    private generateUUID () : string {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
}
