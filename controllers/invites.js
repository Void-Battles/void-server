const router = require('express').Router()
const VB_USERS = require('../schemas/VB_USERS')
const TEAM_INVITES = require('../schemas/TEAM_INVITES')
const { authenticateToken } = require('../authentication/authentication')

router.use((request, response, next) => {
    authenticateToken(request).then(data => {
        request.decodedID = data
        next()
    })
})

router.post('/sendInvite/:vb_username', async (request, response) => {
    // user id in middleware
    const { decodedID, params } = request
    const { vb_username } = params
    const userInfo = await VB_USERS.findOne({ vb_username })

    if(!userInfo) return response.status(400).send('No User Found...')

    const ownerInfo = await VB_USERS.findById(decodedID)
    if(!ownerInfo) return response.status(400).send('Something went wrong... Please log in again?')

    const doesInviteExist = await TEAM_INVITES.findOne({ user_id: userInfo._id, team_id: ownerInfo.team_id })
    if(doesInviteExist) return response.status(400).send('This person has already been invited!')

    const newTeamInvite = new TEAM_INVITES({
        user_id: userInfo._id,
        team_id: ownerInfo.team_id
    })

    const didSave = await newTeamInvite.save()
    return response.status(200).send({didSave, userInfo, ownerInfo})
})

router.post('/acceptInvite', (request, response) => {
    const { user_id, team_id } = request.body
})

module.exports = router