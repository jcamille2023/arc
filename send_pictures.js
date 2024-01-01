import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-storage.js";

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
  const storage = getStorage(app);


function upload_image(path,file) {
  const storageRef = ref(storage, path);
  uploadBytes(storageRef, file).then((snapshot) => {
    // console.log(snapshot.val());
    console.log("Submission sucessfull!");
  });
}

window.upload_image = upload_image;

async function download_image(element, path) {
  const pathReference = ref(storage, path);
  await getDownloadURL(pathReference).then((url) => {
    let img = document.createElement("img");
    img.setAttribute("src", url);
    element.appendChild(img);
  });
  
}
window.download_image = download_image;
