require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')
const teamController = require('./controllers/vb_teams')
const inviteController = require('./controllers/invites')
const tournamentController = require('./controllers/vb_tournaments')
const userController = require('./controllers/users')
const loginController = require('./controllers/login')
const profileController = require('./controllers/profile')
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })

const app = express()
app.use(bodyParser.json())
app.use(cors())

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("Connected to Void's DBD mongodb instance")
});

app.use('/api/team', teamController)
app.use('/api/invite', inviteController)
app.use('/api/tournaments', tournamentController)
app.use('/api/users', userController)
app.use('/api/login', loginController)
app.use('/api/vb-profile', profileController)

const port = process.env.PORT
app.listen(port, () => console.log(`Reporting for duty on port ${port}`))