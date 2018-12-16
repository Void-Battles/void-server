const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tournament = new Schema({
    _id: String,
    survivors: [],
    killer: String,
    map: String,
    signed_up_teams: [],
    tournament_name: String,
    status: String,
    bracket: Object
})

module.exports = mongoose.model('vb_tournaments', tournament)