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

router.get('/getPendingInvites', async (request, response) => {
    const { decodedID } = request
    let pendingInviteData = await getInvitesById(decodedID)
    return response.status(200).send(pendingInviteData)
})

router.post('/sendInvite/:vb_username', async (request, response) => {
    // user id in middleware
    const { decodedID, params } = request
    const { vb_username } = params
    const userInfo = await VB_USERS.findOne({ vb_username })

    if(!userInfo) return response.status(400).send('No User Found...')
    if(userInfo.team_id !== null) return response.status(400).send('The person you are trying to invite is currently on another team\'s roster, please try again with a different VB_Username')

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
    
    const inviteInfo = await TEAM_INVITES.findById(invite_id)
    if(!inviteInfo) return response.status(400).send('Error')

    const { team_id } = inviteInfo

    const teamInfo = await VB_TEAMS.findById(team_id).lean()
    teamInfo.members.push(decodedID)

    await VB_TEAMS.findByIdAndUpdate(team_id, { members: teamInfo.members })
    await VB_USERS.findByIdAndUpdate(decodedID, { team_id: team_id })
    await TEAM_INVITES.findByIdAndRemove(invite_id)

    const accept_id = generatePendingId()

    const newAcceptInvite = new TEAM_INVITES({
        _id: accept_id,
        sender_id: decodedID,
        // target id
        user_id: teamInfo.captain,
        team_id,
        type: 'dismiss',
    })

    await newAcceptInvite.save()

    response.status(200).send(invite_id)
})

// TESTING PR
router.delete('/denyInvite/:invite_id', async (request, response) => {
    const { invite_id } = request.params
    if (!invite_id) return response.status(400).send('Error')
    await TEAM_INVITES.findByIdAndRemove(invite_id)
    response.status(200).send('Invite has been removed!')
})

function generatePendingId() {
    return `invite_${Math.random().toString(36).substr(2, 10)}`
}

async function getInvitesById(_id) {
    let userInvites = await TEAM_INVITES.find({user_id: _id}, { team_id: true  })
    const filteredUserInvites = userInvites.map(team => team.team_id)
    if(!filteredUserInvites) user.pending_invites = []
    const pendingTeams = await VB_TEAMS.find( { _id: filteredUserInvites }, { team_pic: true, team_name: true, _id: true })
    return userInvites.map(invite => {
      const team_info = pendingTeams.filter(team => team._id === invite.team_id)
      return {
        invite_id: invite._id,
        team_info: team_info[0]
      }
    })
}

module.exports = router