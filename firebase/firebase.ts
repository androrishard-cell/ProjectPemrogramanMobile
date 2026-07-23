// firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// GANTI DENGAN CONFIG FIREBASE ANDA!
const firebaseConfig = {
  apiKey: "AIzaSyCiCAOicRoKIR7rGfp5aNI4vGOFRZQZd9c",
  authDomain: "laundryapptahapan3.firebaseapp.com",
  projectId: "laundryapptahapan3",
  storageBucket: "laundryapptahapan3.firebasestorage.app",
  messagingSenderId: "307835155229",
  appId: "1:307835155229:android:ae8c51f22c4c75aed727f4",
};

const app = initializeApp(firebaseConfig);

// Gunakan getAuth() saja (lebih sederhana)
const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
export default app;
