import { initializeApp, credential, auth, database } from "firebase-admin"

initializeApp({
    credential: credential.applicationDefault(),
    databaseURL: "https://arc-by-insight-default-rtdb.firebaseio.com/"
})
authClient,db = (async () => {
    let authClient = auth()
    let db = database()
    return authClient,db
})()




export {authClient, db}