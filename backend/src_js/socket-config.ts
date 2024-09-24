
import { Socket, Server } from "socket.io";
import {createServer} from "http"


function initServer() {
    let io = newSocketServer();
    io.on('connection', (socket)=>{
        socket.on('join room',(uid:string,id:string)=>{

        })
    })
    
}

function newSocketServer(): Server {
    // add cors config here
    return new Server(createServer())
}