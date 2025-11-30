// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlQCzvqYRwaRcuJu1LelE2fAfak6dNjDA",
  authDomain: "cubic-9dfb1.firebaseapp.com",
  databaseURL: "https://cubic-9dfb1-default-rtdb.firebaseio.com",
  projectId: "cubic-9dfb1",
  storageBucket: "cubic-9dfb1.firebasestorage.app",
  messagingSenderId: "678007643078",
  appId: "1:678007643078:web:3b4d11c097f35d7356f0c7",
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

