import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// TODO: PASTE YOUR FIREBASE CONFIGURATION HERE
// 1. Go to console.firebase.google.com
// 2. Create a project
// 3. Register a Web App
// 4. Copy the config object below
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBDU3-B7J8Is0Q9ViONFNo4xfAFvnuUX1g",
  authDomain: "lms-lite-67c30.firebaseapp.com",
  projectId: "lms-lite-67c30",
  storageBucket: "lms-lite-67c30.firebasestorage.app",
  messagingSenderId: "462079436012",
  appId: "1:462079436012:web:3c5284c1177b085d36b1c9",
  measurementId: "G-CDNE96CNHB"
};

let db: Firestore | null = null;

// Check if config has keys (is populated)
const isConfigured = Object.keys(firebaseConfig).length > 0;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration not found. App will use LocalStorage. Check firebase.ts to configure.");
}

export { db };