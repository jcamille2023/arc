import React from 'react'
import "./Grid.css"
function Grid({children}) {
    children = React.Children.map(children, (child) => {
        return React.cloneElement(child, {
            className: child.props.className ? child.props.className + " grid-item" : "grid-item",
            style: {marginTop: '4%',marginBottom:'4%',marginLeft:"4%",marginRight:"4%"},
        });
    });
    return (
        <div className='grid-container'>
            {children}
        </div>
    )
}

export default Grid;