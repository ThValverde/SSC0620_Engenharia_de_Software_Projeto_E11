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

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    // Raiz do site intercepta o login e te joga pra página certa
    path: "/",
    Component: SmartRedirectRoute,
  },
  {
    // O Layout desenha o Menu Lateral (Sidebar)
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
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
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