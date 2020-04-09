let serviceAccount = require('../serviceaccountkey.json')
// service account key file name shoudn´t be capitalized cause it return a deploy issue.
const admin = require('firebase-admin')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://socialape-mra.firebaseio.com"
})

const db = admin.firestore()

module.exports = {admin, db}