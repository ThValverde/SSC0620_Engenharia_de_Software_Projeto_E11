import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";

/**
 * Ponto de entrada do dashboard.
 * Envolve a aplicação com o contexto de autenticação, sistema de rotas e o container de notificações.
 */
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
