import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getDatabase, set, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
var uid;
var display_name;
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
function email_exists(e,data) {
  console.log(data);
  let user_list = Object.keys(data);
console.log(user_list);
  for(let n = 0; n < user_list.length; n++) {
console.log(user_list[n]);
   let user_email = data[user_list[n]].basic_info.email;
    console.log(user_email);
   console.log(e);
   if(user_email === e) {
     console.log("Match found!");
     return true;
   }
   else {
    continue;
   }
  }
return false;
}
function get_uid(e) {
 get(child(dbRef, "/users/")).then((snapshot) => {
  const data = snapshot.val();
  console.log(data);
  let user_list = Object.keys(data);
console.log(user_list);
  for(let n = 0; n < user_list.length; n++) {
console.log(user_list[n]);
   let user_email = data[user_list[n]].basic_info.email;
   let uid = user_list[n];
    console.log(user_email);
   console.log(e);
   if(user_email === e) {
     console.log("Match found!");
     return uid;
   }
   else {
    continue
   }
  }
return "DNE";
 });
}
window.logout = logout;
function submit() {
var members;
let added_email = document.getElementById("email").value;
var match;
get(child(dbRef, "/users/")).then((snapshot) => {
	let data = snapshot.val();
	match = email_exists(added_email,data);
});
console.log(match);
 if(match === true) {
 get(child(dbRef, "/channel/" + channel_id + "/members/")).then((snapshot) => {
   let data = snapshot.val();
   members = data.members;
   members.push(added_email);
   console.log(members);
   set(ref(database, "/channel/" + channel_id + "/members/"), {members: members});
   set(ref(database, "/users/" + get_uid(added_email) + "/channels/" + channel_id), {type: "member"});
   cancel();
   document.getElementById("success").innerHTML = "Successfully added " + added_email;

 });
}
 else {
  var div = document.getElementById("manage_users");
  let error = document.createElement("p");
  let error_text = document.createTextNode("The user " + added_email + " does not exist.");
  error.appendChild(error_text);
  error.style.color = "red";
  div.appendChild(error);
 }
}
window.submit = submit;

function cancel() {
 var div = document.getElementById("manage_users");
 div.style.visibility = "hidden";
 div.innerHTML = "";
}
window.cancel = cancel;

function manage_users() {
 var div = document.getElementById("manage_users");
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
  let message_id = Math.floor(1000000 + Math.random()*9999999);
  let content = document.getElementById("messagebox").value;
  document.getElementById("messagebox").value = "";
  let date = new Date();
  let msg_date = String(date.getFullYear()) + String(date.getMonth()+1) + String(date.getDate()) + String(date.getHours()) + String(date.getMinutes()) + String(date.getSeconds());
  set(ref(database, "/channel/" + channel_id + "/messages/" + msg_date + message_id), {
    creator: uid,
    display_name: display_name,
    content: content,
    date: date,
  });
}
window.send = send;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log(user);
    uid = user.uid;
    display_name = user.displayName;
    document.getElementById("username").innerHTML = user.displayName;
   get(child(dbRef, '/channel/' + channel_id + '/messages')).then((snapshot) => {
		return snapshot.val();
	}).catch((error) => {
		console.log(error);
     document.getElementById("main").innerHTML = "<h1>Error</h1><br><p>There was an error loading this channel.</p><a href='./dashboard.html'>Return to dashboard</a>";
	});
    var data_ref = ref(database, "/channel/" + channel_id + "/basic_data/");
    onValue(data_ref, (snapshot) => {
      let data = snapshot.val();
      console.log(document.getElementById("channel_name").innerHTML);
      document.getElementById("channel_name").innerHTML = data.name;
    });
    var message_ref = ref(database, "/channel/" + channel_id + "/messages/");
    onValue(message_ref, (snapshot) => {
      let data = snapshot.val();
      let message_box = document.getElementById("msg-contain");
      message_box.innerHTML = "";
      let msg_list = Object.keys(data);
      for(let n = 0; n < msg_list.length; n++) { // prerequsite for sorting
       Number(msg_list[n]);
      }
      msg_list.sort((a,b) => a-b);
      for(let n = 0; n < msg_list.length; n++) {
        let message = data[msg_list[n]];
        let date = new Date(message.date);
        let datetime = String(date.getMonth()+1) + String(date.getDate()) + String(date.getFullYear()) + " at " + String(date.getHours()) + ":" + String(date.getMinutes());
        let box = document.createElement("div");
        box.setAttribute("class","message");
        let username_entry = document.createElement("h4");
        let textNode = document.createTextNode(message.display_name);
        username_entry.appendChild(textNode);
        let datetime_entry = document.createElement("p");
        let dateNode = document.createTextNode(datetime);
        datetime_entry.appendChild(dateNode);
        box.appendChild(username_entry);
        let content = document.createElement("p");
        let textNode2 = document.createTextNode(message.content);
        content.appendChild(textNode2);
        box.appendChild(content);
        message_box.appendChild(box);
      }
     message_box.scrollTop = message_box.scrollHeight - message_box.clientHeight;
    });
    // ...
  } else {
    window.location.href = "index.html";
    // ...
  }
});
