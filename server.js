require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs')
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })
const vb_users = require('./schemas/users/create-user')
const vb_teams = require('./schemas/team/create-team')

const app = express()
app.use(bodyParser.json())
app.use(cors())


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("Connected to Void's DBD mongodb instance")
});


app.post('/register_user', (req, res) => { 
  let new_user = new vb_users({
    _id: generateUserId(),
    ...req.body,
    password: bcrypt.hashSync(req.body.password, Number(process.env.GENSALT)),
    team_id: null,
    profile_pic: selectProfilePic()
  })

  new_user.save((err) => {
    if (err) console.log(err)
    else return res.status(200).send(userAccount(new_user))
  })
  
})

app.get('/vb-profile/:vb_username', (req, res) => {
  const { vb_username } = req.params
  vb_users.findOne({vb_username}, { _id: false, password: false, __v: false }).lean().exec((err, data) => {
    if (err) console.log(err)
    else {
      if(data.team_id) {
        vb_teams.findById(data.team_id).lean().exec((error, response) => {
          data.team_id = response
          return res.status(200).send(data)
        })
      } else return res.status(200).send(data)
    }
  })
})

app.get('/login/:token', (req, res) => {
  const { token } = req.params
  const decodedToken = JSON.parse(new Buffer(token, 'base64').toString('ascii'))
  vb_users.findOne({ vb_username: decodedToken.vb_username }).lean().exec((err, userData) => {
    if (err) console.log(err)
    else if(userData) {
      if(bcrypt.compareSync(decodedToken.password, userData.password)) {
        vb_teams.findById(userData.team_id).exec((err, teamData) => {
          if (err) console.log(err)
          else {
            userData.team_id = teamData
            res.status(200).send(userAccount(userData))
          }
        })
      } else {
        res.status(400).send('Password incorrect...')
      }
    } else {
      res.status(400).send('Account Not Found...')
    }
  })

})

app.post('/create-team', async (req, res) => {
  let team_id = generateUserId()
  const { _id } = await getCaptainId(req.headers['client-secret'], team_id)
  let new_team = new vb_teams({
    _id: team_id,
    captain: _id,
    ...req.body 
  })

  new_team.save((err) => {
    if (err) console.log(err)
    else return res.status(200).send(new_team)
  })

})

function getCaptainId(secret, team_id) {
  const captainId = new Buffer(secret, 'base64').toString('ascii')
  const updateTeamId = { team_id }
  return vb_users.findOneAndUpdate({ _id: captainId }, updateTeamId, { new: true })
}

function generateUserId() {
  return `vb_${Math.random().toString(36).substr(2, 10)}`
}

function userAccount(new_user) {
  let user = JSON.parse(JSON.stringify(new_user))
  user.auth_token = new Buffer(user._id).toString('base64')
  delete user.password
  delete user._id
  delete user.__v
  return user
}

function selectProfilePic() {
  let pictures = ['bill', 'feng', 'jake', 'kate', 'laurie', 'meg']
  return pictures[Math.floor(Math.random() * pictures.length)]
}


const port = process.env.PORT
app.listen(port, () => console.log(`Reporting for duty on port ${port}`))