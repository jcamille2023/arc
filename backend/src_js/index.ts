import { initializeApp, applicationDefault } from "firebase-admin/app"
import { getAuth} from "firebase-admin/auth"
import { getDatabase } from "firebase-admin/database"

let app, db, auth;
function main(): number {
    app = initializeApp({
        credential: applicationDefault(),
        databaseURL: "BLANK FOR NOW"
    });
    auth = getAuth(app);
    db = getDatabase(app);
    

    return 0
}

export {auth, db}



