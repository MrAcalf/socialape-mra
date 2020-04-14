const functions = require('firebase-functions')
const app = require('express')()
const { getAllScreams, postOneScream } = require('./handlers/screams')
const {
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser
} = require('./handlers/users')
const FBAuth = require('./util/fbAuth')

// Scream routes
app.get('/screams', getAllScreams)
// Post one Scream route
app.post('/scream',FBAuth, postOneScream)
//sign up route
app.post('/signup', signup)
// login route
app.post('/login', login)
// upload Image Route
app.post('/user/image', FBAuth, uploadImage)
// user bio information route
app.post('/user', FBAuth, addUserDetails)
// get the authenticated own user details route
app.get('/user', FBAuth, getAuthenticatedUser)

exports.api = functions.region('us-east1').https.onRequest(app)