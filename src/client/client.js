const utils = require('../utils')

module.exports = async amqp => {
  const requests = new Map()

  const channel = await amqp.createChannel()
  const { queue } = await channel.assertQueue('', { exclusive: true })

  channel.consume(queue, async message => {
    if (!message) return

    const { correlationId } = message.properties
    if (requests.has(correlationId)) {
      const { resolve, reject, timer } = requests.get(correlationId)

      try {
        clearTimeout(timer)
        resolve(message.content.toString())
      } catch (error) {
        reject(error)
      }
    }
  })

  return {
    call: async (handler, ...args) =>
      new Promise((resolve, reject) => {
        const correlationId = utils.uuid()
        const timer = setTimeout(() => {
          const { timer, reject, handler } = requests.get(correlationId)

          clearTimeout(timer)
          requests.delete(correlationId)

          reject(new Error(`Timeout: ${handler}, correlationId: ${correlationId}`))
        }, 60000)

        requests.set(correlationId, { timer, resolve, reject, handler })

        channel.sendToQueue('commands', Buffer.from(JSON.stringify({ handler, args })), {
          replyTo: queue,
          correlationId
        })
      })
  }
}
