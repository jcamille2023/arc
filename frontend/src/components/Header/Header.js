import React, {useState} from "react";
import "./Header.css"

// component imports
import Button, { link } from '../button/Button'
import logout from "../logout/logout";
import Userbox from "../userbox/Userbox";

function Header({user}) {
    const [hoverState,setHoverState] = useState(false);

    return (
    <div id="header">
        <table>
            <tbody>
                <tr>
                    <td width="88.25%">
                        <h2>Arc</h2>
                    </td>
                    <td>
                        <p onMouseEnter={() => {setHoverState(true)}} onMouseLeave={() => {setHoverState(false)}} id="username">{user.displayName}</p>
                        {hoverState ? (<Userbox user={user} />) : null}
                    </td>
                    <td>
                        <Button label="Dashboard" onClick={link('./dashboard')} />
                    </td>
                    <td>
                        <Button onClick={logout} label={"Sign out"} />
                    </td>
                    </tr>
            </tbody>
        </table>
</div>
    )
}


export default Header;