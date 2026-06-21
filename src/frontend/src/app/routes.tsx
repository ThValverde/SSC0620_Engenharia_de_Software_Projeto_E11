import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Inventario } from "./pages/Inventario";
import { CentralImportacao } from "./pages/CentralImportacao";
import { CruzamentoDados } from "./pages/CruzamentoDados";
import { Historico } from "./pages/Historico";
import { PortalTrade } from "./pages/PortalTrade";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "inventario", Component: Inventario },
      { path: "importacao", Component: CentralImportacao },
      { path: "cruzamento", Component: CruzamentoDados },
      { path: "historico", Component: Historico },
      { path: "portal-trade", Component: PortalTrade },
    ],
  },
]);
