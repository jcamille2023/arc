import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getDatabase, set, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging.js";
var uid;
var msg_date;
var new_user_uid;
var display_name;
var channel_name;
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./firebase-messaging-sw.js', { type: 'module' })
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const auth = getAuth(app);
  const dbRef = ref(getDatabase());
  const messaging = getMessaging(app);

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
     new_user_uid = user_list[n];
     console.log("Match found!");
     return true;
   }
   else {
    continue;
   }
  }
return false;
}
window.logout = logout;
function submit() {
var members;
let added_email = document.getElementById("email").value;
var match;
get(child(dbRef, "/users/")).then((snapshot) => {
	let data = snapshot.val();
	match = email_exists(added_email,data);
	console.log(match);
	if(match === true) {
 get(child(dbRef, "/channel/" + channel_id + "/members/")).then((snapshot) => {
   let data = snapshot.val();
   members = data.members;
   members.push(added_email);
   console.log(members);
   set(ref(database, "/channel/" + channel_id + "/members/"), {members: members});
   set(ref(database, "/users/" + new_user_uid + "/channels/" + channel_id), {name: channel_name});
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
});

 
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
  '<div><h1>Members</h1>'+
'<table id="members_list"><tbody></tbody></table></div>'+
  '</div>';
get(child(dbRef, "/channel/" + channel_id + "/members/")).then((snapshot) => {
	let table = document.getElementById("members_list");
	let data = snapshot.val();
	let members_list = Object.values(data);
	for(let n = 0; n < members_list.length; n++) {
		var row = table.insertRow(-1);
		// let pfp_cell = row.insertCell(-1);
		var cell = row.insertCell(-1);
		var name = document.createElement("p");
		var nameNode = document.createTextNode(members_list[n]);
		name.append(nameNode);
		cell.append(name);
		let delete_cell = row.insertCell(-1);
		let delete_button = document.createElement("button");
		let delete_icon = document.createElement("img");
		delete_icon.setAttribute("src","./assets/delete_icon.jpg");
		delete_button.setAttribute("onclick","delete(" + members_list[n] + ")");
		delete_button.appendChild(delete_icon);
		delete_cell.appendChild(delete_button);
	}
});
}
window.manage_users = manage_users;

function requestPermission() {
  console.log('Requesting permission...');
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      let push_button = document.getElementById("arc-push");
      push_button.remove();
	getToken(messaging, {vapidKey: "BFN_4xdvMbKPLlLtMDMiD5gyRnO7dZVR-LQArRYxwuOn3dnZbF_XUbaw3g72p4-NsCyPE-xhYG8YpWHJ0r3goBk"}).then((currentToken) => {
	if(currentToken) {
		console.log(currentToken);
		get(child(dbRef, "/channel/" + channel_id + "/push")).then((snapshot) => {
			let data = snapshot.val();
			if(data != null) {
				data[uid] = currentToken;
				console.log(data);
				set(ref(database, "/channel/" + channel_id + "/push"), data);
			}
		});
	}    
	else {
		console.log("no token");    
	}
    });
    }
                                        });
}
window.requestPermission = requestPermission;
	  

function send() {
  let message_id = Math.floor(Math.random()*1000000);
  message_id = message_id + 1000000;
  let content = document.getElementById("messagebox").value;
  document.getElementById("messagebox").value = "";
  msg_date = new Date(); 
  console.log(msg_date); 
  let msg_date_2 = String(msg_date);
  let send_date = String(msg_date.getFullYear()) + String(msg_date.getMonth()+1) + String(msg_date.getDate()) + String(msg_date.getHours()) + String(msg_date.getMinutes()) + String(msg_date.getSeconds());
  let data = {
	  creator: uid,
	  content: content,
	  date: msg_date_2,
  };
  set(ref(database, "/channel/" + channel_id + "/messages/" + send_date + message_id), data);
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
      channel_name = data.name;
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
	get(child(dbRef, "/users/" + message.creator + "/basic_info")).then((snapshot2) => {
	console.log(message.creator);
	let user_data = snapshot2.val();
        let date = new Date(message.date);
        let datetime = " | on " + String(date.getMonth()+1) + "/" + String(date.getDate()) + "/" + String(date.getFullYear()) + " at " + String(date.getHours()) + ":" + String(date.getMinutes());
        let box = document.createElement("div");
        box.setAttribute("class","message");
        let username_entry = document.createElement("h4");
        let textNode = document.createTextNode(user_data.displayName + datetime);
        username_entry.appendChild(textNode);
        box.appendChild(username_entry);
        let content = document.createElement("p");
        let textNode2 = document.createTextNode(message.content);
        content.appendChild(textNode2);
        box.appendChild(content);
        message_box.appendChild(box);
	});
      }
	
     message_box.scrollTop = message_box.scrollHeight - message_box.clientHeight;
    });
	    
    // ...
  } else {
    window.location.href = "index.html";
    // ...
  }
});
