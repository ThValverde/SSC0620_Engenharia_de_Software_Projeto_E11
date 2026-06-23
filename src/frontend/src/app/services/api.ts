import axios, { AxiosError, AxiosInstance } from 'axios';
import { toast } from 'sonner';

// @ts-ignore
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

interface InventoryEndpointPayload {
  razao_social: string;
  nome_fantasia: string;
  cnpj?: string;
  ativo: boolean;
  [key: string]: string | number | boolean | null | undefined;
}

interface TradePortalSummary {
  user: User;
  estabelecimentos: Array<{
    id: number;
    endpoint: string;
    tipo: string;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    ativo: boolean;
    nivel_permissao: string;
  }>;
}

interface TradePortalAddress {
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  regiao?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

interface TradePortalContact {
  id?: number;
  telefone?: string;
  email?: string;
  cargo?: string;
}

interface OdsCatalogItem {
  id: number;
  eixo: number;
  ods: number;
  descricao: string;
  natureza: "quali" | "quant";
}

interface OdsIndicatorState extends OdsCatalogItem {
  ativo: boolean;
  valor: number | null;
}

interface CatalogOption {
  id: number;
  categoria: string;
  customizada: boolean;
}

interface CatalogSubgroup {
  subgrupo_nome: string;
  opcoes: CatalogOption[];
}

interface CatalogSection {
  secao_id: number;
  secao_nome: string;
  com_pergunta: boolean;
  subgrupos: CatalogSubgroup[];
}

interface CatalogCreatePayload {
  escopo: string;
  secao: number;
  nome: string;
  categoria: string;
  customizada: boolean;
}

interface CatalogUpdatePayload {
  categoria: string;
}

interface TradePortalMyEstablishment {
  id: number;
  tipo: string;
  tipo_label: string;
  nivel_permissao: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  ativo: boolean;
  cadastur: {
    ativo: boolean;
    numero: string;
    vencimento: string | null;
  };
  endereco: TradePortalAddress;
  contatos: TradePortalContact[];
  infraestrutura: {
    uh_total: number | null;
    leitos: number | null;
    capacidade_maxima: number | null;
  };
  mao_de_obra: {
    qtde_funcionarios_fixos: number | null;
    qtde_funcionarios_temporarios: number | null;
  };
  sustentabilidade: OdsIndicatorState[];
  caracteristicas: number[];
  metricas: Array<{
    id: number;
    valor: string;
  }>;
}

interface HistoricoImportacao {
  id: number;
  arquivo: string;
  nome: string;
  fonte: string;
  status: "processado" | "falhou" | string;
  status_label?: string;
  autor_nome: string;
  importado_em: string;
  download_url: string;
}

class ApiService {
  private api: AxiosInstance;
  private refreshTokenRequest: Promise<string> | null = null;
  
  async getDashboardResumo(): Promise<any> {
    try {
      const response = await this.api.get('/inventario/dashboard/resumo/');
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar resumo do dashboard:", error);
      throw error;
    }
  }

  async listInventory(endpoint: string): Promise<any[]> {
    const response = await this.api.get(`/inventario/${endpoint}/`);
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async getInventoryItem(endpoint: string, id: number): Promise<any> {
    const response = await this.api.get(`/inventario/${endpoint}/${id}/`);
    return response.data;
  }

  async getOdsCatalog(): Promise<OdsCatalogItem[]> {
    const response = await this.api.get('/inventario/ods/');
    const data = response.data as any;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async getCatalogTree(escopo: string): Promise<CatalogSection[]> {
    const response = await this.api.get(`/inventario/caracteristicas/arvore/?escopo=${encodeURIComponent(escopo)}`);
    const data = response.data as any;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async createCatalogCharacteristic(payload: CatalogCreatePayload): Promise<{ id: number; categoria: string; customizada: boolean }> {
    try {
      const response = await this.api.post('/inventario/caracteristicas/', payload);
      toast.success('Opção adicionada ao catálogo');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as any;
        const message =
          responseData?.detail ||
          responseData?.error ||
          (typeof responseData === 'string' ? responseData : null) ||
          'Erro ao adicionar opção ao catálogo';
        toast.error(message);
      }
      throw error;
    }
  }

  async updateCatalogCharacteristic(id: number, payload: CatalogUpdatePayload): Promise<{ id: number; categoria: string; customizada: boolean }> {
    try {
      const response = await this.api.patch(`/inventario/caracteristicas/${id}/`, payload);
      toast.success('Opção atualizada no catálogo');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as any;
        const message =
          responseData?.detail ||
          responseData?.error ||
          (typeof responseData === 'string' ? responseData : null) ||
          'Erro ao atualizar opção do catálogo';
        toast.error(message);
      }
      throw error;
    }
  }

  async deleteCatalogCharacteristic(id: number): Promise<void> {
    try {
      await this.api.delete(`/inventario/caracteristicas/${id}/`);
      toast.success('Opção removida do catálogo');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as any;
        const message =
          responseData?.detail ||
          responseData?.error ||
          (typeof responseData === 'string' ? responseData : null) ||
          'Erro ao remover opção do catálogo';
        toast.error(message);
      }
      throw error;
    }
  }

