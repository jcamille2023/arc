import React from "react";
import "./Header.css"
function Header() {
    return (
    <div id="header">
        <table>
            <tbody>
                <tr>
                    <td width="88.25%">
                        <h2>Arc</h2>
                    </td>
                    <td>
                        <p id="username"></p>
                    </td>
                    <td>
                        <a href="dashboard">Dashboard</a>
                    </td>
                    <td><a href="javascript:logout()">Sign out</a></td>
                    </tr>
            </tbody>
        </table>
</div>
    )
}


export default Header;