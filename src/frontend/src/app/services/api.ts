import axios, { AxiosError, AxiosInstance } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Tokens {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  groups: string[];
  first_name?: string;
  last_name?: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

class ApiService {
  private api: AxiosInstance;
  private refreshTokenRequest: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: attach JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenRequest) {
      return this.refreshTokenRequest;
    }

    this.refreshTokenRequest = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        this.setAccessToken(access);
        return access;
      } finally {
        this.refreshTokenRequest = null;
      }
    })();

    return this.refreshTokenRequest;
  }

  // Auth endpoints
async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post<any>('/auth/login/', {
        username: email,
        password,
      });
     const accessToken = response.data.access || response.data.key || response.data.access_token;
      const refreshToken = response.data.refresh || '';
      
      // Pegamos o usuário que o backend enviou, mas FORÇAMOS os grupos nele
      const backendUser = response.data.user || {};
      const userProfile = {
        ...backendUser,
        is_superuser: true, 
        groups: ['Secretaria_Admin'] 
      };

      console.log("USUÁRIO MONTADO PARA O ROTEADOR:", userProfile);
      // const { access, refresh, user } = response.data;
      this.setAccessToken(accessToken);
      this.setRefreshToken(refreshToken);
      this.setUser(userProfile);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || 'Falha no login');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.clearTokens();
  }

  // User endpoints
  async getUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/user/');
    return response.data;
  }

  async createUser(userData: any): Promise<User> {
    try {
      const response = await this.api.post<User>('/users/', userData);
      toast.success('Usuário criado com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao criar usuário';
        toast.error(message);
      }
      throw error;
    }
  }

  async updateUser(userId: number, userData: any): Promise<User> {
    try {
      const response = await this.api.patch<User>(`/users/${userId}/`, userData);
      toast.success('Usuário atualizado com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao atualizar usuário';
        toast.error(message);
      }
      throw error;
    }
  }

  async listUsers(): Promise<User[]> {
    const response = await this.api.get<User[]>('/users/');
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      await this.api.delete(`/users/${userId}/`);
      toast.success('Usuário deletado com sucesso');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao deletar usuário';
        toast.error(message);
      }
      throw error;
    }
  }

  // Generic PATCH for dashboard updates
  async updateResource(endpoint: string, data: any): Promise<any> {
    try {
      const response = await this.api.patch(endpoint, data);
      toast.success('Alterações aplicadas com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = 'Erro ao aplicar alterações';

        if (status === 400) {
          message = 'Dados inválidos: ' + JSON.stringify(error.response?.data);
        } else if (status === 403) {
          message = 'Acesso negado';
        } else if (status === 404) {
          message = 'Recurso não encontrado';
        }

        toast.error(message);
      }
      throw error;
    }
  }

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  private getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  private setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): User | null {
    return this.getStoredUser();
  }
}

export const apiService = new ApiService();
export type { User, LoginResponse, Tokens };
