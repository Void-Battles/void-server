const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tournament = new Schema({
    _id: String,
    survivors: [],
    killer: String,
    map: String,
    total_signup: Number,
    signed_up_teams: []
})

module.exports = mongoose.model('vb_tournaments', tournament)