// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Usa variables de entorno si están disponibles, sino usa valores por defecto
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAlQCzvqYRwaRcuJu1LelE2fAfak6dNjDA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cubic-9dfb1.firebaseapp.com",
  databaseURL: "https://cubic-9dfb1-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cubic-9dfb1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cubic-9dfb1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "678007643078",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:678007643078:web:3b4d11c097f35d7356f0c7",
  measurementId: "G-G5FQ8ZJ0MF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export Firebase services for use throughout the app
export { app, analytics, db, auth, storage };
export default app;

