const mongoose = require('mongoose')
const Schema = mongoose.Schema

const invite = new Schema({
    user_id: String,
    team_id: String
});

module.exports = mongoose.model('pending_invites', invite)