const router = require('express').Router()
const VB_TOURNAMENT = require('../schemas/VB_TOURNAMENT')
const VB_TEAMS = require('../schemas/VB_TEAMS')
const { authenticateToken } = require('../authentication/authentication')


const startTournament = async(_id) => {
    const tournaments = await VB_TOURNAMENT.find({signed_up_teams: {$size: 4}})
    
    for(let i = 0; i < tournaments.length; i++) {
        const { _id, signed_up_teams } = tournaments[i]
        const teams = await VB_TEAMS.find({_id:signed_up_teams})
        const bracket = {round1: []}

        
        bracket.round1 = teams.map(team => team.team_name).reduce(function(result, value, index, array) {
            if (index % 2 === 0) {
                const [team1, team2] = array.slice(index, index + 2)
                result.push({team1,team2})
            } return result;
          }, []);
        tournaments[i].bracket = bracket
        const didUpdate = await VB_TOURNAMENT.findOneAndUpdate({ _id }, tournaments[i])
    }
}

// startTournament()


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
        signed_up_teams: [],
        tournament_name: '',
        status: 'current'
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
    const findTeam = await VB_TEAMS.findOne({ captain: request.decodedID }).catch((error) => response.status(500).send('Only Team Leaders can register for tournaments.'))
    if (!findTeam) return response.status(403).send('Only team captains can register for tournaments.')
    const { members, _id } = findTeam
    const { tournament_name } = request.body
    const tournamentData = await VB_TOURNAMENT.findOne({ tournament_name }).lean()
    let { signed_up_teams } = tournamentData

    if (members.length === 4) {
        let isAlreadyRegistered = false

        signed_up_teams.filter((team_id) => {
            if (team_id === _id) {
                isAlreadyRegistered = true
            }
        })

        if (isAlreadyRegistered) {
            const updated_signed_up_teams = signed_up_teams.filter((team_id) => team_id !== _id)
            await VB_TOURNAMENT.findByIdAndUpdate(tournamentData._id, { signed_up_teams: updated_signed_up_teams })
            return response.status(200).send({ removed: true })
        }

        signed_up_teams.push(_id)
        await VB_TOURNAMENT.findByIdAndUpdate(tournamentData._id, { signed_up_teams: signed_up_teams }, { new: true }).catch((error) => {
            return response.status(500).send('Internal Server Error')
        })
        return response.status(200).send({ added: true })
    } else return response.status(403).send('Team must have at least 4 members in order to play in tournaments.')
    
})

router.get('/findTournament/:tournament_name', async (request, response) => {
    const { tournament_name } = request.params
    if (!tournament_name) return response.status(400).send('Missing Tournament Id')
    
    const tournamentData = await VB_TOURNAMENT.findOne({ tournament_name }, '-_id').lean()
    console.log(tournamentData.bracket.round1)
    const signedUpTeams = tournamentData.signed_up_teams

    for(let i = 0; i < signedUpTeams.length; i++) {
        let teamInfo = await VB_TEAMS.findById(signedUpTeams[i], 'team_name team_pic -_id')
        signedUpTeams[i] = teamInfo
    }

    // tournamentData.bracket = {
    //     round1:
    //         [ { team1: 'ChasesAreFun', team2: 'PipPlz' },
    //           { team1: 'Flatmoon', team2: 'MoriUsMyers' } ],
    //     // round2: [
    //     //     {
    //     //         team1: 'StaticVoid_',
    //     //         team2: 'ChasesAreFun',
    //     //         winner: 'StaticVoid_'
    //     //     },
    //     //     {
    //     //         team1: 'Weaboo',
    //     //         team2: 'SlipnSlap',
    //     //         winner: 'Weaboo'
    //     //     }
    //     // ],
    //     finalRound: [
    //         {
    //             team1: 'StaticVoid_',
    //             team2: 'Weaboo',
    //             winner: 'StaticVoid_',
    //         }
    //     ]
    // }

    return response.status(200).send(tournamentData)
})

router.get('/getTournaments/:filter', async (request, response) => {
    const { filter } = request.params
    const tournaments = await VB_TOURNAMENT.find({ status: filter }, '-_id')
    
    for(let i = 0; i < tournaments.length; i++) {
        const signedUpTeams = tournaments[i].signed_up_teams
        if(signedUpTeams.length !== 0) {
            for(let j = 0; j < signedUpTeams.length; j++) {
                let teamInfo = await VB_TEAMS.findById(signedUpTeams[j], 'team_name -_id')
                signedUpTeams[j] = teamInfo
            }
        }
    }
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