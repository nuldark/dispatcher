const AMQPWrapper = require('./wrapper')
const { generateUUID } = require('./utils')

class RPCClient {
  constructor (url) {
    this.amqp = new AMQPWrapper(url)
    this.requests = []
  }

  // Public API
  async emit (event, ...args) {
    await this.amqp.start()

    const { queue } = await this.amqp.channel.assertQueue('', { exclusive: true })
    this.queue = queue

    const correlationId = generateUUID()
    this.requests.push(correlationId)

    this.amqp.channel.sendToQueue(
      'events',
      Buffer.from(JSON.stringify({ event, args })),
      { correlationId, replyTo: this.queue }
    )

    try {
      return Promise.race([
        this.messageHandler(),
        this.callTimeout()
      ])
    } finally {
      delete this.requests[correlationId]
    }

  }

  callTimeout () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('[RpcClient] Request Timeout.'))
      }, 10000)
    })
  }

  messageHandler () {
    return new Promise((resolve, reject) => {
      const { consumerTag } = this.amqp.channel.consume(
        this.queue,
        message => {
          if (!message) return

          const { correlationId } = message.properties
          const request = this.requests.find(el => el === correlationId)

          if (!request) {
            return
          }

          resolve(message.content.toString())
        },
        { noAck: true }
      )
      this._consumerTag = consumerTag
    })
  }
}

module.exports = RPCClient
