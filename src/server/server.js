module.exports = async amqp => {
	const handlers = new Map()
	const channel = await amqp.createChannel()

	return {
		listen: async () => {
			if (handlers.size === 0) {
				console.log('[Dispatcher] Initializing server with no events.')
			}

			await channel.assertQueue('commands', { durable: false })
			await channel.consume('commands', async message => {
				const { replyTo, correlationId, deliveryMode } = message.properties
				const request = JSON.parse(message.content.toString())
				const handler = handlers.get(request.handler)

				if (handler) {
					const content = await handler(...(request.args || []))
					const response = Buffer.from(JSON.stringify(content) || '')

					channel.sendToQueue(replyTo, response, {
						correlationId,
						deliveryMode,
					})
				}

				channel.ack(message)
			})
		},
		register: (handler, callback) => handlers.set(handler, callback),
		close: async () => channel.close(),
	}
}
