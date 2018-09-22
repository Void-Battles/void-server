require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })
const vb_users = require('./schemas/users/create-user')

const app = express()
app.use(bodyParser.json())
app.use(cors())


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("Connected to Void's DBD mongodb instance")
});

function generateUserId() {
  return `vb_${Math.random().toString(36).substr(2, 10)}`
}

function userAccount(new_user) {
  let user = JSON.parse(JSON.stringify(new_user))
  delete user.password
  delete user._id
  delete user.__v
  return user
}

function selectProfilePic() {
  let pictures = ['bill', 'feng', 'jake', 'kate', 'laurie', 'meg']
  return pictures[Math.floor(Math.random() * pictures.length)]
}

app.post('/register_user', (req, res) => { 
  let new_user = new vb_users({
    _id: generateUserId(),
    ...req.body,
    team_id: null,
    profile_pic: selectProfilePic()
  })

  new_user.save((err) => {
    if (err) console.log(err)
    else return res.status(200).send(userAccount(new_user))
  })
  
})

app.get('/vb-profile/:id', (req, res) => {
  const { id } = req.params

  vb_users.findById(id, { _id: false, password: false, __v: false }).exec((err, data) => {
    if (err) console.log(err)
    else return res.status(200).send(data)
  })

})

app.get('/login/:token', (req, res) => {
  const { token } = req.params
  const decodedToken = JSON.parse(new Buffer(token, 'base64').toString('ascii'))
  vb_users.findOne({ vb_username: decodedToken.vb_username, password: decodedToken.password }).exec((err, data) => {
    if (err) console.log(err)
    else return res.status(200).send(userAccount(data))
  })

})

const port = process.env.PORT
app.listen(port, () => console.log(`Reporting for duty on port ${port}`))