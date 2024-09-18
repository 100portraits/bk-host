// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6MJHrgOkb7_6wRuERYD-CyQ_6HA1emOY",
  authDomain: "bk-digitalisation.firebaseapp.com",
  projectId: "bk-digitalisation",
  storageBucket: "bk-digitalisation.appspot.com",
  messagingSenderId: "871735118074",
  appId: "1:871735118074:web:18f3f57b197352db902143",
  measurementId: "G-Z9KKW54K7V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };

