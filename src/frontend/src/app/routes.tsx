import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Inventario } from "./pages/Inventario";
import { CentralImportacao } from "./pages/CentralImportacao";
import { CruzamentoDados } from "./pages/CruzamentoDados";
import { Historico } from "./pages/Historico";
import { PortalTrade } from "./pages/PortalTrade";
import { TradePortalPage } from "./pages/TradePortalPage";
import { UsersPage } from "./pages/UsersPage";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute, SmartRedirectRoute, TradeOnlyRoute } from "./components/ProtectedRoute";

/**
 * Mapeamento de rotas e controle de acesso (RBAC) do dashboard.
 * Define a árvore de navegação e restringe o acesso às páginas protegidas com base
 * nos perfis de usuário (Admin/Staff da Secretaria ou Trade Turístico).
 */
export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: SmartRedirectRoute,
  },
  {
    element: <Layout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventario",
        element: (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <Inventario />
          </ProtectedRoute>
        ),
      },
      {
        path: "/importacao",
        element: (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <CentralImportacao />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cruzamento",
        element: (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <CruzamentoDados />
          </ProtectedRoute>
        ),
      },
      {
        path: "/historico",
        element: (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <Historico />
          </ProtectedRoute>
        ),
      },
      {
        path: "/portal-trade",
        element: (
          <ProtectedRoute allowedRoles={["Secretaria_Admin"]}>
            <PortalTrade />
          </ProtectedRoute>
        ),
      },
      {
        path: "/trade-portal",
        element: (
          <TradeOnlyRoute>
            <TradePortalPage />
          </TradeOnlyRoute>
        ),
      },
      {
        path: "/users",
        element: (
          <ProtectedRoute allowedRoles={["Secretaria_Admin"]}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
