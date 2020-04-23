const functions = require('firebase-functions')
const app = require('express')()
const { db } = require('./util/admin')
const { 
    getAllScreams, 
    postOneScream, 
    getScream, 
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require('./handlers/screams')
const {
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
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
// get scream comment route
app.get('/scream/:screamId', getScream)
// Comment a scream route
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)
// Like a scream route
app.get('/scream/:screamId/like', FBAuth, likeScream)
// Unlike a scream route
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream)
// Delete a scream route
app.delete('/scream/:screamId', FBAuth, deleteScream)
// Get User Details Route
app.get('/user/:handle', getUserDetails)
// Post notification status as read route
app.post('/notifications', FBAuth, markNotificationsRead)

exports.api = functions
.region('us-east1')
.https
.onRequest(app)

exports.createNotificationOnLike = functions
.region('us-east1')
.firestore
.document('likes/{id}')
.onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then((doc) => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: doc.id
                })
            }
        })
        .catch((err) => console.error(err))
})

exports.deleteNotificationOnUnLike = functions
.region('us-east1')
.firestore
.document('likes/{id}')
.onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch((err) => {
            console.error(err)
            return
        })
})

exports.createNotificationOnComment = functions
.region('us-east1')
.firestore
.document('comments/{id}')
.onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then((doc) => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: doc.id
                })
            }
        })
        .catch((err) => {
            console.error(err)
            return
        })
})

exports.onUserImageChange = functions
.region('us-east1')
.firestore
.document('/users/{userId}')
.onUpdate((change) => {
    console.log(change.before.data())
    console.log(change.after.data())
    if(change.before.data().imageUrl !== change.after.data().imageUrl){
        console.log('Image has changed')
        const batch = db.batch()
        return db
            .collection('screams')
            .where('userHandle', '==', change.before.data().handle)
            .get()
            .then((data) => {
                data.forEach((doc) => {
                    const scream = db.doc(`/screams/${doc.id}`)
                    batch.update(scream, { userImage: change.after.data().imageUrl})
                })
                return batch.commit()
            })
    } else return true
})

exports.onScreamDelete = functions
.region('us-east1')
.firestore
.document('/screams/{screamId}')
.onDelete((snapshot, context) => {
    const screamId = context.params.screamId
    const batch = db.batch()
    return db.collection('comments')
        .where('screamId', '==', screamId)
        .get()
        .then((data) => {
            data.forEach((doc) => {
                batch.delete(db.doc(`/comments/${doc.id}`))
            })
            return db.collection('likes')
                .where('screamId', '==', screamId)
                .get()
        })
        .then((data) => {
            data.forEach((doc) => {
                batch.delete(db.doc(`/likes/${doc.id}`))
            })
            return db.collection('notifications')
                .where('screamId', '==', screamId)
                .get()
        })
        .then((data) => {
            data.forEach((doc) => {
                batch.delete(db.doc(`/notifications/${doc.id}`))
            })
            return batch.commit()
        })
        .catch((err) => console.error(err))
})