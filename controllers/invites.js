const router = require('express').Router()
const VB_USERS = require('../schemas/VB_USERS')
const VB_TEAMS = require('../schemas/VB_TEAMS')
const TEAM_INVITES = require('../schemas/TEAM_INVITES')
const { authenticateToken } = require('../authentication/authentication')

router.use((request, response, next) => {
    authenticateToken(request).then(data => {
        request.decodedID = data
        next()
    }).catch(error => response.status(400).send(error))
})

router.post('/sendInvite/:vb_username', async (request, response) => {
    // user id in middleware
    const { decodedID, params } = request
    const { vb_username } = params
    const userInfo = await VB_USERS.findOne({ vb_username })

    if(!userInfo) return response.status(400).send('No User Found...')

    const ownerInfo = await VB_USERS.findById(decodedID)
    if(!ownerInfo) return response.status(400).send('Something went wrong... Please log in again?')

    const invite_id = generatePendingId()

    const newTeamInvite = new TEAM_INVITES({
        _id: invite_id,
        user_id: userInfo._id,
        team_id: ownerInfo.team_id
    })

    const doesInviteExist = await TEAM_INVITES.findOne({ user_id: userInfo._id, team_id: ownerInfo.team_id })
    if(doesInviteExist) return response.status(400).send('This person has already been invited!')

    await newTeamInvite.save()
    return response.status(200).send('User Invited!')
})

router.post('/acceptInvite/:invite_id', async (request, response) => {
    const { decodedID } = request
    const { invite_id } = request.params
    
    const inviteInfo = await TEAM_INVITES.findById(invite_id).remove()
    if(!inviteInfo) return response.status(400).send('Error')

    const { team_id } = inviteInfo

    const teamInfo = await VB_TEAMS.findById(team_id).lean()
    teamInfo.members.push(decodedID)

    await VB_TEAMS.findByIdAndUpdate(team_id, { members: teamInfo.members })
    await VB_USERS.findByIdAndUpdate(decodedID, { team_id: team_id })
    // await TEAM_INVITES.findByIdAndRemove(invite_id)

    response.status(200).send(invite_id)
})

function generatePendingId() {
    return `invite_${Math.random().toString(36).substr(2, 10)}`
  }

module.exports = router