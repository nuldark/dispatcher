const AMQPWrapper = require('./wrapper')

class RPCServer extends AMQPWrapper {
  constructor (url) {
    super(url)

    this.events = new Map()
  }

  // Public API
  async listen () {
    await super.start()

    await this.channel.assertQueue('events', { durable: false })
    await this.channel.prefetch(1)

    const consume = await this.channel.consume('events', msg => this.handleMessage(msg))
    this._consumerTag = consume.consumerTag
  }

  register (event, callback) {
    this.events.set(event, callback)
  }

  // Private API
  async call (event, ...args) {
    const cb = this.events.get(event)

    if (!cb) return

    const out = await cb(args)
    return Buffer.from(JSON.stringify(out))
  }

  async close () {
    await this.channel.close(this._consumerTag)
    await super.close()
  }

  async handleMessage (message) {
    this.channel.ack(message)

    const { replyTo, correlationId, deliveryMode } = message.properties
    const persistent = deliveryMode !== -1

    const request = JSON.parse(message.content.toString())
    const content = await this.call(request.event, request.args || [])

    this.channel.sendToQueue(replyTo, content, { correlationId, persistent })
  }
}

module.exports = RPCServer
