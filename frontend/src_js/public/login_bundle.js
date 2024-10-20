(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js'), require('https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js')) :
  typeof define === 'function' && define.amd ? define(['https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js', 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.firebaseApp_js, global.firebaseAuth_js));
})(this, (function (firebaseApp_js, firebaseAuth_js) { 'use strict';

  // Import the functions you need from the SDKs you need

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC5oq9fyPeoo8jVU-N07gYhjt2kFEBGqA8",
    authDomain: "arc-by-insight.firebaseapp.com",
    projectId: "arc-by-insight",
    storageBucket: "arc-by-insight.appspot.com",
    messagingSenderId: "1073428960179",
    appId: "1:1073428960179:web:c61897786f1d2ba05131c6",
    measurementId: "G-47T814R2SK"
  };

  // Initialize Firebase
  const app = firebaseApp_js.initializeApp(firebaseConfig);
  const auth = firebaseAuth_js.getAuth(app);
  const provider = new firebaseAuth_js.GoogleAuthProvider();
  function login() {
  firebaseAuth_js.signInWithPopup(auth,provider)
  .then((result) => {
    const credential = firebaseAuth_js.GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    user = result.user;
    console.log(credential);
    console.log(token);
    console.log(user);
    // IdP data available using getAdditionalUserInfo(result)
    // ...
  }).catch((error) => {
    // Handle Errors here.
    error.code;
    error.message;
    // The email of the user's account used.
    error.customData.email;
    // The AuthCredential type that was used.
    firebaseAuth_js.GoogleAuthProvider.credentialFromError(error);
    // ...
  });
  }
  window.login = login;

  firebaseAuth_js.onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log(user);
    user.uid;
    window.location.href = "dashboard.html";
    // ...
  } else {
    document.getElementById("sign-in-button").setAttribute("onclick","login()");
    // ...
  }
  });

}));
