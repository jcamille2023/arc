import { getIdToken } from "firebase/auth";
function getCircles(user) {
    return new Promise((resolve,reject) => {
        let token = getIdToken(user);
        // add code to send and verify token and receive circles
        if(!token) {
            reject("Token is invalid.")
        }
    })
}

export default getCircles;