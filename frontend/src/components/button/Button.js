import React from "react";
import "./Button.css"

function Button({label,onClick}) {
    return (
        <button onClick={onClick} className="btn-custom">
            {label}
        </button>
    );
}

function link(url) {
    return () => {
        window.location.href = url;
    }
}

export default Button;
export {link}