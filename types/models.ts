export interface Order {
  id?: string;
  orderNumber?: string;
  orderDate: Date | string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  customerId: string;
  enterpriseId: string;
  items: OrderItem[];
  notes?: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  photo?: string;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  photo?: string;
  enterpriseId: string;
}

export interface Enterprise {
  id?: string;
  logo: null | string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  foundationDate: Date | string;
  address: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface DashboardMetrics {
  totalOrders: number;
  totalCustomers: number; 
  totalProducts: number;
  totalSales: number;
  pendingOrders: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
} 