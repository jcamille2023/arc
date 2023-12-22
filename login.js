// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
  import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCqUDOyX-OrrrncNv5uABW8hiLndPsMDMg",
    authDomain: "insight-34bc8.firebaseapp.com",
    projectId: "insight-34bc8",
    storageBucket: "insight-34bc8.appspot.com",
    messagingSenderId: "652635905647",
    appId: "1:652635905647:web:05a5378b1f51f58a6d779a"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
function login() {
  signInWithPopup(auth,provider)
  .then((result) => {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    user = result.user;
    console.log(credential);
    console.log(token);
    console.log(user);
    // IdP data available using getAdditionalUserInfo(result)
    // ...
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    // ...
  });
  }
window.login = login;

  onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log(user);
    const uid = user.uid;
    window.location.href = "dashboard.html";
    // ...
  } else {
    document.getElementById("sign-in-button").setAttribute("onclick","login()");
    // ...
  }
});
  
