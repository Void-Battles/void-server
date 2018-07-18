const jwt = require('jsonwebtoken')
const { client } = require('.././dbConnection.js')
const bcrypt = require('bcrypt')

module.exports = {
  register: (request, response) => {
    let { vb_username, uplay, email, password } = request.body

    bcrypt.hash(password, 10, (err, hash) => {
      if (hash) {
        let checkIfUserExists = {
          text: 'SELECT * FROM users WHERE (email = $1 OR vb_username  = $2)',
          values: [email, vb_username]
        }
        let insertNewUser = {
          text:
            'INSERT INTO users (vb_username, email, passwd, uplay) VALUES ($1, $2, $3, $4) RETURNING *',
          values: [vb_username, email, hash, uplay]
        }
        client.query(checkIfUserExists, (error, result) => {
          if (!result.rows[0]) {
            client.query(insertNewUser, (err, newUser) => {
              if (newUser) {
                console.log(
                  'Account ' +
                    request.body.vb_username +
                    ' has been registered.'
                )
                let token = jwt.sign(
                  {
                    name: 'auth_token',
                    vb_username: newUser.rows[0].vb_username
                  },
                  'secret',
                  { expiresIn: '2m' }
                )
                response.status(200).send({ token, userData: newUser.rows[0] })
              } else if (err) {
                console.log(
                  'Error registering user ' +
                    request.body.vb_username +
                    ' to the database.'
                )
                response.status(200).send({
                  error: 'Account could not be created. Try again later.'
                })
              }
            })
          } else {
            console.log('User ' + request.body.vb_username + ' already exists.')
            response
              .status(200)
              .send({ error: 'Email or Username is already in use' })
          }
        })
      } else if (err) {
        response.status(200).send({ error: 'Password was incorrect.' })
      }
    })
  },

  login: (request, response) => {
    let { vb_username, password } = request.params

    let checkIfUserExists = {
      text: 'select * from users where (vb_username = $1 OR email = $1)',
      values: [vb_username]
    }
    client.query(checkIfUserExists, (err, result) => {
      if (result.rows[0]) {
        bcrypt.compare(password, result.rows[0].passwd, (err, verified) => {
          if (verified) {
            console.log('Token has been created for: ' + vb_username)
            let token = jwt.sign(
              { name: 'auth_token', vb_username: vb_username },
              'secret',
              { expiresIn: '1m' }
            )
            response.status(200).send({ token, userData: result.rows[0] })
          }
        })
      } else response.status(200).send({ error: 'ERROR: USER DOES NOT EXIST' })
    })
  },

  authenticateToken: (request, response) => {
    let { token, vb_username } = request.params

    jwt.verify(token, 'secret', (error, decoded) => {
      if (error) {
        response.status(200).send({ error })
      } else if (decoded) {
        let checkIfUserExists = {
          text: 'select * from users where (vb_username = $1 OR email = $1)',
          values: [decoded.vb_username]
        }
        client.query(checkIfUserExists, (error, result) => {
          if (result.rows[0]) {
            console.log(
              'Token Verified. Logging in ' + result.rows[0].vb_username
            )
            response.status(200).send({ userData: result.rows[0] })
          }
        })
      }
    })
  }
}
