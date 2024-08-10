import React from "react";
import "./Grid.css"
import Button, {link} from "../button/Button";
function GridItem({title,description,buttonLabel,buttonLink,children}) {
    return (
        <div className="grid-item" style={{marginTop: '4%',marginBottom:'4%',marginLeft:"4%",marginRight:"4%"}}>
            <h1>{title}</h1>
            <p>{description}</p>
            <Button onClick={link(buttonLink)} label={buttonLabel} />
            {children}
        </div>
    )
}

export default GridItem;