import { authClient, db } from "../main";
class User { // for use in Circles, Arcs, and Messages, meant mainly as a data type
    constructor(uid) {
        let u = authClient.getUser(uid)
        this.displayName = u.displayName
        this.email = u.email
        this.photoURL = u.photoURL
        this.uid = u.uid
    }
}
class DbUser extends User {
    constructor(uid) {
        super(uid)
        let ref = db.ref("/users/" + uid)
        this.arcs = []
        this.circles = []
        this.flags = []
        this.arc_requests = []

        ref.once('value', (snapshot) => {
        let data = snapshot.val()
        if(data.uid == this.uid) {
            console.log("User found in database.")
            this.arcs = data.arcs;
            this.circles = data.circles;
            this.flags = data.flags
            this.arc_requests = data.arc_requests
        }
        else {
            console.log("User ", uid, " not found in database, creating db entry")
            ref.set(this)
        }
        console.log("Local copy of User made!")
        })
    }
    async change_attributes(args = {}) {
        let obj;
        if(args["displayName"]) {
            obj["displayName"] = args["displayName"]
        }
        if(args["email"]) {
            obj["email"] = args["email"]
        }
        if(args["photoURL"]) {
            obj["photoURL"] = args["photoURL"]
        }
        try {
            let ref = db.ref("/users/" + uid)
            ref.update(obj)
            await authClient.updateUser(this.uid,obj)
            console.log("Auth properties updated")
            return null
        } catch (error) {
            return error
        }
    }
}

