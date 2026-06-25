import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService, User } from '../services/api';

interface RoleHierarchy {
  level: number;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasGroup: (group: string) => boolean;
  isSuperuser: () => boolean;
  isSecretariaAdmin: () => boolean;
  isSecretariaStaff: () => boolean;
  isTradeUser: () => boolean;
  getRoleLevel: () => number;
  canCreateUser: (targetUserType: string) => boolean;
  canAccessModule: (module: 'users' | 'inventory' | 'import' | 'crossing' | 'history' | 'portal') => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Matriz de níveis de poder do RBAC.
 * Usada para impedir que um usuário crie ou edite outro com privilégios maiores que os seus.
 */
const roleHierarchy: Record<string, RoleHierarchy> = {
  superuser: { level: 4, name: 'Django Admin' },
  'Secretaria_Admin': { level: 3, name: 'OTO Admin' },
  'Secretaria_Staff': { level: 2, name: 'OTO Staff' },
  trade: { level: 1, name: 'Trade User' },
};

/**
 * Gerenciador global de sessão e permissões.
 * Centraliza as regras de negócio de quem pode acessar o quê (RBAC) e mantém 
 * o estado do usuário sincronizado em toda a aplicação.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = apiService.isAuthenticated();
        if (token) {
          const userData = await apiService.getUser();
          setUser(userData);
        }
      } catch (error) {
        console.warn('Sessão expirada ou inválida, forçando login.');
        apiService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await apiService.login(email, password);
    const loggedUser = apiService.getCurrentUser();
    setUser(loggedUser);
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    if (role === 'superuser') return !!user.is_superuser;
    return Array.isArray(user.groups) && user.groups.includes(role);
  };

  const hasGroup = (group: string): boolean => {
    if (!user || !Array.isArray(user.groups)) return false;
    return user.groups.includes(group);
  };

  const isSuperuser = (): boolean => user?.is_superuser ?? false;

  const isSecretariaAdmin = (): boolean => hasGroup('Secretaria_Admin');

  const isSecretariaStaff = (): boolean => hasGroup('Secretaria_Staff');

  const isTradeUser = (): boolean => {
    if (!user) return false;
    return !user.is_superuser && !hasGroup('Secretaria_Admin') && !hasGroup('Secretaria_Staff');
  };

  const getRoleLevel = (): number => {
    if (!user) return 0;
    if (isSuperuser()) return roleHierarchy.superuser.level;
    if (isSecretariaAdmin()) return roleHierarchy['Secretaria_Admin'].level;
    if (isSecretariaStaff()) return roleHierarchy['Secretaria_Staff'].level;
    return roleHierarchy.trade.level;
  };

  /**
   * Valida a hierarquia na criação de contas (Prevenção de escalada de privilégios).
   */
  const canCreateUser = (targetUserType: string): boolean => {
    if (!user) return false;

    if (isSuperuser() && targetUserType === 'Secretaria_Admin') return true;

    if (isSecretariaAdmin()) {
      return ['Secretaria_Staff', 'Trade'].includes(targetUserType);
    }

    if (isSecretariaStaff() && targetUserType === 'Trade') return true;

    return false;
  };

  /**
   * Guarda de rotas modular (Restrição horizontal).
   * Define limites rígidos do que cada perfil visualiza, impedindo que o Trade 
   * acesse módulos internos da Secretaria e vice-versa.
   */
  const canAccessModule = (module: 'users' | 'inventory' | 'import' | 'crossing' | 'history' | 'portal'): boolean => {
    if (!user) return false;

    if (module === 'users') {
      return isSuperuser() || isSecretariaAdmin();
    }

    if (isTradeUser()) {
      return module === 'portal';
    }

    return true;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && apiService.isAuthenticated(),
    isLoading,
    login,
    logout,
    hasRole,
    hasGroup,
    isSuperuser,
    isSecretariaAdmin,
    isSecretariaStaff,
    isTradeUser,
    getRoleLevel,
    canCreateUser,
    canAccessModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
