export interface Order {
  id?: string;
  orderNumber?: string;
  orderDate: Date | string;
  status: 'pending' | 'completed' | 'cancelled';
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
  logo?: string | null;
  legalName: string;
  tradeName: string;
  cnpj: string;
  foundationDate: Date | string;
  address: string;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

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

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateCPF = (cpf: string): ValidationResult => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) {
    return { isValid: false, message: 'CPF deve ter 11 dígitos' };
  }

  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, message: 'CPF inválido' };
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;

  if (digit1 === parseInt(cleaned.charAt(9)) && digit2 === parseInt(cleaned.charAt(10))) {
    return { isValid: true };
  }

  return { isValid: false, message: 'CPF inválido' };
};

export const validateCNPJ = (cnpj: string): ValidationResult => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) {
    return { isValid: false, message: 'CNPJ deve ter 14 dígitos' };
  }

  if (/^(\d)\1{13}$/.test(cleaned)) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (digit1 === parseInt(cleaned.charAt(12)) && digit2 === parseInt(cleaned.charAt(13))) {
    return { isValid: true };
  }

  return { isValid: false, message: 'CNPJ inválido' };
};

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    return { isValid: false, message: 'E-mail é obrigatório' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'E-mail inválido' };
  }
  
  return { isValid: true };
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PED-${timestamp.slice(-8)}-${random}`;
};

export const formatPrice = (price: number): number => {
  return Math.round(price * 100) / 100;
}; 