import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getDatabase, set, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
var uid;
var dune;
var first_row_created = false;
var row_filled = false;

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
  const database = getDatabase(app);
  const auth = getAuth(app);

function display_new_events(data) {
 console.log(data);
 if (Object.keys(data).length !== 0) {
  var time_section = document.getElementById("time-section");
  var event_table = document.getElementById("event-table");
  
  var event_div = document.createElement("div");
  event_div.style.background = 'url("https://cdn1.vectorstock.com/i/1000x1000/55/00/yellow-sticky-note-with-drawing-pin-vector-7575500.jpg")';
  console.log(event_div);
  var event_title = document.createElement("h3");
  var event_times = document.createElement("p");

  
  var time_text = "From " + data.start_datetime + " to " + data.end_datetime;
  event_times.appendChild(document.createTextNode("Dates:"));
  event_times.appendChild(document.createTextNode(time_text));
    
  var title_text = document.createTextNode(data.name);
  event_title.appendChild(title_text);
  event_div.appendChild(event_title);
  event_div.appendChild(event_times);
  console.log(event_div);
  
  if (row_filled == true || first_row_created == false) {
   let row = event_table.insertRow(-1);
   let cell = row.insertCell(-1);
   cell.appendChild(event_div);
   first_row_created == true;
  }
  else {
   let lastRow = event_table.rows[event_table.rows.length - 1];
   let cell = row.insertCell(-1);
   cell.appendChild(event_div);
   row_filled = true;
  }
  
//  time_section.appendChild(event_div);
 }
 
}

function logout() {
  signOut(auth).then(() => {
  console.log("User is signed out.");
  window.location.href = "login.html";
  }).catch((error) => {
  // An error happened.
  });
}
window.logout = logout;

function add_times_to_schedule() {
  var div = document.getElementById("add-events");
  div.setAttribute("style","visiblity: visible;");
  div.innerHTML = "<div id='add-events-2'>" + 
  "<h1>Add an event</h1>" + 
  "<h4>Name</h4>" + 
  "<input type='text' id='name'></input>" + 
  "<p>Times</p>" + 
  '<table style="color: white;">' +
  '<tbody><tr><td>'+
  '<p>Start time/day</p>'+
  '<input type="datetime-local" id="start_time"></td>'+
  '<td><p>End time/day</p>'+
  '<input type="datetime-local" id="end_time">'+
  '</td></tr></tbody></table>'+
  '<button class="new_event_buttons" onclick="submit_new_events()">Submit</button>'+
  '<button onclick="cancel_new_events()" class="new_event_buttons">Cancel</button>'+
  '</div>';
   
}
window.add_times_to_schedule = add_times_to_schedule;

function submit_new_events() {
 var event_number = Math.floor(Math.random()*99999);
 var name = document.getElementById('name').value;
 var start_datetime = document.getElementById("start_time").value;
 var end_datetime = document.getElementById("end_time").value;
 var event = {
  name: name,
  event_number: event_number,
  start_datetime: start_datetime,
  end_datetime: end_datetime,
  
 };
 
 const db = getDatabase();
 set(ref(db, 'users/' + uid + "/" + event_number), event).then(console.log("Event successfully added"));
 var div = document.getElementById("add-events");
 div.innerHTML = "";
 div.setAttribute("style","visiblity: hidden;");
 
}
window.submit_new_events = submit_new_events;

function cancel_new_events() {
 console.log("New event cancelled");
 var div = document.getElementById("add-events");
 div.innerHTML = "";
 div.setAttribute("style","visiblity: hidden;");
}
window.cancel_new_events = cancel_new_events;
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log(user);
    uid = user.uid;
    document.getElementById("username").innerHTML = user.displayName;
    document.getElementById("user-greeting").innerHTML = "Hi, " + user.displayName + "!";
    const eventRef = ref(database, 'users/' + uid);
    onValue(eventRef, (snapshot) => {
     var data = snapshot.val();
     console.log(data);
     if(data !== null && data !== dune) {
      var event_table = document.getElementById("event-table");
      while (event_table.hasChildNodes()) {
       event_table.removeChild(event_table.firstChild);
       }
      for(let n = 0; n < Object.keys(data).length; n++) {
       var list_of_items = Object.keys(data);
       display_new_events(data[list_of_items[n]]);
      }
     }
     
     });

    
    
    // ...
  } else {
    window.location.href = "index.html";
    // ...
  }
});
