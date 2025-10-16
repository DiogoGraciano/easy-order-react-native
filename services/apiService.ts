import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer, Enterprise, Order, Product } from '../types/models';

const API_BASE_URL = 'http://192.168.0.108:3000';

interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Auth interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  address?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

class ApiService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const fullUrl = `${API_BASE_URL}${url}`;
    
    // Obter token do AsyncStorage
    const token = await AsyncStorage.getItem('auth_token');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}`;
        
        try {
          const errorData: ApiError = await response.json();
          
          if (errorData.message) {
            if (Array.isArray(errorData.message)) {
              errorMessage = errorData.message.join('\n');
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch (parseError) {
          switch (response.status) {
            case 400:
              errorMessage = 'Dados inválidos enviados para o servidor';
              break;
            case 401:
              errorMessage = 'Credenciais inválidas';
              break;
            case 403:
              errorMessage = 'Acesso negado';
              break;
            case 404:
              errorMessage = 'Recurso não encontrado';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor';
              break;
            case 503:
              errorMessage = 'Serviço indisponível';
              break;
            default:
              errorMessage = `Erro HTTP ${response.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Para métodos DELETE, pode não haver conteúdo na resposta
      if (options?.method === 'DELETE') {
        return null as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: Servidor não respondeu a tempo');
        }
        if (error.message.includes('fetch') || error.message.includes('Network')) {
          throw new Error('Erro de conexão: Verifique se o servidor está rodando e se a URL está correta');
        }
      }
      
      throw error;
    }
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }

  async getOrderById(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.request<Order[]>(`/orders?customerId=${customerId}`);
  }

  async getOrdersByEnterprise(enterpriseId: string): Promise<Order[]> {
    return this.request<Order[]>(`/orders?enterpriseId=${enterpriseId}`);
  }

  async saveOrder(order: Order): Promise<Order> {
    if (order.id) {
      return this.updateOrder(order);
    }
    return this.createOrder(order);
  }

  private async createOrder(order: Order): Promise<Order> {
    const { id, ...orderData } = order;
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  private async updateOrder(order: Order): Promise<Order> {
    const { id, ...orderData } = order;
    return this.request<Order>(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(order: Order): Promise<void> {
    return this.request<void>(`/orders/${order.id}`, {
      method: 'DELETE',
    });
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/customers');
  }

  async getCustomerById(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async saveCustomer(customer: Customer): Promise<Customer> {
    if (customer.id) {
      const { id, ...customerData } = customer;
      return this.request<Customer>(`/customers/${customer.id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData),
      });
    }
    const { id, ...customerData } = customer;
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer(customer: Customer): Promise<void> {
    return this.request<void>(`/customers/${customer.id}`, {
      method: 'DELETE',
    });
  }

  // Product methods
  async getProducts(enterpriseId?: string): Promise<Product[]> {
    const url = enterpriseId ? `/products?enterpriseId=${enterpriseId}` : '/products';
    return this.request<Product[]>(url);
  }

  async getProductById(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async saveProduct(product: Product): Promise<Product> {
    if (product.id) {
      const { id, ...productData } = product;
      return this.request<Product>(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    }
    const { id, ...productData } = product;
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(product: Product): Promise<void> {
    return this.request<void>(`/products/${product.id}`, {
      method: 'DELETE',
    });
  }

  async updateProductStock(productId: string, quantity: number): Promise<Product> {
    return this.request<Product>(`/products/${productId}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  // Enterprise methods
  async getEnterprises(): Promise<Enterprise[]> {
    return this.request<Enterprise[]>('/enterprises');
  }

  async getEnterpriseById(id: string): Promise<Enterprise> {
    return this.request<Enterprise>(`/enterprises/${id}`);
  }

  async saveEnterprise(enterprise: Enterprise): Promise<Enterprise> {
    if (enterprise.id) {
      const { id, ...enterpriseData } = enterprise;
      return this.request<Enterprise>(`/enterprises/${enterprise.id}`, {
        method: 'PUT',
        body: JSON.stringify(enterpriseData),
      });
    }
    const { id, ...enterpriseData } = enterprise;
    return this.request<Enterprise>('/enterprises', {
      method: 'POST',
      body: JSON.stringify(enterpriseData),
    });
  }

  async deleteEnterprise(enterprise: Enterprise): Promise<void> {
    return this.request<void>(`/enterprises/${enterprise.id}`, {
      method: 'DELETE',
    });
  }

  // Upload methods
  async uploadCustomerPhoto(customerId: string, photo: File): Promise<Customer> {
    const formData = new FormData();
    formData.append('photo', photo);
    
    return this.request<Customer>(`/customers/${customerId}/photo`, {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async uploadProductPhoto(productId: string, photo: File): Promise<Product> {
    const formData = new FormData();
    formData.append('photo', photo);
    
    return this.request<Product>(`/products/${productId}/photo`, {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async uploadEnterpriseLogo(enterpriseId: string, logo: File): Promise<Enterprise> {
    const formData = new FormData();
    formData.append('logo', logo);
    
    return this.request<Enterprise>(`/enterprises/${enterpriseId}/logo`, {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  // Connection check method
  async checkServerConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Erro ao verificar conexão com servidor:', error);
      return false;
    }
  }

  // Auth methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Salvar token no AsyncStorage
    await AsyncStorage.setItem('auth_token', response.access_token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));

    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Salvar token no AsyncStorage
    await AsyncStorage.setItem('auth_token', response.access_token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Mesmo se der erro no servidor, limpar dados locais
      console.warn('Erro ao fazer logout no servidor:', error);
    } finally {
      // Limpar dados do AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    }
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem('auth_token');
  }

  async getStoredUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }
}

export const apiService = new ApiService(); 