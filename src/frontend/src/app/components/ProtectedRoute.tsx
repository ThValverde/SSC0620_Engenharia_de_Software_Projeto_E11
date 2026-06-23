import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, isAuthenticated } = useAuth();

  // 1. Se não tiver usuário no contexto, expulsa pro login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. RBAC: Verifica se o usuário pertence à Secretaria
  const isSecretaria = 
    user.is_superuser || 
    (user.groups && (user.groups.includes('Secretaria_Admin') || user.groups.includes('Secretaria_Staff')));

  // 3. Se for da Secretaria (Superuser ou Admin/Staff OTO), libera o Dashboard
  if (isSecretaria) {
    return <Outlet />;
  }

  // 4. Se passou por aqui e não é da secretaria, é do Trade! 
  // Tranca ele na visão do empresário.
  return <Navigate to="/portal-trade" replace />;
}

export function SmartRedirectRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isSecretaria = 
    user.is_superuser || 
    (user.groups && (user.groups.includes('Secretaria_Admin') || user.groups.includes('Secretaria_Staff')));

  // Se for da secretaria, redireciona para a página principal deles
  if (isSecretaria) {
    return <Navigate to="/dashboard" replace />; 
  }

  // Se for do Trade, redireciona para o portal deles
  return <Navigate to="/portal-trade" replace />;
}