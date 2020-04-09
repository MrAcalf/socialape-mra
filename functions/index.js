const functions = require('firebase-functions')
const app = require('express')()
const { getAllScreams, postOneScream } = require('./handlers/screams')
const {signup, login} = require('./handlers/users')
const FBAuth = require('./util/fbAuth')

// Scream routes
app.get('/screams', getAllScreams)
// Post one Scream route
app.post('/scream',FBAuth, postOneScream)
//sign up route
app.post('/signup', signup)
// login route
app.post('/login', login)

exports.api = functions.region('us-east1').https.onRequest(app)