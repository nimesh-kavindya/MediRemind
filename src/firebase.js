import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB8l8H2-dOQ5SjPm4wn931WtR8xrSnUgxU",
  authDomain: "mediremind-nimesh.firebaseapp.com",
  databaseURL: "https://mediremind-nimesh-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mediremind-nimesh",
  storageBucket: "mediremind-nimesh.firebasestorage.app",
  messagingSenderId: "150262018689",
  appId: "1:150262018689:web:41cac747dc0750912d9380",
  measurementId: "G-76T0D79R6K"
};

// Prevent duplicate app initialization on hot-reload or multiple imports
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
