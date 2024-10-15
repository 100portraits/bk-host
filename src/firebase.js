// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Conditionally import getAnalytics
let getAnalytics;
if (typeof window !== 'undefined') {
  getAnalytics = (await import('firebase/analytics')).getAnalytics;
}

// Your web app's Firebase configuration
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
const db = getFirestore(app);
const auth = getAuth(app);

// Conditionally initialize analytics
let analytics;
if (typeof window !== 'undefined' && getAnalytics) {
  analytics = getAnalytics(app);
}

export { app, db, auth, analytics };
