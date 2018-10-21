const router = require('express').Router()
const VB_TOURNAMENT = require('../schemas/VB_TOURNAMENT')
const VB_TEAMS = require('../schemas/VB_TEAMS')
const { authenticateToken } = require('../authentication/authentication')


router.post('/createTournament', async (request, response) => {
    const tournamentId = generateTournamentId()
    const survivorsToPlay = generateTournamentSurvivors()
    const killerToPlay = generateTournamentKiller()
    const mapToPlay = selectTournamentMap()

    const newTournament = new VB_TOURNAMENT({
        _id: tournamentId,
        survivors: survivorsToPlay,
        killer: killerToPlay,
        map: mapToPlay,
        total_signup: 0,
        signed_up_teams: []
    })

    await newTournament.save()
    return response.status(200).send(newTournament)
    
})

const middleware = (request, response, next) => {
    authenticateToken(request).then(data => {
        request.decodedID = data
        next()
    }).catch(error => response.status(400).send('Please login to perform this action.'))
}

router.post('/register', middleware, async (request, response) => {
    const findTeam = await VB_TEAMS.find({ captain: request.decodedID })
    const { tournament_name } = request.body
    const tournamentData = await VB_TOURNAMENT.findOne({tournament_name}).lean()

    if (findTeam[0].members.length === 4) {
        tournamentData.signed_up_teams.push(findTeam[0]._id)
        await VB_TOURNAMENT.findByIdAndUpdate(tournamentData._id, { signed_up_teams: tournamentData.signed_up_teams }, { new: true }).catch((error) => {
            return response.status(500).send('Internal Server Error')
        })
        return response.status(200).send('Your team has been registered!')
    } else return response.status(403).send('Team must have at least 4 members in order to play in tournaments.')
    
})

router.get('/findTournament/:tournament_name', async (request, response) => {
    const { tournament_name } = request.params
    if (!tournament_name) return response.status(400).send('Missing Tournament Id')
    const tournamentData = await VB_TOURNAMENT.findOne({tournament_name}, '-_id')
    return response.status(200).send(tournamentData)
})

router.get('/getTournaments/:filter', async (request, response) => {
    const {filter} = request.params
    const tournaments = await VB_TOURNAMENT.find({status: filter}, '-_id')
    return response.status(200).send(tournaments)
})

function generateTournamentId() {
    return `tournament_${Math.random().toString(36).substr(2, 10)}`
}

function selectTournamentMap() {
    const maps = ['coal_tower', 'blood_lodge', 'badham_preschool', 'family_residence', 'shelter_woods', 'father_campbells_chapel']
    const index = Math.floor(Math.random() * maps.length)
    let selectedMap = maps[index]
    return selectedMap
}

function generateTournamentSurvivors() {
    const survivors = ['ace', 'adam', 'bill', 'claudette', 'david', 'dwight', 'feng', 'jake', 'kate', 'laurie', 'nea', 'quentin']
    const selectedSurvivors = [];   
    for (i = 0; i <= survivors.length; i++) {
        let index = Math.floor(Math.random() * survivors.length)
        let selected = survivors[index]
        selectedSurvivors.push(selected)
        if (selectedSurvivors.length === 4) {
            return selectedSurvivors
        }
    }

}

function generateTournamentKiller() {
    const killers = ['cannibal', 'clown', 'doctor', 'hag', 'hillbilly', 'huntress', 'nightmare', 'nurse', 'pig', 'shape', 'spirit', 'trapper', 'wraith']
    const index = Math.floor(Math.random() * killers.length)
    const selectedKiller = killers[index]
    return selectedKiller
}

module.exports = router