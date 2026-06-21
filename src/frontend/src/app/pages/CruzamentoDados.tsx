import React, { useState, useRef, useEffect } from "react";
import {
  Database, Filter, Calendar, Download, Play, X,
  CheckCircle2, AlertCircle, FileSpreadsheet, FileText,
  Trash2, EyeOff, Save, Layers, TrendingUp, DollarSign,
  Leaf, Accessibility, Undo2, Loader2,
} from "lucide-react";

type AgrupamentoTemporal = "dia" | "mes" | "ano";

interface SegmentoOption {
  id: string;
  label: string;
  checked: boolean;
}

interface MetricaOption {
  id: string;
  label: string;
  checked: boolean;
  icon: any;
}

interface ResultRow {
  id: number;
  estabelecimento: string;
  segmento: string;
  ocupacao?: number;
  visitantes?: number;
  diaria?: number;
  issqn?: number;
  ods?: string;
  acessibilidade?: string;
  hidden?: boolean; // Estado 1: ocultar (cinza)
  deleted?: boolean; // Estado 2: excluído (vermelho)
}

const initialSegmentos: SegmentoOption[] = [
  { id: "hoteis", label: "Hotéis", checked: false },
  { id: "pousadas", label: "Pousadas", checked: false },
  { id: "resorts", label: "Resorts", checked: false },
  { id: "parques", label: "Parques Aquáticos", checked: false },
  { id: "restaurantes", label: "Restaurantes", checked: false },
  { id: "agencias", label: "Agências de Turismo", checked: false },
];

const metricasDisponiveis: MetricaOption[] = [
  { id: "ods", label: "Módulo ODS (Sustentabilidade)", checked: false, icon: Leaf },
  { id: "acessibilidade", label: "Acessibilidade PCD", checked: false, icon: Accessibility },
  { id: "issqn", label: "Receita ISSQN (Finanças)", checked: false, icon: DollarSign },
  { id: "diaria", label: "Diária Média", checked: false, icon: TrendingUp },
];

const feriadosOpcoes = [
  "Carnaval 2026",
  "Páscoa 2026",
  "Corpus Christi 2026",
  "Férias de Julho 2026",
  "Nossa Sra. Aparecida 2026",
  "Finados 2026",
  "Natal/Réveillon 2026",
];

// Dados mock para os resultados
const mockResultados: ResultRow[] = [
  { id: 1, estabelecimento: "Hotel Marupiara", segmento: "Hotéis", ocupacao: 87, visitantes: 342, diaria: 285, issqn: 12400, ods: "Certificado", acessibilidade: "Completa" },
  { id: 2, estabelecimento: "Pousada Brisa das Águas", segmento: "Pousadas", ocupacao: 92, visitantes: 156, diaria: 198, issqn: 8200, ods: "Em Processo", acessibilidade: "Parcial" },
  { id: 3, estabelecimento: "Resort Beira Rio", segmento: "Resorts", ocupacao: 78, visitantes: 521, diaria: 450, issqn: 28500, ods: "Certificado", acessibilidade: "Completa" },
  { id: 4, estabelecimento: "Thermas dos Laranjais", segmento: "Parques", ocupacao: 95, visitantes: 8500, diaria: 0, issqn: 142000, ods: "Certificado", acessibilidade: "Completa" },
  { id: 5, estabelecimento: "Hot Park", segmento: "Parques", ocupacao: 88, visitantes: 6200, diaria: 0, issqn: 98500, ods: "Em Processo", acessibilidade: "Completa" },
  { id: 6, estabelecimento: "Sabores do Cerrado", segmento: "Restaurantes", ocupacao: 0, visitantes: 425, diaria: 0, issqn: 18200, ods: "Não Certificado", acessibilidade: "Parcial" },
  { id: 7, estabelecimento: "Olímpia Tours", segmento: "Agências", ocupacao: 0, visitantes: 284, diaria: 0, issqn: 6800, ods: "Em Processo", acessibilidade: "Básica" },
  { id: 8, estabelecimento: "Hotel Thermas Palace", segmento: "Hotéis", ocupacao: 10000, visitantes: 12, diaria: 1850, issqn: 2100, ods: "Não Certificado", acessibilidade: "Nenhuma" }, // Dado absurdo intencional
];

