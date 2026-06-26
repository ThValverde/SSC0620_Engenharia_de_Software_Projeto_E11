/**
 * Ponto de entrada principal da aplicação React.
 * Inicializa a injeção do componente raiz no DOM da página estática.
 */
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  
