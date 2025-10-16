import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000';

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

class AuthService {
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
          const errorData = await response.json();
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

export const authService = new AuthService();
