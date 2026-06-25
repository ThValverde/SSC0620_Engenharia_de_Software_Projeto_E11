/**
 * Tela da Central de Importação.
 * Atualmente renderiza um componente de placeholder indicando que o módulo 
 * de upload e processamento de dados turísticos está em desenvolvimento.
 */
import { UploadCloud } from "lucide-react";
import { MockPage } from "../components/MockPage";

export function CentralImportacao() {
  return (
    <MockPage
      title="Central de Importação"
      description="Upload e processamento de dados turísticos"
      icon={<UploadCloud className="w-16 h-16 text-green-500" />}
      message="Módulo em desenvolvimento: Futura implementação"
      showComingSoon={true}
    />
  );
}
