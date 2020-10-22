const AMQPWrapper = require('./wrapper')
const { generateUUID } = require('./utils')

class RPCClient {
  constructor (url) {
    this.amqp = new AMQPWrapper(url)
    this.requests = new Map()
  }

  // Public API
  async start () {
    await this.amqp.start()
    this.channel = this.amqp.channel

    const { queue } = await this.channel.assertQueue('', { exclusive: true })
    this.queue = queue

    const { consumerTag } = await this.channel.consume(queue, (msg) => this.messageHandler(msg))
    this.consumerTag = consumerTag
  }

  async emit (event, ...args) {
    let res
    let rej

    const promise = new Promise((resolve, reject) => {
      res = resolve
      rej = reject
    })

    const correlationId = generateUUID()
    const timer = setTimeout(() => this.cancel(correlationId), 60000)
    this.requests.set(correlationId, {
      res,
      rej,
      timer,
      event
    })

    this.channel.sendToQueue(
      'events',
      Buffer.from(JSON.stringify({ event, args })),
      { replyTo: this.queue, correlationId }
    )

    return promise
  }

  messageHandler (message) {
    this.channel.ack(message)
    if (!message) return

    const { correlationId } = message.properties
    const request = this.requests.get(correlationId)

    if (!request) {
      return
    }

    const { res, rej, timer } = request
    clearTimeout(timer)

    try {
      res(message.content.toString())
    } catch (e) {
      rej(e)
    }
  }

  cancel (correlationId) {
    const ctx = this.requests.get(correlationId)
    const { timer, rej, event } = ctx

    clearTimeout(timer)
    this.requests.delete(correlationId)

    rej(new Error(`Timeout: ${event}, correlationId: ${correlationId}`))
  }
}

module.exports = RPCClient
