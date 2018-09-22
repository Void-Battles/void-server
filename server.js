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

app.post('/register_user', (req, res) => {
  const { vb_username, steam_id, email, password } = req.body
  
  let new_user = new vb_users({
    _id: generateUserId(),
    vb_username: vb_username,
    password: password,
    email: email,
    steam_id: steam_id,
    team_id: null,
    profile_pic: 'MEG'
  })

  new_user.save((err) => {
    if (err) console.log(err)
    else return res.status(200).send(new_user)
  })
  
})

app.get('/vb-profile/:id', (req, res) => {
  const { id } = req.params

  vb_users.findById(id).exec((response) => {
    console.log(response)
  })

  console.log('This is the profile id:', id)
})

const port = process.env.PORT
app.listen(port, () => console.log(`Reporting for duty on port ${port}`))