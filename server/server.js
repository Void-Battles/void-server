require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const massive = require("massive");
const jwt = require('jsonwebtoken')
const loginCtrl = require('./controllers/loginCtrl')

const app = express();
app.use(bodyParser.json())
app.use(cors())





app.post('/register_user', loginCtrl.register)

app.get('/login_user/:vb_username/:password', loginCtrl.login)
app.get('/authenticateAuthToken/:token', loginCtrl.authenticateToken)




app.listen('4000', console.log('ayyee listen fam on 4000'))


