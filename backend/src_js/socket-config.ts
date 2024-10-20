
import { Socket, Server } from "socket.io";
import {createServer} from "http"
import { db, auth } from ".";
import { Arc, Circle, Message, User, PublicUser, Room, Request } from "./classes";
const express = require('express');

async function getUIDfromToken(token) {
    try {
        let u = await auth.verifyIdToken(token);
        return u.uid;

    } catch(error) {
        return new Error("User ID could not be verified.");
    }
} 

function initServer() {
    console.log("initalizing SocketIO server")
    let io = newSocketServer();
    io.on('connection', (socket)=>{
        console.log("New connection")
        // token verification
        let uid;
        try {
            uid = getUIDfromToken(socket.handshake.auth.token);
        } catch(error) {
            socket.emit("error",error);
            socket.disconnect();
            return;
        }
        let u = new User(uid);
        socket.emit("user data", u);
        // room join listener; should probably add feature to add members from get
        socket.on('new circle', async(token:string,name:string) => {
            let uid;
            try{
                uid = getUIDfromToken(token)
            } catch(error) {socket.emit("error", error); return;}
            let c = new Circle(name,uid);
            socket.emit("success",{type: "new circle", id: c.id});
        });
        // need to add new Arc system
        socket.on('join room',async (token:string,id:number,arc:boolean,)=>{
            let uid;
            try{
                uid = getUIDfromToken(token)
            } catch(error) {socket.emit("error", error); return;}
            let t = arc ? new Arc(id) : new Circle(id);
            if (t.members.some(member => member.uid === uid)) {
                socket.join(arc ? "arc_" + id : "circle_" + id);
                socket.emit('success', {type: "join room", room: arc ? "arc_" + id : "circle_" + id });
            } else {
                socket.emit('error', { message: 'User not found in the room' });
            }
        });
        socket.on('new message', async(token:string, rid: number, arc: boolean, content: string) => {
            let uid;
            try{
                uid = getUIDfromToken(token)
            } catch(error) {socket.emit("error", error); return;}
            let room = arc ? new Arc(rid) : new Circle(rid);
            if(!room.members.some(member => member.uid === uid)) {
                socket.emit("error",{message: "User not a member of room"}); 
                return;
            }
            let u = new PublicUser(new User(uid));
            let msg = new Message(content, u, arc,rid);
            socket.to(arc ? "arc_" : "circle_" + rid).emit("new message",msg);
        })
    })
    
}

function newSocketServer(): Server {
    // add cors config here
    let server = createServer(express());
    server.listen(3000, () => {
        console.log("listening on port 3000")
    })
    return new Server(server, {
        cors: {
            origin: "http://localhost:3001",
            methods: ["GET", "POST"]
          }
    })
}


export { initServer }