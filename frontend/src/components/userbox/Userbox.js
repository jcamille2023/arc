import React from "react";
import Button from "../button/Button";

function Userbox({user}) {
    return (
        <div>
            <h4>{user.displayName}</h4>
            <p>{user.email}</p>
            <Button label="Settings" />
        </div>
    )
}

export default Userbox;