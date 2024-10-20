import { db } from ".";

class Request {
    public type: string;
    public rid: number;
    public request: {
        sid: string,
        [key: string]: any,
    }
    constructor(type,sid,request) {
        this.type = type;
        this.request = request;
        this.request.sid = sid;
        this.rid = Math.floor(Math.random()*1000000) + Number(Date.now());
    }
}
class Room {
    public id:number;
    public members: User[]
    public valid: boolean;
    public type: string | null;
    getMessages(arc: boolean) {
        let ref = db.ref("messages/" + arc ? "/arcs/" : "/circles/" + this.id);
        let messages: string[] = [];
        ref.once('value', (snapshot) => {
            snapshot = snapshot.val();
            for(let msg in snapshot) {
                 messages.push(msg);
            }
            return messages;
        })
    }
}
class User {
    public displayName: string;
    public email: string;
    public uid: string;
    public photoURL: string;

    public arcs: Room[];
    public circles: Room[];
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
            user.arcs === undefined ? this.arcs = user.arcs : this.arcs = [];
            user.circles === undefined ? this.circles = user.circles : this.circles = [];
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
    async refreshUser() {
        if(this.uid == null || this.uid == '') {
            console.error("uid is null")
            return false
        }
        let ref = db.ref("/users/" + this.uid);
        let data = await ref.once('value') 
        data = data.val();
        console.log("Refreshed user data: ", data)
        this.displayName = data.displayName === undefined ? "" : data.displayName;
        this.email = data.email === undefined ? "" : data.email;
        this.photoURL = data.photoURL === undefined ? "" : data.photoURL;
        this.arcs = data.arcs === undefined ? "" : data.arcs;
        this.circles = data.circles === undefined ? "" : data.circles;
        this.flags = data.flags === undefined ? "" : data.flags;
        this.requests = data.requests === undefined ? "" : data.requests;
    }
    // entirely replaces the user object on database with local user
    updateUser() {
        const ref = db.ref("/users/" + this.uid);
        ref.set(this);
    }
    // THIS OBJECT SHOULD VERY MUCH BE SANITIZED..
    addRequest(sid: string, type: string, request: object): boolean {
        let r = new Request(type,sid,request)
        this.requests.push(r);
        this.updateUser();
        return true;
    }
}

class Circle extends Room {
    public name: string
    public admin: User[]
    // takes either 1 or 2 args; if 1 arg, circle assumes arg is ID number and gets circle from db; if 2
    // args, constructor makes new circle with first arg being name and second arg being uid
    constructor(...args) {
        super();
        if(args.length==2) {
            this.name = args[0];
            const u = new User(args[1])
            this.id = Math.floor(Math.random()*1000000) + Number(Date.now()); 
            u.refreshUser().then(() => {
                console.log(u)
                this.members = [u];
                this.admin = [u];
                this.valid = true;
                if (u.circles) {
                    u.circles.push({id: this.id, name: this.name, type: "circle"});
                } else {
                    u.circles = [];
                    u.circles.push({id: this.id, name: this.name, type: "circle"});
                    console.error("User is undefined");
                }
                u.updateUser();
                this.updateCircle()
            })
            
        }
        if(args.length==1) {
            this.id=args[0];
            this.refreshCircle();

        }
    }
    addUserToCircle(uid: string, sid: string) {
        if(!this.admin.some(member => member.uid == uid)) {
            return null
        }
        let u = new User(sid)
        this.members.push(u);
        this.updateCircle();
        u.circles.push({id: this.id, name: this.name,type: "circle"})
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
class PublicUser {
    public displayName: string;
    public email: string;
    public uid: string;
    public photoURL: string;
    constructor(u: User) {
        this.displayName = u.displayName;
        this.email = u.email;
        this.uid = u.uid;
        this.photoURL = u.photoURL;
    }
}


class Arc extends Room {
    constructor(...args) {
        super();
        if(args.length==2) {
            this.id = Math.floor(Math.random()*1000000) + Number(Date.now());
            const u1 = new User(args[0])
            this.members = [u1];
            this.valid = true;
            const u2 = new User(args[1]);
            if(!u2.addRequest(u1.uid,"new Arc",{})) this.valid = false;
        }
        if(args.length==1) {
            this.id=args[0];
            this.refreshArc();
            let r = db.ref("/arcs/" + this.id);
            r.set(this);

        }
    }
    refreshArc() {
        let ref = db.ref("/circles/" + this.id);
        ref.once('value', (data) => {
            data = data.val();
            this.members = data.members;
            this.valid = data.valid;
        })
    }
    deleteArc(uid: string) {
        if(!this.members.some(member => member.uid === uid)) {
            return null
        }
        this.members = this.members.filter(member => member.uid !== uid);
        let sid = this.members[0];
        let u = new User(sid);
        u.arcs = u.arcs.filter(arc => arc.id !== this.id);
        u.updateUser();
        let r = db.ref("/arcs/" + this.id);
        r.set(null);
    }

}
class Message {
    public id: number;
	content: string
	author: PublicUser
	date: string;
    arc: boolean;
    rid: number; // room id
    constructor(content: string, author: PublicUser, arc: boolean, rid: number) {
        this.id = Math.floor(Math.random()*1000000) + Number(Date.now());
        this.author = author;
        this.date = String(new Date());
        this.arc = arc;
        this.rid = rid;
        this.updateMessage(content, author.uid); // will update message in server
    }
    updateMessage(content: string, uid: string) {
        if(this.author.uid != uid) return null;
        this.content = content;
        let ref = db.ref(this.arc ? "/arcs/" : "/circles/" + this.rid + "/messages/" + this.id);
        ref.set(this);
    }
    deleteMessage(uid: string) {
        if(this.author.uid != uid) return null;
        let ref = db.ref(this.arc ? "/arcs/" : "/circles/" + this.rid + "/messages/" + this.id);
        ref.set(null);
    }
}


export {Arc, Circle, Message, User, Room, Request, PublicUser}