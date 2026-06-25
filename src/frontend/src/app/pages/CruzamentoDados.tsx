/**
 * Tela de Cruzamento de Dados.
 * Atualmente renderiza um componente de placeholder indicando que o módulo 
 * de consultas avançadas e análises está em desenvolvimento.
 */
import { Database } from "lucide-react";
import { MockPage } from "../components/MockPage";

export function CruzamentoDados() {
  return (
    <MockPage
      title="Cruzamento de Dados"
      description="Consultas avançadas e análises de dados turísticos"
      icon={<Database className="w-16 h-16 text-blue-500" />}
      message="Módulo em desenvolvimento: Futura implementação"
      showComingSoon={true}
    />
  );
}
