// Import the functions you need from the SDKs you need
import { initializeApp , getApp , getApps} from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCymAZ6w9MCvfk1AnObaRiMOcsG6-GVeNk",
  authDomain: "prepwise-d27d0.firebaseapp.com",
  projectId: "prepwise-d27d0",
  storageBucket: "prepwise-d27d0.firebasestorage.app",
  messagingSenderId: "243180791978",
  appId: "1:243180791978:web:9a5b80aff6e839d28948d3",
  measurementId: "G-P0N18XRD1M"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig): getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
