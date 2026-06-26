import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

interface ProtectedRouteProps {
  children: React.JSX.Element;
  allowedRoles?: string[];
}

/**
 * Bloqueia rotas baseando-se no RBAC (Role-Based Access Control).
 * Se o usuário não tiver a permissão necessária (ou não for superuser), 
 * ele é ejetado por padrão para a visão restrita (/portal-trade).
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-[#64748b]">Verificando permissões...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = 
      user.is_superuser || 
      (Array.isArray(user.groups) && user.groups.some(role => allowedRoles.includes(role)));

    if (!hasPermission) {
      return <Navigate to="/portal-trade" replace />;
    }
  }

  return children;
}

interface SmartRedirectRouteProps {
  children?: React.ReactNode; 
}

/**
 * Rota inteligente de entrada ("/") que atua como um "guarda de trânsito" após o login.
 * Analisa o perfil do usuário e o redireciona automaticamente para sua página inicial correta 
 * (Dashboard para a Secretaria ou Trade Portal para usuários externos).
 */
export function SmartRedirectRoute({ children }: SmartRedirectRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-[#64748b]">Carregando portal...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isSecretaria = 
    user.is_superuser || 
    (Array.isArray(user.groups) && (user.groups.includes('Secretaria_Admin') || user.groups.includes('Secretaria_Staff')));

  if (isSecretaria) {
    return <Navigate to="/dashboard" replace />; 
  }

  return <Navigate to="/trade-portal" replace />;
}

/**
 * Restringe o acesso de uma rota estritamente para os usuários do Trade Turístico.
 */
export function TradeOnlyRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isTradeUser } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-[#64748b]">Carregando portal...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!isTradeUser()) {
    return <Navigate to="/portal-trade" replace />;
  }

  return children;
}
