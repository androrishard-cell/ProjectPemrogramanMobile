// services/authService.ts
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';  // ← IMPORT DARI firebase/firebase.ts

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user';
  photoURL?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============ REGISTER ============
export const registerUser = async (name: string, email: string, password: string, role: 'admin' | 'user' = 'user') => {
  try {
    console.log('📝 Registering:', { name, email, role });
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User created in Auth:', user.uid);

    await updateProfile(user, { displayName: name });

    const userProfile: UserProfile = {
      uid: user.uid,
      name: name,
      email: email,
      phone: '',
      address: '',
      role: role,
      photoURL: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('✅ Profile saved to Firestore with ID:', user.uid);

    return { success: true, user: userProfile };
  } catch (error: any) {
    console.log('❌ Register error:', error.code, error.message);
    
    let message = 'Pendaftaran gagal';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Email sudah digunakan';
        break;
      case 'auth/invalid-email':
        message = 'Email tidak valid';
        break;
      case 'auth/weak-password':
        message = 'Password terlalu lemah. Minimal 6 karakter';
        break;
      case 'auth/operation-not-allowed':
        message = 'Email/Password belum diaktifkan di Firebase Console';
        break;
      case 'auth/network-request-failed':
        message = 'Koneksi internet bermasalah. Cek koneksi Anda';
        break;
      default:
        message = 'Terjadi kesalahan. Silakan coba lagi';
    }
    return { success: false, error: message };
  }
};

// ============ LOGIN ============
export const loginUser = async (email: string, password: string) => {
  try {
    console.log('📝 Logging in:', { email });
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User logged in:', user.uid);

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      return { success: true, user: userData };
    } else {
      // User ada di Auth tapi belum ada di Firestore → buat otomatis
      console.log('⚠️ Profil Firestore belum ada, membuat otomatis...');
      const newProfile: UserProfile = {
        uid: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email || email,
        phone: '',
        address: '',
        role: 'user',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      console.log('✅ Profil Firestore berhasil dibuat untuk:', user.uid);
      return { success: true, user: newProfile };
    }
  } catch (error: any) {
    console.log('❌ Login error:', error.code, error.message);
    
    let message = 'Login gagal';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Email tidak terdaftar';
        break;
      case 'auth/wrong-password':
        message = 'Password salah';
        break;
      case 'auth/invalid-email':
        message = 'Email tidak valid';
        break;
      case 'auth/invalid-credential':
        message = 'Email atau password salah';
        break;
      case 'auth/too-many-requests':
        message = 'Terlalu banyak percobaan. Coba lagi nanti';
        break;
      case 'auth/user-disabled':
        message = 'Akun Anda telah dinonaktifkan';
        break;
      case 'auth/network-request-failed':
        message = 'Koneksi internet bermasalah. Cek koneksi Anda';
        break;
      default:
        message = `Terjadi kesalahan: ${error.message}`;
    }
    return { success: false, error: message };
  }
};

// ============ LOGOUT ============
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal keluar' };
  }
};

// ============ GET CURRENT USER ============
export const getCurrentUser = (): Promise<UserProfile | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe();
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          resolve(userDoc.data() as UserProfile);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

// ============ CHECK ADMIN ============
export const isAdmin = (user: UserProfile | null): boolean => {
  return user?.role === 'admin';
};