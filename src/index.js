const client = require('./client')
const server = require('./server')

module.exports = options => {

    return { 
      Client: client(options.url),
      Server: server(options.url)
    }
}