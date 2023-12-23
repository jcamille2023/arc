
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getDatabase, set, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
var uid;
var user_email;

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
 let members = [user_email];   
 let name = document.getElementById("name").value;
 set(ref(database, "/channel/" + channel_id + "/members/"),{members: members});
 set(ref(database, "/channel/" + channel_id + "/basic_data"), {name: name});
 set(ref(database, "users/" + uid + "/channels/" + channel_id), {type: "owner"});
 var url = new URL("https://jcamille2023.github.io/arc/channel");
 url.searchParams.append('channel_id', channel_id);
 console.log(url);
 window.location.href = url;
}
window.submit = submit;

function join(e) {
 var url = new URL("https://jcamille2023.github.io/arc/channel");
 url.searchParams.append('channel_id', e);
 console.log(url);
 window.location.href = url;
}
window.join = join;

function cancel() {
 var div = document.getElementById("add-arcs");
 div.style.visibility = "hidden";
 div.innerHTML = "";
}
window.cancel = cancel;

function create_an_arc() {
 var div = document.getElementById("add-arcs");
  div.style.visibility = "visible";
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
    user_email = user.email;
    document.getElementById("username").innerHTML = user.displayName;
    document.getElementById("user-greeting").innerHTML = "Hi, " + user.displayName + "!";
    let basic_info = {
     displayName: user.displayName,
     email: user.email,
    };
   set(ref(database, "users/" + uid + "/basic_info"), basic_info);
    var arcs_ref = ref(database, "users/" + uid + "/channels/");
    onValue(arcs_ref, (snapshot) => {
     let data = snapshot.val();
     console.log(data);
     let arc_table = document.getElementById("channels-table");
     for(let n = 0; n < Object.keys(data).length; n++) {
      let arc_number = Object.keys(data)[n];
      get(child(dbRef, '/channel/' + arc_number + "/basic_data")).then((snapshot) => {
       let arc_data = snapshot.val()
       let arc = arc_table.insertRow(-1);
      let arc_cell = arc.insertCell(-1);
      arc_cell.style.padding = "15px";
      arc_cell.style.background = "black";
      let arc_container = document.createElement("div");
      let arc_name = document.createElement("h3");
      arc_name.style.color = "white";
  
      let join_arc = document.createElement("button");
      join_arc.innerHTML = "Go to arc";
      join_arc.setAttribute("onclick","join(" + arc_number + ")");
      let arc_name_node = document.createTextNode(arc_data.name);
      arc_name.appendChild(arc_name_node);
      arc_container.appendChild(arc_name);
      arc_container.appendChild(join_arc);
      arc_cell.appendChild(arc_container);
      arc.appendChild(arc_cell);
      });
      
     }
    });
    
    
    // ...
  } else {
    window.location.href = "index.html";
    // ...
  }
});
