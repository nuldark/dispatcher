const amqp = require('amqplib')

async function server (url) {
  const events = new Map()

  const connection = await amqp.connect(url)
  const channel = await connection.createChannel()
  await channel.prefetch(1)

  const listen = async () => {
    if (events.size === 1) {
      console.log('[Dispatcher] Initializing server with no events.')
    }

    await channel.assertQueue('events', { durable: false })
    await channel.consume('events', async message => {
      const { replyTo, correlationId, deliveryMode } = message.properties
      const request = JSON.parse(message.content.toString())
      const event = events.get(request.event)
      
      if (event) {
        const content = await event(request.args || [])
        const response = Buffer.from(JSON.stringify(content) || '')

        channel.sendToQueue(replyTo, response, { correlationId, deliveryMode })
      }

      channel.ack(message)
    })
  }

  const register = (event, cb) => {
    events.set(event, cb)
  }

  const close = async () => {
    channel.close()
    connection.close()
  }

  return { listen, register, close }
}

module.exports = server