import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f0f4f8]">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-[#0c2340] border-transparent border-t-[#1a6fbf] rounded-full" />
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && isAuthenticated && user) {
    const hasRole = allowedRoles.some((role) => {
      if (role === 'superuser') return user.is_superuser;
      return user.groups.includes(role);
    });

    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

interface SmartRedirectProps {
  children: React.ReactNode;
}

export function SmartRedirectRoute({ children }: SmartRedirectProps) {
  const { isAuthenticated, isLoading, isSuperuser, isSecretariaAdmin, isSecretariaStaff, isTradeUser } =
    useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f0f4f8]">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-[#0c2340] border-transparent border-t-[#1a6fbf] rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Smart redirect based on user role
  if (location.pathname === '/') {
    if (isTradeUser()) {
      return <Navigate to="/portal-trade" replace />;
    } else {
      // Admin, Secretaria_Admin, or Secretaria_Staff
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
