// firebase/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ============ GANTI DENGAN CONFIG ANDA ============
const firebaseConfig = {
  apiKey: "AIzaSyCkQ6UWO6jwL78qvoH7Rk7P6TY5YrVQHtw",
  authDomain: "laundryapptahapan3.firebaseapp.com",
  databaseURL: "https://laundryapptahapan3-default-rtdb.firebaseio.com",
  projectId: "laundryapptahapan3",
  storageBucket: "laundryapptahapan3.firebasestorage.app",
  messagingSenderId: "307835155229",
  appId: "1:307835155229:web:8f980a26a8fbf83dd727f4",
  measurementId: "G-SLXY8LNVPX"
};
// =====================================================

const app = initializeApp(firebaseConfig);

// Firestore: pakai long polling + database ID yang sesuai
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, 'laundry-app-12345');

// Auth: pakai AsyncStorage agar sesi login tersimpan
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default app;