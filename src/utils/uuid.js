const crypto = require('crypto')

module.exports = () => {
	const hash = crypto.createHash('sha256')
	const timestamp = Date.now()
	const random = Math.random().toString(2, 15)

	return hash.update(`${timestamp}-${random}`).digest('hex')
}