  async createInventory(endpoint: string, payload: InventoryEndpointPayload): Promise<any> {
    try {
      const response = await this.api.post(`/inventario/${endpoint}/`, payload);
      toast.success('Estabelecimento criado com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao criar estabelecimento';
        toast.error(message);
      }
      throw error;
    }
  }

  async updateInventory(endpoint: string, id: number, payload: Partial<InventoryEndpointPayload>): Promise<any> {
    try {
      const response = await this.api.patch(`/inventario/${endpoint}/${id}/`, payload);
      toast.success('Estabelecimento atualizado com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao atualizar estabelecimento';
        toast.error(message);
      }
      throw error;
    }
  }

  async deleteInventory(endpoint: string, id: number): Promise<void> {
    try {
      await this.api.delete(`/inventario/${endpoint}/${id}/`);
      toast.success('Estabelecimento removido com sucesso');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao remover estabelecimento';
        toast.error(message);
      }
      throw error;
    }
  }
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
            // window.location.href = '/login';
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
      // Usamos <any> aqui para permitir a desestruturação segura mais abaixo
      const response = await this.api.post<any>('/auth/login/', {
        username: email,
        password,
      });
      
      const { access, refresh, user: rawUser } = response.data;
      
      // PROTEÇÃO: Garantimos que o objeto 'user' tem a estrutura exata 
      // que o nosso AuthContext e ProtectedRoute esperam, evitando a Tela Branca.
      const safeUser: User = {
        id: rawUser?.id || rawUser?.pk || 0,
        email: rawUser?.email || email,
        username: rawUser?.username || email,
        is_superuser: !!rawUser?.is_superuser,
        // Garantimos que groups é SEMPRE um array, mesmo que o backend não envie
        groups: Array.isArray(rawUser?.groups) ? rawUser.groups : [],
        first_name: rawUser?.first_name || '',
        last_name: rawUser?.last_name || ''
      };
      
      this.setAccessToken(access);
      this.setRefreshToken(refresh);
      this.setUser(safeUser);

      return {
        access,
        refresh,
        user: safeUser
      };
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || 'Credenciais inválidas ou erro no servidor.');
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
    const data = response.data as any;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async listTradeUsers(): Promise<any[]> {
    const response = await this.api.get('/inventario/trade-users/');
    const data = response.data as any;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async createTradeUser(userData: any): Promise<any> {
    try {
      const response = await this.api.post('/inventario/trade-users/', userData);
      toast.success('Usuário trade criado com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || 'Erro ao criar usuário trade');
      }
      throw error;
    }
  }

  async updateTradeUser(userId: number, userData: any): Promise<any> {
    try {
      const response = await this.api.patch(`/inventario/trade-users/${userId}/`, userData);
      toast.success('Usuário trade atualizado com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || 'Erro ao atualizar usuário trade');
      }
      throw error;
    }
  }

  async deleteTradeUser(userId: number): Promise<void> {
    try {
      await this.api.delete(`/inventario/trade-users/${userId}/`);
      toast.success('Usuário trade removido com sucesso');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || 'Erro ao remover usuário trade');
      }
      throw error;
    }
  }

  async getTradePortalResumo(): Promise<TradePortalSummary> {
    const response = await this.api.get<TradePortalSummary>('/inventario/trade/portal/');
    return response.data;
  }

  async getHistoricoImportacoes(): Promise<HistoricoImportacao[]> {
    const response = await this.api.get<HistoricoImportacao[]>('/historico/importacoes/');
    const data = response.data as any;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async uploadArquivoImportacao(file: File, fonte: string): Promise<HistoricoImportacao> {
    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('fonte', fonte);
      formData.append('nome', file.name);

      const response = await this.api.post<HistoricoImportacao>('/historico/importacoes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Arquivo importado com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao importar arquivo';
        toast.error(message);
      }
      throw error;
    }
  }

  async deleteHistoricoImportacao(id: number): Promise<void> {
    try {
      await this.api.delete(`/historico/importacoes/${id}/`);
      toast.success('Anexo removido com sucesso');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao remover anexo';
        toast.error(message);
      }
      throw error;
    }
  }

  async getMyTradeEstablishment(): Promise<TradePortalMyEstablishment> {
    const response = await this.api.get<TradePortalMyEstablishment>('/inventario/meu-estabelecimento/');
    return response.data;
  }

  async updateMyTradeEstablishment(payload: any): Promise<TradePortalMyEstablishment> {
    try {
      const response = await this.api.patch<TradePortalMyEstablishment>('/inventario/meu-estabelecimento/', payload);
      toast.success('Dados do estabelecimento atualizados com sucesso');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || 'Erro ao atualizar estabelecimento';
        toast.error(message);
      }
      throw error;
    }
  }

  async changePassword(oldPassword: string, newPassword1: string, newPassword2: string): Promise<void> {
    try {
      await this.api.post('/auth/password/change/', {
        old_password: oldPassword,
        new_password1: newPassword1,
        new_password2: newPassword2,
      });
      toast.success('Senha alterada com sucesso');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || 'Erro ao alterar senha');
      }
      throw error;
    }
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
