// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBL1Ag5PgRY0AO63yjUaSHKoWOwhR6gWQI",
  authDomain: "xmpo-halloween.firebaseapp.com",
  projectId: "xmpo-halloween",
  storageBucket: "xmpo-halloween.firebasestorage.app",
  messagingSenderId: "897945642711",
  appId: "1:897945642711:web:c5db13d22d696a437ab292"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const imageStorage = getStorage(app);