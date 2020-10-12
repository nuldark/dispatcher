const AMQPWrapper = require('./wrapper')

class RPCClient extends AMQPWrapper {
  constructor (url) {
    super(url)

    this.requests = []
  }

  // Public API
  async emit (event, ...args) {
    const correlationId = this.generateUUID()
    const content = Buffer.from(JSON.stringify({ event, args }))
    const properties = { correlationId, replyTo: this.queue }

    this.requests.push(correlationId)
    this.channel.sendToQueue('events', content, properties)

    return Promise.race([this.dispatchMessage(), this.callTimeout()])
      .catch(e => console.log(e, e.stack))
      .finally(() => this.requests.filter(c => c === correlationId))
  }

  // Private API
  async start () {
    await super.start()
    const { queue } = await this.channel.assertQueue('', { exclusive: true })

    this.queue = queue
  }

  async close () {
    await this.channel.close(this._consumerTag)
    await super.close()
  }

  callTimeout (correlationId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.requests.filter(c => c === correlationId)
        reject(new Error('Request Timeout'))
      }, 10000)
    })
  }

  dispatchMessage () {
    return new Promise((resolve, reject) => {
      const consume = this.channel.consume(this.queue, (message) => {
        this.channel.ack(message)

        const { correlationId } = message.properties
        const request = this.requests.find(el => el === correlationId)
        if (!request) return

        resolve(message.content.toString())
      })

      this._consumerTag = consume.consumerTag
    })
  }

  generateUUID () {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}

module.exports = RPCClient
