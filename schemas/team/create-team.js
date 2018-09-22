const mongoose = require('mongoose')
const Schema = mongoose.Schema

const teams = new Schema({
    _id: String,
    team_name: String,
    captain: String,
    members: [Number] || null,
    created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('vb_teams', teams)