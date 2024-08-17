class Message {
    constructor(content,author,parent_id,arc) {
        this.id = int(String(Date.now()) + String(1000000 + Math.random()*999999))
        this.author = author.toMiniUser()
        this.content = content
        this.timestamp = String(new Date())
        this.arc = arc
        let ref = arc ? db.ref("/messages/arcs/" + parent_id + "/" + this.id) :db.ref("/messages/circles/" + parent_id + "/" + this.id)
        ref.set(this,(error) => {
            if(error) {
                error = "Message posting failed: " + error
                this.error = error
            }
        }) 
    }
    constructor(message) {
        this.id = message.id
        this.author = message.author
        this.content = message.content
        this.timestamp = message.timestamp
    }
    edit_message(content) {
        this.content = content
    }
    publish_message() {
        let ref = this.arc ? db.ref("/messages/arcs/" + parent_id + "/" + this.id) :db.ref("/messages/circles/" + parent_id + "/" + this.id)
        ref.set(this, (error) => {
            if(error) {
                error = "Message posting failed: " + error
                this.error = error
            }
        })
    }
}

export default Message