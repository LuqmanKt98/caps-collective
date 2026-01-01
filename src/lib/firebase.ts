import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCj-kx4uaSzrsCeZOZ9FgBFwp0NR3VrtFg",
  authDomain: "caps-collective.firebaseapp.com",
  projectId: "caps-collective",
  storageBucket: "caps-collective.firebasestorage.app",
  messagingSenderId: "902162973860",
  appId: "1:902162973860:web:371a4234127d77e8e65231",
  measurementId: "G-C7Q2PBK1EW"
};

// Initialize Firebase only if no apps exist
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

