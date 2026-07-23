import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  role?: 'admin' | 'user';
}

const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

const mapFirebaseError = (errorCode: string): string => {
  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'Email sudah digunakan. Silakan gunakan email lain.',
    'auth/invalid-email': 'Format email tidak valid. Contoh: nama@domain.com',
    'auth/weak-password': 'Password terlalu lemah. Minimal 6 karakter.',
    'auth/operation-not-allowed': 'Login dengan email/password belum diaktifkan di Firebase Console.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/user-not-found': 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.',
    'auth/wrong-password': 'Password salah. Silakan coba lagi.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/network-request-failed': 'Koneksi internet bermasalah. Periksa koneksi Anda.',
    'auth/user-disabled': 'Akun Anda telah dinonaktifkan. Hubungi admin.'
  };
  return errorMap[errorCode] || 'Terjadi kesalahan. Silakan coba lagi.';
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'user' = 'user'
) => {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Format email tidak valid.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter.' };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: name.trim(),
      email: email.trim(),
      role: role,
      createdAt: new Date(),
    });

    return { 
      success: true, 
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: name.trim(),
        role: role
      }
    };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Format email tidak valid.' };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    let role: 'admin' | 'user' = 'user';
    if (userDoc.exists()) {
      role = userDoc.data().role || 'user';
    }

    return { 
      success: true, 
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        role: role
      }
    };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
};

export const resetPassword = async (email: string) => {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Format email tidak valid.' };
    }
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
};

export const getCurrentUser = (): UserProfile | null => {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    role: 'user'
  };
};

export const isAdmin = (user: UserProfile | null): boolean => {
  return user?.role === 'admin';
};