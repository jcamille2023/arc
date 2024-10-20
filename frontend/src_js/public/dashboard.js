import {initializeApp} from "firebase/app"
import {getAuth, onAuthStateChanged} from "firebase/auth"
import { io } from "socket.io-client";
function main() {
    const firebaseConfig = {
        apiKey: "AIzaSyC5oq9fyPeoo8jVU-N07gYhjt2kFEBGqA8",
        authDomain: "arc-by-insight.firebaseapp.com",
        projectId: "arc-by-insight",
        storageBucket: "arc-by-insight.appspot.com",
        messagingSenderId: "1073428960179",
        appId: "1:1073428960179:web:c61897786f1d2ba05131c6",
        measurementId: "G-47T814R2SK"
      };
    let socket;
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    onAuthStateChanged(auth, async (user) => {
        if(user) {
            socket = io("http://localhost:3000", {
                query: {
                  token: await user.getIdToken()
                },
                transports: ['websocket'],
                upgrade: false
              })
            socket.on("user data", (u) => {
                console.log(u);
            });
        }
        
        
    })
    
    return 0;
}
main()