const AMQPWrapper = require('./wrapper')

class RPCServer {
  constructor (url) {
    this.amqp = new AMQPWrapper(url)
    this.events = new Map()
  }

  async listen () {
    if (this.events.size === 0) {
      console.log('[RpcServer] Initializing server with no events.')
    }

    await this.amqp.start()
    await this.amqp.channel.assertQueue('events', { durable: false })

    const { consumerTag } = await this.amqp.channel.consume(
      'events',
      async message => {
        this.amqp.channel.ack(message)

        const { replyTo, correlationId, deliveryMode } = message.properties
        const request = JSON.parse(message.content.toString())
        const event = this.events.get(request.event)

        if (event) {
          const content = await event(request.args || [])
          const response = Buffer.from(JSON.stringify(content) || "")

          this.amqp.channel.sendToQueue(replyTo, response, { correlationId, deliveryMode })
        }

        return
      })

    this._consumerTag = consumerTag
  }

  register (event, callback) {
    this.events.set(event, callback)
  }

  async close () {
    await this.amqp.channel.close(this._consumerTag)
    await this.amqp.close()
  }
}

module.exports = RPCServer
