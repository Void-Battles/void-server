const mongoose = require('mongoose')
const Schema = mongoose.Schema

const team = new Schema({
    _id: String,
    team_name: String,
    captain: String,
    members: [String] || null,
    team_pic: String,
    created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('vb_teams', team)