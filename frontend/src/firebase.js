import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc,
  setDoc,
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Default configuration for SocialGuard Firebase project (social-guard-7b275)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBmB99FfsOqRUQMVfTIE-Xg-ZboIRa8AGg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "social-guard-7b275.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "social-guard-7b275",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "social-guard-7b275.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100623358480",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100623358480:web:e86e74e10d5173341e0895",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7KL8MN9H37",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://social-guard-7b275-default-rtdb.firebaseio.com"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const db = getFirestore(app);

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
};

export default app;
