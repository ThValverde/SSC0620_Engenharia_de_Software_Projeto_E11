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
  // RBAC methods
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

const roleHierarchy: Record<string, RoleHierarchy> = {
  superuser: { level: 4, name: 'Django Admin' },
  'Secretaria_Admin': { level: 3, name: 'OTO Admin' },
  'Secretaria_Staff': { level: 2, name: 'OTO Staff' },
  trade: { level: 1, name: 'Trade User' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage or verify token
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const currentUser = apiService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Try to fetch fresh user data
            const userData = await apiService.getUser();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        apiService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    setUser(response.user);
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  // RBAC Helper Methods
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    if (role === 'superuser') return user.is_superuser;
    return user.groups.includes(role);
  };

  const hasGroup = (group: string): boolean => {
    return user?.groups.includes(group) ?? false;
  };

  const isSuperuser = (): boolean => user?.is_superuser ?? false;

  const isSecretariaAdmin = (): boolean => hasGroup('Secretaria_Admin');

  const isSecretariaStaff = (): boolean => hasGroup('Secretaria_Staff');

  const isTradeUser = (): boolean => {
    // Trade users have empty groups or specific trade-related setup
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

  const canCreateUser = (targetUserType: string): boolean => {
    if (!user) return false;

    const currentLevel = getRoleLevel();

    // Superuser can create Secretaria_Admin
    if (isSuperuser() && targetUserType === 'Secretaria_Admin') return true;

    // Secretaria_Admin can create Secretaria_Staff and Trade users
    if (isSecretariaAdmin()) {
      return ['Secretaria_Staff', 'Trade'].includes(targetUserType);
    }

    // Secretaria_Staff can only create Trade users
    if (isSecretariaStaff() && targetUserType === 'Trade') return true;

    return false;
  };

  const canAccessModule = (module: 'users' | 'inventory' | 'import' | 'crossing' | 'history' | 'portal'): boolean => {
    if (!user) return false;

    // User management: only admins and staff can access (not Trade users)
    if (module === 'users') {
      return !isTradeUser();
    }

    // Trade users can only access portal
    if (isTradeUser()) {
      return module === 'portal';
    }

    // Admins can access all modules
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
