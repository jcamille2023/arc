import { initializeApp, applicationDefault } from "firebase-admin/app"
import { getAuth} from "firebase-admin/auth"
import { getDatabase } from "firebase-admin/database"
import { initServer } from "./socket-config";
let app, db, auth;
function main(): number {
    app = initializeApp({
        credential: applicationDefault(),
        databaseURL: "https://arc-by-insight-default-rtdb.firebaseio.com/",
    });
    auth = getAuth(app);
    db = getDatabase(app);
    initServer();

    return 0
}
main()

export {auth, db}



