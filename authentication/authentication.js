const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

module.exports = {
    authenticateToken: async(req, res, next) => {
        let { token } = req.headers
        try {
            // let decoded = await jwt.verify(token, 'wrong-secret');
            let decoded = new Buffer(token, 'base64').toString('ascii')
            return decoded
          } catch(err) {
            throw Error('You shall not pass.')
          }

    }
}