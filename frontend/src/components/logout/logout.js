import { auth } from "../../App";
import { signOut } from "firebase/auth";
function logout() {
    signOut(auth).then(() => {
        console.log("User is signed out.");
        }).catch((error) => {
        // An error happened.
    });
}

export default logout;