const amqp = require('amqplib')
const { generateUUID } = require('./utils')

async function client(url) {
    const requests = new Map()

    const connection = await amqp.connect(url)
    const channel = await connection.createChannel()
    const { queue } = await channel.assertQueue('', { exclusive: true })

    await channel.consume(queue, message => {
        if (!message) return

        const { correlationId } = message.properties
        const request = requests.get(correlationId)

        if (!request) return

        const { resolve, reject, timer } = request
        clearTimeout(timer)

        try {
          resolve(message.content.toString())
        } catch (e) {
          reject(e)
        }

    }, { noAck: true })

    const emit = async (event, ...args) =>  new Promise(( resolve, reject ) => {
      const correlationId = generateUUID()
      const timer = setTimeout(() => cancel(correlationId), 60000)

      requests.set(correlationId, { timer, resolve, reject , event })
      channel.sendToQueue('events', Buffer.from(JSON.stringify({ event, args })), { replyTo: queue, correlationId })
    })

    const cancel = (correlationId) => {
      const ctx = requests.get(correlationId)
      const { timer, reject, event } = ctx

      clearTimeout(timer)
      requests.delete(correlationId)

      reject(new Error(`Timeout: ${event}, correlationId: ${correlationId}`))
    }
    

    return { emit }
}

module.exports = client