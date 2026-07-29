import { initializeApp } from "firebase/app";
import { getFirestore, disableNetwork, enableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi2tHfpYnqSWqpI9wSQnAGJhCtQGp3E14",
  authDomain: "donafacilapp.firebaseapp.com",
  projectId: "donafacilapp",
  storageBucket: "donafacilapp.firebasestorage.app",
  messagingSenderId: "617166038823",
  appId: "1:617166038823:web:ddadd9ce9280d26b6eab02",
  measurementId: "G-NGL9W3C64R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
