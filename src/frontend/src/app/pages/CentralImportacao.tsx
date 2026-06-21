import { useState, useEffect } from "react";
import {
  UploadCloud, CheckCircle2, XCircle, Clock, FileSpreadsheet,
  Database, Leaf, TrendingUp, Receipt, X, FileText,
  ChevronRight, AlertCircle, RefreshCw, Eye,
} from "lucide-react";

// ─── Module Definitions ──────────────────────────────────────
type ModuleId = "ods" | "issqn" | "caged" | "pesquisas";
type UploadState = "idle" | "dragging" | "uploading" | "done" | "error";
type ImportStatus = "success" | "error" | "processing";

interface Module {
  id: ModuleId;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
  description: string;
  columns: string[];
  toastMsg: string;
}

const modules: Module[] = [
  {
    id: "ods",
    label: "Módulo ODS",
    sublabel: "Agenda 2030",
    icon: Leaf,
    color: "#16a34a",
    bgLight: "#f0fdf4",
    description:
      "Dados de sustentabilidade, empregos diretos e indiretos no setor de turismo. Alimenta os indicadores de empregabilidade do Dashboard.",
    columns: ["Ano", "Empregos Diretos", "Empregos Indiretos", "Segmento", "Certificação ODS", "Município"],
    toastMsg: "Importação concluída! 3.695 empregos diretos inseridos e cálculo de indiretos atualizado com sucesso.",
  },
  {
    id: "issqn",
    label: "ISSQN",
    sublabel: "Finanças",
    icon: Receipt,
    color: "#1a6fbf",
    bgLight: "#eff6ff",
    description:
      "Arrecadação de ISSQN por segmento turístico. Utilizado para estimativa de receita gerada pelo turismo no município.",
    columns: ["Competência", "CNPJ", "Razão Social", "Segmento", "Valor ISSQN (R$)", "Município"],
    toastMsg: "Importação concluída! 1.248 registros de ISSQN inseridos e Receita Estimada atualizada no Dashboard.",
  },
  {
    id: "caged",
    label: "Bases Externas",
    sublabel: "CAGED / Fluxo",
    icon: Database,
    color: "#8b5cf6",
    bgLight: "#f5f3ff",
    description:
      "Microdados do CAGED (Ministério do Trabalho) e fluxo de visitantes de fontes externas (MTur, SETUR-SP).",
    columns: ["Mês/Ano", "Admissões", "Demissões", "CBO Turismo", "Saldo", "UF"],
    toastMsg: "Importação concluída! 5.120 registros do CAGED inseridos e saldo de empregos recalculado.",
  },
  {
    id: "pesquisas",
    label: "Pesquisas Mensais",
    sublabel: "Booking / Ocupação",
    icon: TrendingUp,
    color: "#f59e0b",
    bgLight: "#fffbeb",
    description:
      "Pesquisas mensais de ocupação hoteleira, ADR e RevPAR de plataformas como Booking.com e dados próprios.",
    columns: ["Mês", "Estabelecimento", "Taxa Ocupação (%)", "ADR (R$)", "RevPAR (R$)", "Fonte"],
    toastMsg: "Importação concluída! 892 pesquisas de ocupação inseridas e Taxa de Ocupação Média atualizada.",
  },
];

// ─── Recent Imports ──────────────────────────────────────────
interface RecentImport {
  id: number;
  file: string;
  module: string;
  moduleColor: string;
  records: number;
  date: string;
  status: ImportStatus;
  size: string;
}

const initialImports: RecentImport[] = [
  { id: 1, file: "empregos_ods_2025_q1.xlsx", module: "Módulo ODS", moduleColor: "#16a34a", records: 3695, date: "12/03/2025", status: "success", size: "1,2 MB" },
  { id: 2, file: "issqn_jan_fev_2025.csv", module: "ISSQN Finanças", moduleColor: "#1a6fbf", records: 1248, date: "05/04/2025", status: "success", size: "480 KB" },
  { id: 3, file: "caged_fev_2025.csv", module: "Bases Externas", moduleColor: "#8b5cf6", records: 5120, date: "28/02/2025", status: "success", size: "2,4 MB" },
  { id: 4, file: "booking_ocupacao_mar25.xlsx", module: "Pesquisas Mensais", moduleColor: "#f59e0b", records: 892, date: "10/04/2025", status: "success", size: "310 KB" },
  { id: 5, file: "caged_jan_2025_v2.csv", module: "Bases Externas", moduleColor: "#8b5cf6", records: 0, date: "31/01/2025", status: "error", size: "1,9 MB" },
];

// ─── Toast Component ─────────────────────────────────────────
interface ToastProps {
  message: string;
  onClose: () => void;
}

