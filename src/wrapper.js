const amqp = require('amqplib')

class AMQPWrapper {
  constructor (url) {
    this.url = url
    this.channel = null
  }

  async start () {
    if (this.channel) {
      return
    }

    this.connection = await amqp.connect(this.url)
    this.channel = await this.connection.createChannel()
  }

  async close () {
    if (!this.channel) return
    await this.channel.close()

    this.channel = null
  }
}

module.exports = AMQPWrapper
