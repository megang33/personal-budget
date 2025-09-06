// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCqiWx4pCdr0GO-GFyQTZFSGN8nJDF8YN8",
    authDomain: "personal-budget-e29a2.firebaseapp.com",
    projectId: "personal-budget-e29a2",
    storageBucket: "personal-budget-e29a2.firebasestorage.app",
    messagingSenderId: "50926539904",
    appId: "1:50926539904:web:f2fb6df9f0c3303322c265"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);