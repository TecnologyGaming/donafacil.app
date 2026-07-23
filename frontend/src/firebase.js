import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Read from env with fallback to provided credentials
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCi2tHfpYnqSWqpI9wSQnAGJhCtQGp3E14",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "donafacilapp.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "donafacilapp",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "donafacilapp.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "617166038823",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:617166038823:web:ddadd9ce9280d26b6eab02",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-NGL9W3C64R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
