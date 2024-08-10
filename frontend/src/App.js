// React imports
import React, {useState, useEffect} from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom'

//Firebase imports
import {initializeApp} from "firebase/app"
import { getAuth, onAuthStateChanged} from "firebase/auth"

// page imports
import Login from './pages/login/Login';
import Dashboard from './pages/home/Dashboard';

import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyC5oq9fyPeoo8jVU-N07gYhjt2kFEBGqA8",
  authDomain: "arc-by-insight.firebaseapp.com",
  projectId: "arc-by-insight",
  storageBucket: "arc-by-insight.appspot.com",
  messagingSenderId: "1073428960179",
  appId: "1:1073428960179:web:c61897786f1d2ba05131c6",
  measurementId: "G-47T814R2SK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [authState,setAuthState] = useState(false);
  const [userState,setUserState] = useState(null);
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if(user) {
        setUserState(user);
        setAuthState(true);
      }
      else {
        setAuthState(false);
        setUserState(null);
      }
    })
  },[userState])

  return authState ? (<Login />) : (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
export {app, auth}
