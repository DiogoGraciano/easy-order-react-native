import { Customer, Enterprise, Order, Product } from '../types/models';

const API_BASE_URL = 'http://localhost:3000'; // Ajustar conforme necessário

class ApiService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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
    return this.request<Order>(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
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
      return this.request<Customer>(`/customers/${customer.id}`, {
        method: 'PUT',
        body: JSON.stringify(customer),
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
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async getProductById(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async saveProduct(product: Product): Promise<Product> {
    if (product.id) {
      return this.request<Product>(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
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

  // Enterprise methods
  async getEnterprises(): Promise<Enterprise[]> {
    return this.request<Enterprise[]>('/enterprises');
  }

  async getEnterpriseById(id: string): Promise<Enterprise> {
    return this.request<Enterprise>(`/enterprises/${id}`);
  }

  async saveEnterprise(enterprise: Enterprise): Promise<Enterprise> {
    if (enterprise.id) {
      return this.request<Enterprise>(`/enterprises/${enterprise.id}`, {
        method: 'PUT',
        body: JSON.stringify(enterprise),
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
}

export const apiService = new ApiService(); 