export function CruzamentoDados() {
  // Estados para filtro temporal redesenhado
  const [agrupamento, setAgrupamento] = useState<AgrupamentoTemporal>("mes");
  const [dataDia, setDataDia] = useState("2026-05-18");
  const [mesSelecionado, setMesSelecionado] = useState("05");
  const [anoSelecionado, setAnoSelecionado] = useState("2026");
  const [calendarioMes, setCalendarioMes] = useState(5);
  const [calendarioAno, setCalendarioAno] = useState(2026);
  const [showCalendar, setShowCalendar] = useState(false);

  const [segmentos, setSegmentos] = useState<SegmentoOption[]>(initialSegmentos);
  const [metricas, setMetricas] = useState<MetricaOption[]>(metricasDisponiveis);
  const [resultados, setResultados] = useState<ResultRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  // Click outside calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSegmento = (id: string) => {
    setSegmentos((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const toggleMetrica = (id: string) => {
    setMetricas((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m))
    );
  };

  const selecionados = segmentos.filter((s) => s.checked);
  const metricasSelecionadas = metricas.filter((m) => m.checked);
  const canProcess = selecionados.length > 0;

  const processar = () => {
    if (!canProcess) return;
    setIsProcessing(true);

    setTimeout(() => {
      const segmentosSelecionadosLabels = selecionados.map((s) => s.label);
      const filtered = mockResultados.filter((r) =>
        segmentosSelecionadosLabels.some((label) => r.segmento.includes(label.split(" ")[0]))
      );
      setResultados(filtered);
      setIsProcessing(false);
    }, 1500);
  };

  // Toggle estado 1: ocultar linha (cinza)
  const toggleOcultar = (id: number) => {
    setResultados((prev) =>
      prev.map((r) => (r.id === id ? { ...r, hidden: !r.hidden, deleted: false } : r))
    );
  };

  // Toggle estado 2: excluir linha (vermelho)
  const toggleExcluir = (id: number) => {
    setResultados((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deleted: !r.deleted, hidden: false } : r))
    );
  };

  // Geração do calendário
  const getDiasDoMes = (mes: number, ano: number) => {
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const dias: (number | null)[] = [];
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }
    for (let dia = 1; dia <= diasNoMes; dia++) {
      dias.push(dia);
    }
    while (dias.length < 42) {
      dias.push(null);
    }
    return dias;
  };

  const selecionarDia = (dia: number) => {
    const novaData = `${calendarioAno}-${String(calendarioMes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    setDataDia(novaData);
    setShowCalendar(false);
  };

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const formatarDataExibicao = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const exportarPlanilha = () => {
    alert("Exportando para XLSX... (funcionalidade mock)");
  };

  const salvarBusca = () => {
    alert("Busca salva no Histórico e Anexos! (funcionalidade mock)");
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[#0c2340] flex items-center gap-2">
          <Database size={28} className="text-[#1a6fbf]" />
          Cruzamento de Dados
        </h1>
        <p className="text-[#64748b] text-sm mt-1">
          Configure filtros inteligentes, execute cruzamentos e apare dados discrepantes
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* ── PAINEL ESQUERDO: Filtros Inteligentes ──────────────── */}
        <div className="col-span-3 space-y-4">
          {/* Filtro Temporal Redesenhado */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-[#1a6fbf]" />
              <h3 className="text-[#0c2340] text-sm font-semibold">Filtro Temporal</h3>
            </div>

            {/* Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-[#f1f5f9] rounded-lg mb-3">
              <button
                onClick={() => setAgrupamento("dia")}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  agrupamento === "dia"
                    ? "bg-white text-[#1a6fbf] shadow-sm"
                    : "text-[#64748b] hover:text-[#334155]"
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setAgrupamento("mes")}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  agrupamento === "mes"
                    ? "bg-white text-[#1a6fbf] shadow-sm"
                    : "text-[#64748b] hover:text-[#334155]"
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setAgrupamento("ano")}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  agrupamento === "ano"
                    ? "bg-white text-[#1a6fbf] shadow-sm"
                    : "text-[#64748b] hover:text-[#334155]"
                }`}
              >
                Ano
              </button>
            </div>

            {/* Date Picker Dinâmico */}
            <div className="space-y-2">
              {agrupamento === "dia" && (
                <div className="relative" ref={calendarRef}>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white text-[#334155] text-left hover:border-[#1a6fbf] transition-colors flex items-center justify-between"
                  >
                    <span>{formatarDataExibicao(dataDia)}</span>
                    <Calendar size={14} className="text-[#94a3b8]" />
                  </button>

                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-xl p-4 z-50 w-72">
                      {/* Header do Calendário */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => {
                            if (calendarioMes === 1) {
                              setCalendarioMes(12);
                              setCalendarioAno(calendarioAno - 1);
                            } else {
                              setCalendarioMes(calendarioMes - 1);
                            }
                          }}
                          className="p-1 hover:bg-[#f1f5f9] rounded"
                        >
                          <span className="text-[#64748b]">‹</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0c2340]">
                            {mesesNomes[calendarioMes - 1]}
                          </span>
                          <select
                            value={calendarioAno}
                            onChange={(e) => setCalendarioAno(Number(e.target.value))}
                            className="text-sm font-semibold text-[#1a6fbf] bg-transparent border-b border-[#1a6fbf] border-dashed hover:border-solid focus:outline-none cursor-pointer"
                          >
                            {Array.from({ length: 10 }, (_, i) => 2022 + i).map((ano) => (
                              <option key={ano} value={ano}>
                                {ano}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => {
                            if (calendarioMes === 12) {
                              setCalendarioMes(1);
                              setCalendarioAno(calendarioAno + 1);
                            } else {
                              setCalendarioMes(calendarioMes + 1);
                            }
                          }}
                          className="p-1 hover:bg-[#f1f5f9] rounded"
                        >
                          <span className="text-[#64748b]">›</span>
                        </button>
                      </div>

                      {/* Quick Year Navigation */}
                      <div className="flex items-center justify-center gap-3 mb-3 text-xs">
                        <button
                          onClick={() => setCalendarioAno(calendarioAno - 1)}
                          className="px-2 py-1 text-[#64748b] hover:text-[#1a6fbf] hover:bg-[#f1f5f9] rounded transition-colors"
                        >
                          ‹ {calendarioAno - 1}
                        </button>
                        <button
                          onClick={() => setCalendarioAno(calendarioAno + 1)}
                          className="px-2 py-1 text-[#64748b] hover:text-[#1a6fbf] hover:bg-[#f1f5f9] rounded transition-colors"
                        >
                          {calendarioAno + 1} ›
                        </button>
                      </div>

                      {/* Grade de Dias */}
                      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                        {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
                          <div key={i} className="text-[#94a3b8] font-medium py-1">
                            {dia}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {getDiasDoMes(calendarioMes, calendarioAno).map((dia, idx) => {
                          if (dia === null) {
                            return <div key={`empty-${idx}`} />;
                          }

                          const dataCompleta = `${calendarioAno}-${String(calendarioMes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                          const isHoje = dataCompleta === "2026-05-18";
                          const isSelecionado = dataCompleta === dataDia;

                          return (
                            <button
                              key={dia}
                              onClick={() => selecionarDia(dia)}
                              className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-colors ${
                                isSelecionado
                                  ? "bg-[#1a6fbf] text-white font-semibold"
                                  : isHoje
                                  ? "bg-[#dbeafe] text-[#1a6fbf] font-medium"
                                  : "text-[#334155] hover:bg-[#f1f5f9]"
                              }`}
                            >
                              {dia}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {agrupamento === "mes" && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-[#e2e8f0] rounded-lg bg-white text-[#334155]"
                  >
                    {mesesNomes.map((m, i) => (
                      <option key={m} value={String(i + 1).padStart(2, "0")}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-[#e2e8f0] rounded-lg bg-white text-[#334155]"
                  >
                    {Array.from({ length: 10 }, (_, i) => 2022 + i).map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {agrupamento === "ano" && (
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white text-[#334155]"
                >
                  {Array.from({ length: 10 }, (_, i) => 2022 + i).map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Segmentos */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-[#1a6fbf]" />
              <h3 className="text-[#0c2340] text-sm font-semibold">Segmentos</h3>
            </div>

            <div className="space-y-1.5">
              {segmentos.map((seg) => (
                <label
                  key={seg.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#f8fafc] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={seg.checked}
                    onChange={() => toggleSegmento(seg.id)}
                    className="accent-[#1a6fbf]"
                  />
                  <span className="text-xs text-[#334155]">{seg.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Bases e Métricas a Cruzar */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-[#1a6fbf]" />
              <h3 className="text-[#0c2340] text-sm font-semibold">Métricas a Cruzar</h3>
            </div>

            <div className="space-y-1.5">
              {metricas.map((metrica) => {
                const Icon = metrica.icon;
                return (
                  <label
                    key={metrica.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#f8fafc] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={metrica.checked}
                      onChange={() => toggleMetrica(metrica.id)}
                      className="accent-[#1a6fbf]"
                    />
                    <Icon size={12} className="text-[#64748b]" />
                    <span className="text-xs text-[#334155]">{metrica.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Botão Gerar */}
          <button
            onClick={processar}
            disabled={!canProcess || isProcessing}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold transition-all shadow-md ${
              canProcess && !isProcessing
                ? "bg-[#1a6fbf] hover:bg-[#1560a8] hover:shadow-lg"
                : "bg-[#cbd5e1] cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play size={18} />
                Gerar Cruzamento
              </>
            )}
          </button>
        </div>

        {/* ── ÁREA CENTRAL: Resultados e Apara de Arestas ────────── */}
        <div className="col-span-9 space-y-4">
          {/* Ações Globais */}
          {resultados.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="text-sm text-[#334155] font-medium">
                  {resultados.length} registro(s) encontrado(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportarPlanilha}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg shadow-sm transition-colors"
                >
                  <FileSpreadsheet size={16} />
                  Exportar XLSX/CSV
                </button>
                <button
                  onClick={salvarBusca}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a6fbf] hover:bg-[#1560a8] text-white text-sm rounded-lg shadow-sm transition-colors"
                >
                  <Save size={16} />
                  Salvar Busca
                </button>
              </div>
            </div>
          )}

          {/* Tabela Dinâmica */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            {!isProcessing && resultados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Database size={48} className="text-[#cbd5e1] mb-4" />
                <p className="text-[#64748b] text-sm font-medium">
                  Nenhum cruzamento gerado ainda
                </p>
                <p className="text-[#94a3b8] text-xs mt-1">
                  Configure os filtros à esquerda e clique em "Gerar Cruzamento"
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-16 h-16 border-4 border-[#1a6fbf] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-[#334155] font-medium">
                  Cruzando dados do inventário...
                </p>
              </div>
            )}

            {!isProcessing && resultados.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                        Estabelecimento
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                        Segmento
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                        Ocupação %
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                        Visitantes
                      </th>
                      {metricasSelecionadas.find((m) => m.id === "diaria") && (
                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                          Diária Média
                        </th>
                      )}
                      {metricasSelecionadas.find((m) => m.id === "issqn") && (
                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                          ISSQN (R$)
                        </th>
                      )}
                      {metricasSelecionadas.find((m) => m.id === "ods") && (
                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                          ODS
                        </th>
                      )}
                      {metricasSelecionadas.find((m) => m.id === "acessibilidade") && (
                        <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                          Acessibilidade
                        </th>
                      )}
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                        Apara de Arestas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((row) => {
                      // Detecta dados absurdos
                      const isAbsurd = (row.ocupacao && row.ocupacao > 100) || false;

                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-[#f1f5f9] transition-all ${
                            row.deleted
                              ? "opacity-40 bg-red-50"
                              : row.hidden
                              ? "opacity-40"
                              : isAbsurd
                              ? "bg-red-50 hover:bg-red-100"
                              : "hover:bg-[#f8fafc]"
                          }`}
                        >
                          <td className={`px-4 py-3 text-sm text-[#0c2340] font-medium ${row.hidden || row.deleted ? "line-through" : ""}`}>
                            {row.estabelecimento}
                          </td>
                          <td className={`px-4 py-3 text-sm text-[#64748b] ${row.hidden || row.deleted ? "line-through" : ""}`}>
                            {row.segmento}
                          </td>
                          <td className={`px-4 py-3 text-sm text-center ${row.hidden || row.deleted ? "line-through" : ""}`}>
                            {row.ocupacao !== undefined ? (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isAbsurd
                                    ? "bg-red-100 text-red-700"
                                    : row.ocupacao >= 80
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {row.ocupacao}%
                              </span>
                            ) : (
                              <span className="text-[#cbd5e1]">—</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm text-[#334155] text-center ${row.hidden || row.deleted ? "line-through" : ""}`}>
                            {row.visitantes?.toLocaleString("pt-BR")}
                          </td>
                          {metricasSelecionadas.find((m) => m.id === "diaria") && (
                            <td className={`px-4 py-3 text-sm text-[#334155] text-center ${row.hidden || row.deleted ? "line-through" : ""}`}>
                              {row.diaria ? `R$ ${row.diaria}` : <span className="text-[#cbd5e1]">—</span>}
                            </td>
                          )}
                          {metricasSelecionadas.find((m) => m.id === "issqn") && (
                            <td className={`px-4 py-3 text-sm text-[#334155] text-center ${row.hidden || row.deleted ? "line-through" : ""}`}>
                              {row.issqn ? `R$ ${row.issqn.toLocaleString("pt-BR")}` : <span className="text-[#cbd5e1]">—</span>}
                            </td>
                          )}
                          {metricasSelecionadas.find((m) => m.id === "ods") && (
                            <td className={`px-4 py-3 text-xs text-center ${row.hidden || row.deleted ? "line-through" : ""}`}>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full ${
                                  row.ods === "Certificado"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : row.ods === "Em Processo"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {row.ods}
                              </span>
                            </td>
                          )}
                          {metricasSelecionadas.find((m) => m.id === "acessibilidade") && (
                            <td className={`px-4 py-3 text-xs text-center ${row.hidden || row.deleted ? "line-through" : ""}`}>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full ${
                                  row.acessibilidade === "Completa"
                                    ? "bg-blue-100 text-blue-700"
                                    : row.acessibilidade === "Parcial"
                                    ? "bg-violet-100 text-violet-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {row.acessibilidade}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => toggleExcluir(row.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  row.deleted
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-red-400 hover:bg-red-50 hover:text-red-600"
                                }`}
                                title={row.deleted ? "Restaurar linha excluída" : "Excluir linha"}
                              >
                                {row.deleted ? <Undo2 size={14} /> : <Trash2 size={14} />}
                              </button>
                              <button
                                onClick={() => toggleOcultar(row.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  row.hidden
                                    ? "text-[#1a6fbf] hover:bg-blue-50"
                                    : "text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
                                }`}
                                title={row.hidden ? "Restaurar linha oculta" : "Ocultar da visualização"}
                              >
                                {row.hidden ? <Undo2 size={14} /> : <EyeOff size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dica sobre Apara de Arestas */}
          {resultados.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Apara de Arestas — UX Aprimorada
                </p>
                <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                  <strong>Ocultar:</strong> Clique no ícone de olho para ocultar temporariamente uma linha (opacidade reduzida, texto tachado, fundo cinza). Clique no ícone de desfazer para restaurar.
                  <br />
                  <strong>Excluir:</strong> Clique na lixeira para marcar como excluída (opacidade reduzida, texto tachado, fundo vermelho claro). Clique no ícone de desfazer para restaurar.
                  <br />
                  Ambas as ações permitem restauração rápida dos dados. Linhas destacadas em vermelho indicam anomalias detectadas automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
