import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getDatabase, set, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
var uid;
var dune;
var first_row_created = false;
var row_filled = false;

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
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const auth = getAuth(app);
  const dbRef = ref(getDatabase());

function logout() {
  signOut(auth).then(() => {
  console.log("User is signed out.");
  window.location.href = "login.html";
  }).catch((error) => {
  // An error happened.
  });
}
window.logout = logout;
function submit() {
 var channel_id = Math.floor(Math.random()*99999);
 let members = {owner: uid};   
 let name = document.getElementById("name").value;
 set(ref(database, "/channel/" + channel_id), {name: name});
 set(ref(database, "/channel/" + channel_id + "/members/"), members);
 var url = new URL("https://jcamille2023.github.io/arc/channel");
 url.searchParams.append('channel_id', channel_id);
 console.log(url);
 window.location.href = url;
}
window.submit = submit;

function cancel() {
 var div = document.getElementById("add-arcs");
 div.setAttribute("style","visiblity: hidden;");
 div.innerHTML = "";
}
window.cancel = cancel;

function create_an_arc() {
 var div = document.getElementById("add-arcs");
  div.style.visibility = visible;
  div.innerHTML = "<div style='padding: 10px;'>" + 
  "<h1>Create an arc</h1>" + 
  "<h4>Name</h4>" + 
  "<input type='text' id='name'></input>" + 
  '<button onclick="submit()">Submit</button>'+
  '<button onclick="cancel()">Cancel</button>'+
  '</div>';
   
}
window.create_an_arc = create_an_arc;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log(user);
    uid = user.uid;
    document.getElementById("username").innerHTML = user.displayName;
    document.getElementById("user-greeting").innerHTML = "Hi, " + user.displayName + "!";

    
    
    // ...
  } else {
    window.location.href = "index.html";
    // ...
  }
});
