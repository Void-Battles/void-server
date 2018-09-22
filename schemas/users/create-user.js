const mongoose = require('mongoose')
const Schema = mongoose.Schema

const users = new Schema({
    _id: String,
    vb_username: String,
    password: String,
    email: String,
    steam_id: String,
    team_id: Number || null,
    profile_pic: String
});

module.exports = mongoose.model('vb_users', users)