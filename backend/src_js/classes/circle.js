import { db } from "../main"
import User, {MiniUser} from './user'
class Circle {
    constructor(name, creator) {
        this.name = name
        this.members = [creator]
        this.admin = [creator]
        this.valid = true
        this.id = 1000000 + Math.random()*999999
        let ref = db.ref("/circles/" + this.id) 
        ref.set(this)
    }
    constructor(id) {
       let ref = db.ref("/circles/" + id) 
       ref.once('value',(snapshot) => {
        let data = snapshot.val()
        this = data
       })
    }
    add_user(uid) {
        let u = new User(uid)
        let obj = {}
        this.members.push(u.toMiniUser())
        obj["members"] = this.members
    }

}