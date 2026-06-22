import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Inventario } from "./pages/Inventario";
import { CentralImportacao } from "./pages/CentralImportacao";
import { CruzamentoDados } from "./pages/CruzamentoDados";
import { Historico } from "./pages/Historico";
import { PortalTrade } from "./pages/PortalTrade";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute, SmartRedirectRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: () => (
          <SmartRedirectRoute>
            <Dashboard />
          </SmartRedirectRoute>
        ),
      },
      {
        path: "dashboard",
        Component: () => (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "inventario",
        Component: () => (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <Inventario />
          </ProtectedRoute>
        ),
      },
      {
        path: "importacao",
        Component: () => (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <CentralImportacao />
          </ProtectedRoute>
        ),
      },
      {
        path: "cruzamento",
        Component: () => (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <CruzamentoDados />
          </ProtectedRoute>
        ),
      },
      {
        path: "historico",
        Component: () => (
          <ProtectedRoute allowedRoles={["Secretaria_Admin", "Secretaria_Staff"]}>
            <Historico />
          </ProtectedRoute>
        ),
      },
      {
        path: "portal-trade",
        Component: () => (
          <ProtectedRoute>
            <PortalTrade />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    Component: () => <Navigate to="/login" replace />,
  },
]);