function SuccessToast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm animate-slide-in">
      <div className="bg-white border border-emerald-200 rounded-xl shadow-2xl p-4 flex gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0c2340]">Importação concluída!</p>
          <p className="text-xs text-[#64748b] mt-0.5 leading-snug">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#94a3b8] hover:text-[#64748b] transition-colors flex-shrink-0 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-emerald-100 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-b-xl"
          style={{ animation: "shrink 6s linear forwards" }}
        />
      </div>
      <style>{`
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
        @keyframes slide-in { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.35s cubic-bezier(.21,1.02,.73,1) forwards; }
      `}</style>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export function CentralImportacao() {
  const [activeModule, setActiveModule] = useState<ModuleId>("ods");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [droppedFile, setDroppedFile] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [imports, setImports] = useState<RecentImport[]>(initialImports);

  const currentModule = modules.find((m) => m.id === activeModule)!;

  // Show demo toast on mount to simulate the spec requirement
  useEffect(() => {
    const t = setTimeout(() => {
      setToastMsg(modules[0].toastMsg);
      setShowToast(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const simulateUpload = (fileName: string) => {
    setDroppedFile(fileName);
    setUploadState("uploading");
    setTimeout(() => {
      setUploadState("done");
      setToastMsg(currentModule.toastMsg);
      setShowToast(true);
      // Add to recent imports
      setImports((prev) => [
        {
          id: Date.now(),
          file: fileName,
          module: `${currentModule.label} ${currentModule.sublabel}`,
          moduleColor: currentModule.color,
          records: Math.floor(Math.random() * 4000) + 800,
          date: new Date().toLocaleDateString("pt-BR"),
          status: "success",
          size: `${(Math.random() * 2 + 0.3).toFixed(1)} MB`,
        },
        ...prev.slice(0, 7),
      ]);
    }, 2200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("idle");
    const file = e.dataTransfer.files[0];
    if (file) simulateUpload(file.name);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name);
  };

  const resetUpload = () => {
    setUploadState("idle");
    setDroppedFile(null);
  };

  const statusBadge = (status: ImportStatus) => {
    if (status === "success") return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
        <CheckCircle2 size={9} /> Concluído
      </span>
    );
    if (status === "error") return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">
        <XCircle size={9} /> Erro
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        <Clock size={9} /> Processando
      </span>
    );
  };

  return (
    <>
      {/* Toast */}
      {showToast && (
        <SuccessToast
          message={toastMsg}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[#0c2340]">Central de Importação</h1>
            <p className="text-[#64748b] text-sm mt-0.5">
              Importe planilhas governamentais e externas para atualizar as bases do sistema
            </p>
          </div>
          <button
            onClick={() => { setToastMsg(currentModule.toastMsg); setShowToast(true); }}
            className="flex items-center gap-2 text-xs text-[#1a6fbf] border border-[#1a6fbf]/30 hover:bg-[#eff6ff] px-3 py-2 rounded-lg transition-colors"
          >
            <Eye size={13} />
            Demo: Exibir toast
          </button>
        </div>

        {/* ── Module Selector ─────────────────── */}
        <div>
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
            Selecione o Módulo de Importação
          </p>
          <div className="grid grid-cols-4 gap-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => { setActiveModule(mod.id); resetUpload(); }}
                  className={`flex items-start gap-3 p-4 rounded-xl text-left transition-all border-2 ${
                    isActive
                      ? "shadow-md"
                      : "bg-white border-[#e2e8f0] hover:shadow-sm hover:border-[#cbd5e1]"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: mod.bgLight, borderColor: mod.color, boxShadow: `0 4px 14px ${mod.color}25` }
                      : {}
                  }
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: isActive ? mod.color : `${mod.color}18` }}
                  >
                    <Icon size={17} style={{ color: isActive ? "white" : mod.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-tight"
                      style={{ color: isActive ? mod.color : "#334155", fontWeight: isActive ? 700 : 500 }}
                    >
                      {mod.label}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isActive ? "text-[#64748b]" : "text-[#94a3b8]"}`}>
                      {mod.sublabel}
                    </p>
                  </div>
                  {isActive && (
                    <ChevronRight size={14} style={{ color: mod.color }} className="flex-shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Module Info + Upload ──────── */}
        <div className="grid grid-cols-3 gap-5">
          {/* Module info */}
          <div
            className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${currentModule.color}18` }}
              >
                <currentModule.icon size={16} style={{ color: currentModule.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0c2340]">{currentModule.label}</p>
                <p className="text-[11px] text-[#94a3b8]">{currentModule.sublabel}</p>
              </div>
            </div>

            <p className="text-xs text-[#64748b] leading-relaxed mb-4">
              {currentModule.description}
            </p>

            <div>
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Colunas Esperadas
              </p>
              <div className="space-y-1.5">
                {currentModule.columns.map((col, i) => (
                  <div key={col} className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold flex-shrink-0"
                      style={{ backgroundColor: `${currentModule.color}18`, color: currentModule.color }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs text-[#334155]">{col}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-4 pt-4 border-t border-[#f1f5f9] flex items-center gap-2 text-[11px]"
              style={{ color: currentModule.color }}
            >
              <FileSpreadsheet size={12} />
              <span>Formatos aceitos: .CSV, .XLSX</span>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="col-span-2 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#0c2340]">Área de Importação</p>
              {(uploadState === "done" || uploadState === "error") && (
                <button
                  onClick={resetUpload}
                  className="flex items-center gap-1.5 text-xs text-[#64748b] hover:text-[#334155] transition-colors"
                >
                  <RefreshCw size={12} /> Nova importação
                </button>
              )}
            </div>

            {uploadState === "idle" || uploadState === "dragging" ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setUploadState("dragging"); }}
                onDragLeave={() => setUploadState("idle")}
                onDrop={handleDrop}
                className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  uploadState === "dragging"
                    ? "border-[#1a6fbf] bg-[#eff6ff]"
                    : "border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#f8fafc]"
                }`}
                style={
                  uploadState === "dragging"
                    ? { borderColor: currentModule.color, backgroundColor: currentModule.bgLight }
                    : {}
                }
              >
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                    uploadState === "dragging" ? "scale-110" : ""
                  }`}
                  style={{ backgroundColor: uploadState === "dragging" ? `${currentModule.color}20` : "#f1f5f9" }}
                >
                  <UploadCloud
                    size={28}
                    style={{ color: uploadState === "dragging" ? currentModule.color : "#94a3b8" }}
                  />
                </div>
                <p className={`text-sm font-medium ${uploadState === "dragging" ? "" : "text-[#334155]"}`}
                  style={{ color: uploadState === "dragging" ? currentModule.color : undefined }}
                >
                  {uploadState === "dragging"
                    ? "Solte o arquivo aqui"
                    : "Arraste e solte o arquivo da planilha (.CSV ou .XLSX) aqui"}
                </p>
                <p className="text-xs text-[#94a3b8] mt-1.5">
                  ou <span className="text-[#1a6fbf] underline underline-offset-2">clique para selecionar</span>
                </p>
                <p className="text-[10px] text-[#cbd5e1] mt-4">
                  Tamanho máximo: 50 MB · Formatos: .CSV, .XLSX
                </p>
              </label>
            ) : uploadState === "uploading" ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${currentModule.color}18` }}
                >
                  <RefreshCw size={28} style={{ color: currentModule.color }} className="animate-spin" />
                </div>
                <p className="text-sm font-medium text-[#334155]">Processando importação…</p>
                <p className="text-xs text-[#94a3b8] mt-1">{droppedFile}</p>
                <div className="w-48 h-1.5 bg-[#f1f5f9] rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-[2000ms]"
                    style={{ backgroundColor: currentModule.color, width: "85%" }}
                  />
                </div>
                <p className="text-[10px] text-[#94a3b8] mt-2">Validando colunas e inserindo registros…</p>
              </div>
            ) : uploadState === "done" ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-[#0c2340]">Importação concluída!</p>
                <p className="text-xs text-[#64748b] mt-1 text-center max-w-xs">
                  {droppedFile} foi processado com sucesso e os indicadores foram atualizados.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={resetUpload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
                  >
                    <RefreshCw size={13} /> Nova importação
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle size={28} className="text-red-500" />
                </div>
                <p className="text-sm font-semibold text-[#0c2340]">Erro na importação</p>
                <p className="text-xs text-[#64748b] mt-1">Verifique o formato do arquivo e tente novamente.</p>
                <button
                  onClick={resetUpload}
                  className="flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 hover:bg-red-100 transition-colors"
                >
                  <RefreshCw size={13} /> Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Imports Table ─────────────── */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
            <div>
              <h3 className="text-[#0c2340]">Histórico de Importações</h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">Últimas importações realizadas no sistema</p>
            </div>
            <span className="text-xs text-[#94a3b8]">{imports.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["Arquivo", "Módulo", "Registros", "Tamanho", "Data", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {imports.map((imp) => (
                  <tr key={imp.id} className={`hover:bg-[#f8fafc] transition-colors ${imp.status === "error" ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className={imp.status === "error" ? "text-red-400" : "text-[#94a3b8]"} />
                        <span className="text-xs text-[#334155] font-medium">{imp.file}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${imp.moduleColor}15`, color: imp.moduleColor }}
                      >
                        {imp.module}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#334155] font-medium">
                        {imp.status === "error" ? "—" : imp.records.toLocaleString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#94a3b8]">{imp.size}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#64748b]">{imp.date}</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(imp.status)}</td>
                    <td className="px-4 py-3">
                      {imp.status === "error" && (
                        <button className="text-[10px] text-red-500 hover:text-red-700 hover:underline transition-colors">
                          Ver erro
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
