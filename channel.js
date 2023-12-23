import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getDatabase, set, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
var uid;
var display_name;
var first_row_created = false;
var row_filled = false;
const searchParams = new URLSearchParams(window.location.search);
const channel_id = searchParams.get('channel_id');

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
const members;
 get(child(dbRef, "/channel/" + channel_id + "/members/"), (snapshot) => {
   let added_email = document.getElementById("email").value;
   let data = snapshot.val()
   members = data.members;
   members.push(email);
 }
 set(ref(database, "/channel/" + channel_id + "/members/"), {members: members});
  cancel();
  document.getElementById("success").innerHTML = "Successfully added " + document.getElementById("email").value;
}
window.submit = submit;

function cancel() {
 var div = document.getElementById("manage_users");
 div.style.visibility = "hidden";
 div.innerHTML = "";
}
window.cancel = cancel;

function manage_users() {
 var div = document.getElementById("manage-users");
  div.style.visibility = "visible";
  div.innerHTML = "<div style='padding: 10px;'>" + 
  "<h1>Add a member</h1>" + 
  "<h4>Email</h4>" + 
  "<input type='text' id='email'></input>" + 
  '<button onclick="submit()">Submit</button>'+
  '<button onclick="cancel()">Cancel</button>'+
  '<div id="members-list"></div>'+
  '</div>';
   
}
window.manage_users = manage_users;

function send() {
  let message_id = Math.floor(Math.random()*9999999);
  let content = document.getElementById("messagebox").value;
  document.getElementById("messagebox").value = "";
  let date = new Date();
  set(ref(database, "/channel/" + channel_id + "/messages/" + message_id), {
    creator: uid,
    display_name: display_name,
    content: content,
    date: date;
  });
}
window.send = send;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log(user);
    uid = user.uid;
    display_name = user.displayName
    document.getElementById("username").innerHTML = user.displayName;
    var channel_ref = ref(database, "/channel/" + channel_id);
    onValue(channel_ref, (snapshot) => {
      let data = snapshot.val()
      document.getElementById("channel_name").innerHTML = data.name;
    }
    var message_ref = ref(database, "/channel/" + channel_id + "/messages/");
    onValue(message_ref, (snapshot) => {
      let data = snapshot.val()
      let message_box = document.getElementById("msg-contain");
      message_box.innerHTML = "";
      let msg_list = Object.keys(data);
      for(let n = 0; n < msg_list.length; n++) {
        let message = data[msg_list[n]]
        let box = document.createElement("div");
        box.setAttribute("class","message");
        let username_entry = document.createElement("h4");
        let textNode = document.createTextNode(message.display_name);
        username_entry.appendChild(textNode);
        box.appendChild(username_entry);
        let content = document.createElement("p");
        let textNode2 = document.createTextNode(message.content);
        content.appendChild(textNode2);
        box.appendChild(content);
        message_box.appendChild(box);
      }
    });
    // ...
  } else {
    window.location.href = "index.html";
    // ...
  }
});