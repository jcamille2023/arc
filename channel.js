import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getDatabase, set, ref, onValue, get, child, update, onChildAdded, remove} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging.js";
var uid;
var msg_date;
var new_user_uid;
var display_name;
var channel_name;
var button;
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
 get(child(dbRef, "/channel/" + channel_id + "/members/members")).then((snapshot) => {
   let data = snapshot.val();
if (data != null) {
   members = data.members;
   members.push(added_email);
   console.log(members);
   set(ref(database, "/channel/" + channel_id + "/members/members"), members);
   set(ref(database, "/users/" + new_user_uid + "/channels/" + channel_id), {name: channel_name});
   cancel();
   document.getElementById("success").innerHTML = "Successfully added " + added_email;
}
else {
	members = [];
   	members.push(added_email);
   	console.log(members);
   	set(ref(database, "/channel/" + channel_id + "/members/members"), members);
   	set(ref(database, "/users/" + new_user_uid + "/channels/" + channel_id), {name: channel_name});
   	cancel();
   	document.getElementById("success").innerHTML = "Successfully added " + added_email;
	
}
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
get(child(dbRef, "/channel/" + channel_id + "/members/members")).then((snapshot) => {
	let table = document.getElementById("members_list");
	let data = snapshot.val();
	console.log(data);
	if (data != null) {
	for(let n = 0; n < data.length; n++) {
			var row = table.insertRow(-1);
			var cell = row.insertCell(-1);
			var name = document.createElement("p");
			name.style.color = "white";
			var nameNode = document.createTextNode(data[n]);
			name.append(nameNode);
			cell.append(name);
			let delete_cell = row.insertCell(-1);
			let delete_button = document.createElement("button");
			let delete_icon = document.createElement("img");
			delete_icon.setAttribute("src","./assets/delete_icon.png");
			delete_icon.setAttribute("width","50px");
			delete_button.setAttribute("onclick","delete(" + data[n] + ")");
			delete_button.appendChild(delete_icon);
			delete_cell.appendChild(delete_button);
			let admin_cell = row.insertCell(-1);
			let set_admin = document.createElement("button");
			set_admin.setAttribute("onclick","admin()");
			let admin_btn_text = document.createTextNode("Make admin");
			set_admin.appendChild(admin_btn_text);
			admin_cell.appendChild(set_admin);
		
	}
	}
	else {
		var row = table.insertRow(-1);
		var cell = row.insertCell(-1);	
		var text = document.createTextNode("There are no non-admin members.");
		cell.appendChild(text);
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
      if (push_button) {
      	
      	push_button.remove();
      }
	getToken(messaging, {vapidKey: "BFN_4xdvMbKPLlLtMDMiD5gyRnO7dZVR-LQArRYxwuOn3dnZbF_XUbaw3g72p4-NsCyPE-xhYG8YpWHJ0r3goBk"}).then((currentToken) => {
	if(currentToken) {
		console.log(currentToken);
		set(ref(database, "/push/tokens/" + uid), {token: currentToken, channel: channel_id});
		if ('serviceWorker' in navigator) {
 		 navigator.serviceWorker.register('../firebase-messaging-sw.js').then((registration) => {console.log('Service Worker registered with scope:', registration.scope);}).catch((error) => 
			 {console.error('Service Worker registration failed:', error);});
		}
			}  
	else {
		console.log("no token");    
	}
    });
    }
                                        });
}
window.requestPermission = requestPermission; 

function enablePush() {
	let description = "What is Arc Push?\n"+
		"Arc Push is a service that allows Arc to send push notifications whenever messages are sent in a channel.\n"+
		"Arc Push must be enabled by you (the channel owner) in order for other users to send notifications. "+
		"You do not have to receive notifications yourself because you are not required to confirm notifications when Arc Push"+
		" is enabled.\n"+
		"Press OK to enable Arc Push or press Cancel to revert the process.";
	let enabled = confirm(description);
	if (enabled) {
		get(child(dbRef, "/channel/" + channel_id + "/push")).then((snapshot) => {
			let data = snapshot.val();
			if (data != null) {
				data.push(uid);
				set(ref(database, "/push/channels/" + channel_id), {channel_id: channel_id, push: true});
				set(ref(database, "/channel/" + channel_id + "/push/"), data);
				requestPermission();
			}
			else {
				let data = [uid];
				set(ref(database, "/channel/" + channel_id + "/push/"), data);
				
			}
		});
	} 
}
window.enablePush = enablePush;


function get_date() {
	msg_date = new Date(); 
  console.log(msg_date); 
	let month = msg_date.getMonth();
	if(month < 10) {
		String(month);
		month = "0" + month;
	}
	else {
		String(month);
	}
	let day = msg_date.getDate();
	if(day < 10) {
		String(day);
		day = "0" + day;
	}
	else {
		String(day);
	}
	let hours = msg_date.getHours();
	if(hours < 10) {
		String(hours);
		hours = "0" + hours;
	}
	else {
		String(hours);
	}
	let minutes = msg_date.getMinutes();
	if(minutes < 10) {
		String(minutes);
		minutes = "0" + minutes;
	}
	else {
		String(minutes);
	}
	let seconds = msg_date.getSeconds();
	if(seconds < 10) {
		String(seconds);
		seconds = "0" + seconds;
	}
	else {
		String(seconds);
	}
  	return String(msg_date.getFullYear()) + month + day + hours + minutes + seconds;
}

function upload() {
	let file = document.getElementById("file").files;
	for(let n = 0; n < file.length; n++) {
		let date_for_data = new Date();
		date_for_data = String(date_for_data);
		let path = "users/" + uid + "/" + file[n].name;
		upload_image(path,file[n]);
		let message_data = {
			type: "image",
			content: path,
			date: date_for_data,
			creator: uid,
			channel_name: channel_name,
			displayName: display_name,
			channel_id: channel_id,
		};
		let message_date = get_date();
		console.log(get_date());
		let message_id = Math.floor(Math.random()*1000000);
		message_id = message_id + 1000000;
		set(ref(database, "/channel/" + channel_id + "/messages/" + message_date + message_id), message_data);
		
	}
}
window.upload = upload;

function start_upload() {
	let div = document.getElementById("upload");
	button = div.children[0];
	let input = document.createElement("input");
	input.setAttribute("type","file");
	input.setAttribute("accept","image/*");
	input.setAttribute("id","file");
	button.remove();
	div.appendChild(input);
	let submit_button = document.createElement("button");
	submit_button.setAttribute("onclick","upload()");
	let submit_button_text = document.createTextNode("Submit");
	submit_button.appendChild(submit_button_text);
	div.appendChild(submit_button);
}
window.start_upload = start_upload;
function send() {
  get(child(dbRef, "/push/channels/" + channel_id)).then((snapshot) => {
  	let message_id = Math.floor(Math.random()*1000000);
  	message_id = message_id + 1000000;
  	let content = document.getElementById("messagebox").value;
  	document.getElementById("messagebox").value = "";
  	msg_date = new Date(); 
  	console.log(msg_date); 
  	let msg_date_2 = String(msg_date);
  	let send_date = get_date();
  	let data = {
	  channel_name: channel_name,
	  creator: uid,
	  displayName: display_name,
	  content: content,
	  date: msg_date_2,
	  channel_id: channel_id,
  	};
  set(ref(database, "/channel/" + channel_id + "/messages/" + send_date + message_id), data);
	  if(snapshot.val()) {
		  set(ref(database, "/push/messages/" + send_date + message_id),data);
	  }
  });
}
window.send = send;

var running_listener = false;
var interval;
var run_time = 0;
function typing_check() {
	if(run_time = 0) {
		console.log("Run time check passed");
		run_time += 1;
	}
	else {
		let typing_ref = ref(database, "/channel/" + channel_id + "/typing/" + uid);
		remove(typing_ref);
		console.log("Typing check killed");
		running_listener = false;
		clearInterval(interval);
	}
}
function type_event() {
	if (running_listener == false) {
			console.log("Starting listener");
			let updates = {};
			let data = {typing: true}
			updates['/channel/' + channel_id + "/typing/" + uid] = data;
			update(dbRef, updates);
			running_listener = true;
	}
	else {
		run_time = 0;
		clearInterval(interval);
		interval = setInterval(typing_check,2000);
		console.log("Interval set");
	}
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log(user);
    uid = user.uid;
    display_name = user.displayName;
    document.getElementById("username").innerHTML = user.displayName;
   get(child(dbRef, '/channel/' + channel_id + '/messages')).then((snapshot) => {
      let data =  snapshot.val();
	if (data != null) {
       		console.log(data);
		let input = document.getElementById("messagebox");
		input.addEventListener("keydown",type_event);
	}
	   else {
		let message_box = document.getElementById("msg-contain");
		message_box.innerHTML = "<p>This is the start of this channel!</p>";
	   }
	}).catch((error) => {
		console.log(error);
     document.getElementById("main").innerHTML = "<h1>Error</h1><br><p>There was an error loading this channel.</p><a href='./dashboard.html'>Return to dashboard</a>";
	});
    get(child(dbRef, '/channel/' + channel_id + '/members/admin')).then((snapshot) => { // Reference to Arc Push
	    let data = snapshot.val();
	    console.log(data);
	    let push_button = document.getElementById("arc-push");
	    let manage_button = document.getElementById("manage_button");
	    if (Object.values(data).includes(user.email)) {
		    push_button.setAttribute("onclick", "enablePush()");
	    } 
	    else {
		push_button.style.visibility = "hidden";
		manage_button.style.visibility = "hidden";
	    }
	    
    });
    var data_ref = ref(database, "/channel/" + channel_id + "/basic_data/");
    onValue(data_ref, (snapshot) => {
      let data = snapshot.val();
      document.getElementById("channel_name").innerHTML = data.name;
      document.getElementById("title").innerHTML = data.name;
      channel_name = data.name;
    });
    var message_ref = ref(database, "/channel/" + channel_id + "/messages/");
    onChildAdded(message_ref, (snapshot) => {
      let message = snapshot.val();
      let message_box = document.getElementById("msg-contain");
      get(child(dbRef, "/users/" + message.creator + "/basic_info")).then((snapshot2) => {
	let user_data = snapshot2.val();
        let date = new Date(message.date);
        let datetime = " | on " + String(date.getMonth()+1) + "/" + String(date.getDate()) + "/" + String(date.getFullYear()) + " at " + String(date.getHours()) + ":" + String(date.getMinutes());
        let box = document.createElement("div");
        box.setAttribute("class","message");
        let username_entry = document.createElement("h4");
        let textNode = document.createTextNode(user_data.displayName + datetime);
        username_entry.appendChild(textNode);
        box.appendChild(username_entry);
	if (message.type == null) {
        	let content = document.createElement("p");
        	let textNode2 = document.createTextNode(message.content);
        	content.appendChild(textNode2);
        	box.appendChild(content);
		message_box.appendChild(box);
		message_box.scrollTop = message_box.scrollHeight - message_box.clientHeight;
	}
	else {
		let path = message.content;
		download_image(box, message_box, path);
	}
    });
    });


	var chat_type_ref = ref(database, "/channel/" + channel_id + "/typing/");
	onChildAdded(chat_type_ref, (snapshot) => {
		let data = snapshot.val();
		data = Object.keys(data);
		if(data.length = 1) {
			console.log(data[0] + " is typing...");
		}
		else {
			let people_typing_msg;
			for(let n = 0; n < data.length; n++) {
				people_typing_msg += data[n] + ", ";
			}
			people_typing_msg += " are typing..."
		}
	});
	var push_ref = ref(database, "/push/channels/" + channel_id);
	onValue(push_ref, (snapshot) => {
		let data = snapshot.val();
		if (data != null) {
			get(child(dbRef, "/channel/" + channel_id + "/push")).then((snapshot) => {
				let button = document.getElementById("arc-push");
				let data2 = snapshot.val();
				console.log(data2);
				if (data2 != null && !(uid in Object.values(data2)) && data2[0] != uid) {
						button.style.visibility = "visible";
						button.innerHTML = "Enable notifications";
					}
			});
		}
	});
	    
    // ...
  } else {
    window.location.href = "index.html";
    // ...
  }
});
