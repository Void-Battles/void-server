const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

module.exports = {
    authenticateToken: async(req, res, next) => {
        let { token } = req.params
        try {
            let decoded = await jwt.verify(token, 'wrong-secret');
            console.log(decoded)
          } catch(err) {
            console.log(err)
          }

    }
}