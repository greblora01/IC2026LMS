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
  // apiKey: "AIzaSy...",
  // authDomain: "your-app.firebaseapp.com",
  // projectId: "your-app",
  // storageBucket: "your-app.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "1:123456789:web:abc123456"
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