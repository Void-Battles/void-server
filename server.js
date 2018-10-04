require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const vb_users = require('./schemas/VB_USERS')
const vb_teams = require('./schemas/VB_TEAMS')
const TEAM_INVITES = require('./schemas/TEAM_INVITES')
const teamController = require('./controllers/vb_teams')
const inviteController = require('./controllers/invites')
const tournamentController = require('./controllers/vb_tournaments')
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })

const app = express()
app.use(bodyParser.json())
app.use(cors())


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("Connected to Void's DBD mongodb instance")
});

app.use('/api/team', teamController)
app.use('/api/invite', inviteController)
app.use('/api/tournaments', tournamentController)

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
    else {
      let user = userAccount(new_user)
      user.pending_invites = []
      return res.status(200).send(user)
    }
  })
  
})

app.get('/vb-profile/:vb_username', (req, res) => {
  const { vb_username } = req.params
  vb_users.findOne({vb_username}, { _id: false, password: false, __v: false }).lean().exec((err, data) => {
    if (err || !data) return res.status(400).send('User Not Found...')
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

const getAllUserInfo = async (_id, user) => {
  // Handle Invites
  let userInvites = await TEAM_INVITES.find({user_id: _id}, { team_id: true  })
  const filteredUserInvites = userInvites.map(team => team.team_id)
  if(!filteredUserInvites) user.pending_invites = []
  const pendingTeams = await vb_teams.find( { _id: filteredUserInvites }, { team_pic: true, team_name: true, _id: true })
  user.pending_invites = userInvites.map(invite => {
    const team_info = pendingTeams.filter(team => team._id === invite.team_id)
    return {
      invite_id: invite._id,
      team_info: team_info[0]
    }
  })

  // Handle Team
  const userTeam = await vb_teams.findById(user.team_id)
  user.team_id = userTeam

  user.auth_token = new Buffer(user._id).toString('base64')
  delete user.password
  delete user._id
  delete user.__v
  return user
}

app.get('/login/:token', async (req, res) => {
  const { token } = req.params
  const decodedToken = JSON.parse(new Buffer(token, 'base64').toString('ascii'))
  const userData = await vb_users.findOne({ vb_username: decodedToken.vb_username }).lean()
  if(userData) {
      if(bcrypt.compareSync(decodedToken.password, userData.password)) {
        const userToSend = await getAllUserInfo(userData._id, userData)
        res.status(200).send(userToSend)
      } else {
        res.status(400).send('Password incorrect...')
      }
    } else {
      res.status(400).send('Account Not Found...')
    }
})

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