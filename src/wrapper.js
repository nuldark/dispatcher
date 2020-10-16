const amqp = require('amqplib')

class AMQPWrapper {
  constructor (url) {
    this.url = url
  }

  async start () {
    if (!this.connection && !this.channel) {
      this.connection = await amqp.connect(this.url)
      this.connected = true
    }

    if (this.inited) {
      return
    }

    if (!this.channel) {
      this.channel = await this.connection.createChannel()
      await this.channel.prefetch(100)
      this.hasChannel = true
    }

    this.inited = true
  }

  async close () {
    if (!this.inited) return
    if (this.hasChannel) this.channel.close()
    if (this.connected) this.connection.close()

    this.inited = false
  }
}

module.exports = AMQPWrapper
