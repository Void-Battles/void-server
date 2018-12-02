const router = require('express').Router()
const VB_USERS = require('../schemas/VB_USERS')
const TEAM_INVITES = require('../schemas/TEAM_INVITES')
const VB_TEAMS = require('../schemas/VB_TEAMS')

router.get('/:token', async (req, res) => {
    const { token } = req.params
    const decodedToken = JSON.parse(new Buffer(token, 'base64').toString('ascii'))
    const userData = await VB_USERS.findOne({ vb_username: decodedToken.vb_username }).lean()
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

  const getAllUserInfo = async (_id, user) => {
    // Handle Invites
    let userInvites = await TEAM_INVITES.find({ user_id: _id }, { team_id: true  })
    const filteredUserInvites = userInvites.map(team => team.team_id)
    if(!filteredUserInvites) user.pending_invites = []
    const pendingTeams = await VB_TEAMS.find( { _id: filteredUserInvites }, { team_pic: true, team_name: true, _id: true })
    user.pending_invites = userInvites.map(invite => {
      const team_info = pendingTeams.filter(team => team._id === invite.team_id)
      return {
        invite_id: invite._id,
        team_info: team_info[0]
      }
    })
  
    // Handle Team
    const userTeam = await VB_TEAMS.findById(user.team_id)
    user.team_id = userTeam
  
    user.auth_token = new Buffer(user._id).toString('base64')
    delete user.password
    delete user._id
    delete user.__v
    return user
  }

  module.exports = router