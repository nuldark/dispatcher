const amqplib = require('amqplib')

module.exports = async url => {
  const amqp = await amqplib.connect(url)

  const handler = await require('./server')(amqp)
  const client = await require('./client')(amqp)

  return {
    call: client.call,
    register: handler.register,
    start: handler.listen
  }
}
