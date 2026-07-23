// services/firestoreService.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase'; 

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  createdAt: Date;
}

export interface Transaction {
  id?: string;
  userId: string;
  customerId: string;
  customerName: string;
  phone: string;
  service: string;
  weight: number;
  price: number;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Diambil';
  notes: string;
  date: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface ServiceType {
  id?: string;
  name: string;
  price: number;
  description: string;
  createdAt: Date;
}

// ==================== CUSTOMER SERVICES ====================

export const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customer,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...customer };
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

export const getCustomers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'));
    const customers: Customer[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        address: data.address || '',
        totalOrders: data.totalOrders || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return customers;
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

export const getCustomer = async (id: string) => {
  try {
    const docRef = doc(db, 'customers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        phone: data.phone,
        address: data.address || '',
        totalOrders: data.totalOrders || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Customer;
    }
    return null;
  } catch (error) {
    console.error('Error getting customer:', error);
    throw error;
  }
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  try {
    const docRef = doc(db, 'customers', id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'customers', id));
    return id;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

export const searchCustomers = async (keyword: string) => {
  try {
    const q = query(
      collection(db, 'customers'),
      where('name', '>=', keyword),
      where('name', '<=', keyword + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    const customers: Customer[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        address: data.address || '',
        totalOrders: data.totalOrders || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return customers;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

// ==================== TRANSACTION SERVICES ====================

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transaction,
      status: transaction.status || 'Menunggu',
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...transaction };
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId || '',
        customerId: data.customerId || '',
        customerName: data.customerName,
        phone: data.phone || '',
        service: data.service,
        weight: data.weight,
        price: data.price,
        status: data.status || 'Menunggu',
        notes: data.notes || '',
        date: data.date || new Date().toLocaleDateString('id-ID'),
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

export const getTransactionsByUser = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId || '',
        customerId: data.customerId || '',
        customerName: data.customerName,
        phone: data.phone || '',
        service: data.service,
        weight: data.weight,
        price: data.price,
        status: data.status || 'Menunggu',
        notes: data.notes || '',
        date: data.date || new Date().toLocaleDateString('id-ID'),
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
};

export const getTransaction = async (id: string) => {
  try {
    const docRef = doc(db, 'transactions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId || '',
        customerId: data.customerId || '',
        customerName: data.customerName,
        phone: data.phone || '',
        service: data.service,
        weight: data.weight,
        price: data.price,
        status: data.status || 'Menunggu',
        notes: data.notes || '',
        date: data.date || new Date().toLocaleDateString('id-ID'),
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Transaction;
    }
    return null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (id: string, data: Partial<Transaction>) => {
  try {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'transactions', id));
    return id;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const updateTransactionStatus = async (id: string, status: string) => {
  try {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, { status });
    return { id, status };
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

export const getTransactionsByStatus = async (status: string) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId || '',
        customerId: data.customerId || '',
        customerName: data.customerName,
        phone: data.phone || '',
        service: data.service,
        weight: data.weight,
        price: data.price,
        status: data.status || 'Menunggu',
        notes: data.notes || '',
        date: data.date || new Date().toLocaleDateString('id-ID'),
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error filtering transactions:', error);
    throw error;
  }
};

export const searchTransactions = async (keyword: string) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('customerName', '>=', keyword),
      where('customerName', '<=', keyword + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId || '',
        customerId: data.customerId || '',
        customerName: data.customerName,
        phone: data.phone || '',
        service: data.service,
        weight: data.weight,
        price: data.price,
        status: data.status || 'Menunggu',
        notes: data.notes || '',
        date: data.date || new Date().toLocaleDateString('id-ID'),
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error searching transactions:', error);
    throw error;
  }
};

// ==================== SERVICE TYPE SERVICES ====================

export const addServiceType = async (service: Omit<ServiceType, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      ...service,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...service };
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

export const getServiceTypes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'services'));
    const services: ServiceType[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        name: data.name,
        price: data.price,
        description: data.description || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

export const updateServiceType = async (id: string, data: Partial<ServiceType>) => {
  try {
    const docRef = doc(db, 'services', id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteServiceType = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'services', id));
    return id;
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = async () => {
  try {
    const [customers, transactions] = await Promise.all([
      getCustomers(),
      getTransactions(),
    ]);

    const today = new Date().toLocaleDateString('id-ID');
    const todayTransactions = transactions.filter((t) => t.date === today);
    const processedOrders = transactions.filter((t) => t.status === 'Diproses');
    const completedOrders = transactions.filter((t) => t.status === 'Selesai' || t.status === 'Diambil');

    return {
      totalCustomers: customers.length,
      todayTransactions: todayTransactions.length,
      processedOrders: processedOrders.length,
      completedOrders: completedOrders.length,
      recentTransactions: transactions.slice(0, 3),
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};