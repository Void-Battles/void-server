const express = require('express')
const router = express.Router()
const VB_TEAM = require('../schemas/VB_TEAMS')
const VB_USER = require('../schemas/VB_USERS')
const MEMBER_PROPERTIES = { vb_username: true, profile_pic: true, _id: false }
const TEAM_PROPERTIES = { _id: false, __v: false }

const generateTeamId = () => `vbteam_${Math.random().toString(36).substr(2, 10)}`

router.get('/vb_team/:team_name', async (request, response) => {
    const teamData = await VB_TEAM.findOne({ team_name: request.params.team_name }, TEAM_PROPERTIES).lean()
    if (!teamData) {
        return response.status(400).send('Team Not Found')
    }
    const captainData = await VB_USER.findOne({ _id: teamData.captain }, MEMBER_PROPERTIES)
    teamData.captain = captainData
    if (teamData.members.length) {
        const memberData = await VB_USER.find({ _id: teamData.members }, MEMBER_PROPERTIES)
        teamData.members = memberData
    }
    response.status(200).send(teamData)
})

router.post('/create-team', async (req, res) => {
    let team_id = generateTeamId()
    const { _id } = await getCaptainId(req.headers['client-secret'], team_id)
    let new_team = new VB_TEAM({
      _id: team_id,
      captain: _id,
      team_pic: selectTeamPic(),
      ...req.body 
    })
  
    new_team.save((err) => {
      if (err) console.log(err)
      else return res.status(200).send(new_team)
    })
  
  })
  
  function selectTeamPic() {
    let perk_icons = ['boil_over', 'empathy', 'hope', 'prove_thyself', 'save_the_best_for_last', 'sloppy_butcher','thanataphobia', 'no_one_left_behind', 'wake_up', 'well_make_it']
    return perk_icons[Math.floor(Math.random() * perk_icons.length)]
  }

  function getCaptainId(secret, team_id) {
    const captainId = new Buffer(secret, 'base64').toString('ascii')
    const updateTeamId = { team_id }
    return VB_USER.findOneAndUpdate({ _id: captainId }, updateTeamId, { new: true })
  }

  // TODO: I guess we started to add functionality for a captain to kick a player
  // should probably also add the ability for a player to leave a team.
  async function kickPlayer(team_name) {
    const playerRemoved = await VB_TEAM.findOneAndRemove()
  }


module.exports = router