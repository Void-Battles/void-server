const router = require('express').Router()
const VB_TOURNAMENT = require('../schemas/VB_TOURNAMENT')

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

router.get('/findTournament/:id', async (request, response) => {
    const { id } = request.params
    if (!id) return response.status(400).send('Missing Tournament Id')
    const tournamentData = await VB_TOURNAMENT.findById(id, '-__v')
    return response.status(200).send(tournamentData)
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