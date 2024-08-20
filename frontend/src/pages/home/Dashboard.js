import React, { useEffect, useState, useRef } from "react";
import Header from "../../components/Header/Header";
import Grid from "../../components/grid/Grid"
//import GridItem from "../../components/grid/GridItem"
import Overlay from "../../components/overlay/Overlay";
//import getCircles from "../../scripts/getcircles";
import Button from "../../components/button/Button";
import {socket } from "../../App";
let submitNewCircle;
function NewCircle({func}) {
    let name_ref = useRef()
    return (
        <div style={{padding: '10px'}}> 
            <h1>Create an arc</h1>
            <h4>Name</h4>
            <input ref={name_ref} type='text' id='name'></input>
            <Button label="Submit" onClick={() => {
                const nameValue = name_ref.current.value
                submitNewCircle(nameValue)
            }}/>
            <Button label="Cancel" onClick={func(null)} />
        </div>
    );
}
function Dashboard({user}) {
    const [circles,setCircles] = useState(null);
    const [overlay,setOverlay] = useState(null)
    
    useEffect(() => {
        if(socket) {
            socket.on('user data',(u) => {
                setCircles(u.circles)
            })
            socket.on('connect', () => {
                console.log("Connected to server")
                socket.emit("user data",user.getIdToken())
            })
            submitNewCircle = (name) => {
                socket.emit('new circle',name,user.getIdToken())
            }
        }
    }, [user])
    return (
        <>
            <Header user={user}/>
            <div id="container" class="container">
                {overlay}
                <div id="main" class="box">
                    <section id="open-section">
                            <h1 id="user-greeting">Hi, {user.displayName}</h1>
                            <h4>See your Arcs and Circles</h4>
                            <Button label="Create a new Circle" onClick={() => {setOverlay((<Overlay><NewCircle func={setOverlay} /></Overlay>))}} />
                            <Button label="Create a new Arc" />
                    </section>
                        
                    <section id="circles-section">
                        <Grid>
                            {circles ? circles.map((Circle, index) => (<Circle key={index} />)) : (<h1>You aren't in any Circles.</h1>)}
                        </Grid>
                    </section>
                </div> 
            </div> 
        </>
    )
}


export default Dashboard;