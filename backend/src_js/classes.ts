import { db } from ".";

class Request {
    public type: string;
    public rid: number;
    public request: {
        sid: string,
        [key: string]: any,
    }
}

class User {
    public displayName: string;
    public email: string;
    public uid: string;
    public photoURL: string;

    public arcs: object[];
    public circles: object[];
    private flags: string[];
    private requests: object[];

    constructor(...args) {
        if (args[0] instanceof User) {
            // Handle the case where the first argument is an instance of User
            const user = args[0];
            this.displayName = user.displayName;
            this.email = user.email;
            this.uid = user.uid;
            this.photoURL = user.photoURL;
            this.arcs = user.arcs;
            this.circles = user.circles;
            this.flags = user.flags;
            this.requests = user.requests;
        }
        else if(args.length == 3) {
            this.displayName = args[0];
            this.email = args[1];
            this.photoURL = args[2];
        }else if(args.length == 7) { // not really meant for use, just in case needed
            this.displayName = args[0];
            this.email = args[1];
            this.photoURL = args[2];
            this.arcs = args[3];
            this.circles = args[4];
            this.flags = args[5];
            this.requests = args[6];  
        } 
        else if (args.length=1) {
            this.uid = args[0];
            this.refreshUser();
        }
        
    }
    // entirely replaces local user object with user object from database
    refreshUser() {
        if(this.uid == null || this.uid == '') {
            console.error("uid is null")
            return false
        }
        let ref = db.ref("/users/" + this.uid);
        ref.once('value', (data) => {
            data = data.val();
            this.displayName = data.displayName;
            this.email = data.email;
            this.photoURL = data.photoURL;
            this.arcs = data.arcs;
            this.circles = data.circles;
            this.flags = data.flags;
            this.requests = this.requests;
        })
    }
    // entirely replaces the user object on database with local user
    updateUser() {
        const ref = db.ref("/users/" + this.uid);
        ref.set(this);
    }
    // THIS OBJECT SHOULD VERY MUCH BE SANITIZED..
    addRequest(sid: string, type: string, request: Request): boolean {
        let rid = Math.floor(Math.random()*1000000) + Number(Date.now());
        if(!(request instanceof Request)) {
            return false;
        }
        this.requests.push({rid: rid, type: type, request: request});
        this.updateUser();
        return true;
    }
    // sending from this object to recipient user
    sendUserRequest(rid: string, type: string, request: Request) {
        let u = new User(rid);
        u.addRequest(this.uid,type,request)
    }
}

class Circle {
    public name: string
    public id: number
    public members: User[]
    public admin: User[]
    public valid: boolean

    constructor(...args) {
        if(args.length==2) {
            this.name = args[0];
            this.id = Math.floor(Math.random()*1000000) + Number(Date.now());
            const u = new User(args[1])
            this.members = [u];
            this.admin = [u];
            this.valid = true;
            this.updateCircle()
        }
        if(args.length==1) {
            this.id=args[0];

        }
    }
    addUserToCircle(uid: string, sid: string) {
        if(!this.admin.some(member => member.uid == uid)) {
            return null
        }
        let u = new User(sid)
        this.members.push(u);
        this.updateCircle();
        u.circles.push({id: this.id, name: this.name})
        u.updateUser()
    }
    removeUserFromCircle(uid: string, sid: string) {
        if(!this.admin.some(member => member.uid === uid)) {
            return null
        }
        this.members = this.members.filter(member => member.uid !== sid);
        let u = new User(sid);
        u.circles = u.circles.filter(circle => circle.id !== this.id);
        u.updateUser();
        
        this.updateCircle();
    }
    updateCircle() {
        const ref = db.ref("/circles/" + this.id);
        ref.set(this);
    }
    refreshCircle() {
        if(this.id == null || this.id == 0) {
            console.error("id is null")
            return false
        }
        let ref = db.ref("/circles/" + this.id);
        ref.once('value', (data) => {
            data = data.val();
            this.name = data.name;
            this.members = data.members;
            this.admin = data.admin;
            this.valid = data.valid;
        })
    }
}


