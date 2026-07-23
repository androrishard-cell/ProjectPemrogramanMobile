// types/index.ts
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: 'admin' | 'user';
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

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