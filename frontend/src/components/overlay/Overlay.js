import React from "react";
import "./Overlay.css"

function Overlay({children}) {
    return (
        <div className="box overlay">
            {children}
        </div>
    )
}

export default Overlay;