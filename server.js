require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const user = require('./controllers/users/userMethods');
const authentication = require('./authentication/authentication');
const app = express();
app.use(bodyParser.json())
app.use(cors())





app.post('/register_user', user.register)

app.get('/login_user/:vb_username/:password', user.login)
app.get('/authenticateAuthToken/:token', authentication.authenticateToken)




app.listen('4000', console.log('ayyee listen fam on 4000'))


