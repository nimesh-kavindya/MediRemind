import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8l8H2-dOQ5SjPm4wn931WtR8xrSnUgxU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mediremind-nimesh.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mediremind-nimesh",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mediremind-nimesh.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "150262018689",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:150262018689:web:41cac747dc0750912d9380",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-76T0D79R6K"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Enable offline persistence safely
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });
} catch (e) {
  console.warn('Firestore persistence initialization error:', e);
}

