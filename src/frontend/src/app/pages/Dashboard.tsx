import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import {
  Building2, BedDouble, Shield, Users, TrendingUp,
  Calendar, ChevronDown, CheckCircle2, AlertTriangle,
  Home, Layers, Leaf, Accessibility, Zap, Recycle,
  Briefcase, Database, Clock, Hotel, KeyRound,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Estado atual (presente) ──────────────────────────────────────────────────

const DADOS_ATUAIS = {
  banco: { totalEntidades: 0, totalEmpresas: 0, ultimaAtualizacao: "—" },
  maoDeObra: { total: 0, fixos: 0, temporarios: 0, trend: "Sem dados" },
  cadastur: { totalEmpresas: 0, totalCadastur: 0, percentual: 0, trend: "Sem dados" },
  statusEntidades: { ativos: 0, inativos: 0 },
  infra: {
    meiosHospedagem: 0, totalLeitos: 0, totalUHs: 0,
    imoveisTemporada: 0, meiosIrregulares: 0, uhsIrregulares: 0,
    totalGeralUHs: 0, totalGeralLeitos: 0, estimativaLeiosConstrucao: 0,
  },
  ods: [
    { titulo: "Eixo Acessibilidade", subtitulo: "ODS 10 & 11", cor: "#1a6fbf", percent: 0,
      data: [{ name: "Com PCD", value: 0, color: "#1a6fbf" }, { name: "Sem PCD", value: 0, color: "#e2e8f0" }] },
    { titulo: "Eixo Sustentabilidade", subtitulo: "ODS 12 & 13", cor: "#16a34a", percent: 0,
      data: [{ name: "Com Selo", value: 0, color: "#16a34a" }, { name: "Sem Selo", value: 0, color: "#e2e8f0" }] },
    { titulo: "Eixo Energia Limpa", subtitulo: "ODS 7", cor: "#f59e0b", percent: 0,
      data: [{ name: "Renováveis", value: 0, color: "#f59e0b" }, { name: "Convencional", value: 0, color: "#e2e8f0" }] },
    { titulo: "Eixo Resíduos", subtitulo: "ODS 12", cor: "#8b5cf6", percent: 0,
      data: [{ name: "Com Plano", value: 0, color: "#8b5cf6" }, { name: "Sem Plano", value: 0, color: "#e2e8f0" }] },
  ],
};

// ─── Componente de Donut pequeno para CADASTUR ─────────────────────────────────

function MiniDonut({ percent, color }: { percent: number; color: string }) {
  const data = [
    { value: percent, color },
    { value: 100 - percent, color: "#e2e8f0" },
  ];
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={30}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color }}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

// ─── Componente de Donut ODS ──────────────────────────────────────────────────

function OdsDonut({
  titulo, subtitulo, cor, data, percent,
}: (typeof ODS_DATA)[number]) {
  return (
    <div className="flex-1 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col items-center text-center min-w-0">
      <p className="text-xs font-semibold text-[#0c2340] leading-tight mb-0.5">{titulo}</p>
      <p className="text-[10px] text-[#94a3b8] mb-3">{subtitulo}</p>

      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={52}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }}
              formatter={(v: number) => [`${v} estabelecimentos`]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color: cor }}>{percent}%</span>
          <span className="text-[9px] text-[#94a3b8]">adequação</span>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 w-full">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] text-[#64748b]">{d.name}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#334155]">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user, isLoading } = useAuth();

  // 1. Criamos um estado para guardar os dados reais
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // 2. Quando a tela abre, pedimos os dados à API
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await apiService.getDashboardResumo();
        setDashboardData(data); // Guarda os dados reais no estado!
      } catch (error) {
        console.error("Backend inacessível. Usando estado vazio.", error);
        setDashboardData(DADOS_ATUAIS);
      } finally {
        setLoadingData(false); // Esconde a ampulheta
      }
    };

    // Só pede os dados se o utilizador já tiver passado pelo AuthContext
    if (!isLoading && user) {
      fetchDashboard();
    }
  }, [user, isLoading]);

  // 3. Ecrãs de Carregamento (Loading States)
  if (isLoading) {
    return <div className="p-10 text-[#64748b]">Verificando acessos...</div>;
  }

  if (loadingData) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-4 mt-20">
        <div className="w-8 h-8 border-4 border-[#1a6fbf] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#64748b] font-medium animate-pulse">Carregando estatísticas ao vivo de Olímpia...</p>
      </div>
    );
  }

  if (!user) return null;

  // 4. A MÁGICA: Em vez de usar DADOS_ATUAIS estáticos, usamos o estado 'dashboardData'
  const snap = dashboardData;

  return (
    <div className="p-6 space-y-6">

      {/* ══════════════════════════════════════════════════════════
          BLOCO 0 — Cabeçalho de página
      ══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[#0c2340]">Dashboard Inicial</h1>
          <p className="text-[#64748b] text-sm mt-1">
            Visão consolidada do Inventário Turístico de Olímpia — SP
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-[#1a6fbf]">
            Atualizado em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BLOCO 1 — Status do Banco + Mão de Obra em destaque
      ══════════════════════════════════════════════════════════ */}

      {/* Banner de Status do Banco */}
      <div className="flex items-center gap-4 bg-[#0c2340] rounded-xl px-6 py-4 shadow-md">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium">Total de Entidades no Banco</p>
            <p className="text-white text-2xl font-bold leading-none mt-0.5">
              {snap.banco.totalEntidades.toLocaleString("pt-BR")}
              <span className="text-sm font-normal text-white/60 ml-2">registros</span>
            </p>
          </div>
        </div>

        <div className="w-px h-10 bg-white/20" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium">Última Atualização do Banco</p>
            <p className="text-white text-sm font-semibold mt-0.5">{snap.banco.ultimaAtualizacao}</p>
          </div>
        </div>

        <div className="w-px h-10 bg-white/20" />

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300 text-xs font-medium">Banco Ativo</span>
        </div>
      </div>

      {/* Widget Mão de Obra — destaque principal */}
      <div className="bg-gradient-to-br from-[#1a6fbf] to-[#0c2340] rounded-xl p-6 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-white/70" />
              <p className="text-white/70 text-sm font-medium">Total Mão de Obra Direta — Setor de Turismo</p>
            </div>
            <p className="text-5xl font-bold text-white leading-none">
              {snap.maoDeObra.total.toLocaleString("pt-BR")}
            </p>
            <p className="text-white/50 text-xs mt-2">
              empregos diretos no trade turístico
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/30 px-3 py-1.5 rounded-full">
            <TrendingUp size={13} className="text-emerald-300" />
            <span className="text-emerald-300 text-xs font-semibold">{snap.maoDeObra.trend}</span>
          </div>
        </div>

        {/* Subdivisão Fixos / Temporários */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={14} className="text-white/60" />
              <span className="text-white/60 text-xs font-medium">Funcionários Fixos</span>
            </div>
            <p className="text-3xl font-bold text-white leading-none">{snap.maoDeObra.fixos.toLocaleString("pt-BR")}</p>
            <p className="text-white/40 text-[10px] mt-1">
              {Math.round((snap.maoDeObra.fixos / snap.maoDeObra.total) * 100)}% do total
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-white/60" />
              <span className="text-white/60 text-xs font-medium">Funcionários Temporários</span>
            </div>
            <p className="text-3xl font-bold text-white leading-none">{snap.maoDeObra.temporarios.toLocaleString("pt-BR")}</p>
            <p className="text-white/40 text-[10px] mt-1">
              {Math.round((snap.maoDeObra.temporarios / snap.maoDeObra.total) * 100)}% do total
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BLOCO 2 — Consolidado CADASTUR
      ══════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-[#1a6fbf]" />
          <h2 className="text-[#0c2340]">Consolidado CADASTUR</h2>
          <span className="ml-2 text-xs text-[#94a3b8] font-normal">Indicadores de regularidade legal</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Total de Empresas */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-[#1a6fbf]" />
            </div>
            <div>
              <p className="text-[#64748b] text-xs font-medium">Total de Estabelecimentos</p>
              <p className="text-4xl font-bold text-[#0c2340] leading-none mt-1">
                {snap.cadastur.totalEmpresas.toLocaleString("pt-BR")}
              </p>
              <p className="text-[#94a3b8] text-xs mt-1">Entidades empresariais</p>
            </div>
          </div>

          {/* Total CADASTUR */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={24} className="text-violet-600" />
            </div>
            <div>
              <p className="text-[#64748b] text-xs font-medium">Total com CADASTUR</p>
              <p className="text-4xl font-bold text-[#0c2340] leading-none mt-1">
                {snap.cadastur.totalCadastur.toLocaleString("pt-BR")}
              </p>
              <p className="text-[#94a3b8] text-xs mt-1">Empresas regularizadas</p>
            </div>
          </div>

          {/* % Regularização com Donut */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex items-center gap-4">
            <MiniDonut percent={snap.cadastur.percentual} color="#8b5cf6" />
            <div>
              <p className="text-[#64748b] text-xs font-medium">% de Regularização</p>
              <p className="text-4xl font-bold text-[#0c2340] leading-none mt-1">{snap.cadastur.percentual}%</p>
              <p className="text-emerald-600 text-xs mt-1 font-medium">{snap.cadastur.trend}</p>
            </div>
          </div>

          {/* Ativo / Inativo — novo campo de status global */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
            <p className="text-[#64748b] text-xs font-medium mb-3">Status das Entidades</p>
            <MiniDonut
              percent={snap.banco.totalEntidades > 0 ? Math.round((snap.statusEntidades.ativos / snap.banco.totalEntidades) * 100) : 0}
              color="#16a34a"
            />
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[11px] text-[#64748b]">Ativos</span>
                </div>
                <span className="text-sm font-bold text-[#0c2340]">{snap.statusEntidades.ativos}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#e2e8f0] flex-shrink-0" />
                  <span className="text-[11px] text-[#64748b]">Inativos</span>
                </div>
                <span className="text-sm font-bold text-[#94a3b8]">{snap.statusEntidades.inativos}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BLOCO 3 — Infraestrutura Turística
      ══════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Hotel size={18} className="text-[#1a6fbf]" />
          <h2 className="text-[#0c2340]">Infraestrutura Turística</h2>
          <span className="ml-2 text-xs text-[#94a3b8] font-normal">Dados consolidados de capacidade instalada</span>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: "Meios de Hospedagem", value: snap.infra.meiosHospedagem, icon: Hotel, color: "text-[#1a6fbf]", bg: "bg-blue-50", suffix: "estabelecimentos" },
            { label: "Total de Leitos", value: snap.infra.totalLeitos.toLocaleString("pt-BR"), icon: BedDouble, color: "text-emerald-600", bg: "bg-emerald-50", suffix: "leitos ativos" },
            { label: "Total de UHs", value: snap.infra.totalUHs.toLocaleString("pt-BR"), icon: KeyRound, color: "text-amber-600", bg: "bg-amber-50", suffix: "unidades habitacionais" },
            { label: "Imóveis p/ Temporada (RHC)", value: snap.infra.imoveisTemporada.toLocaleString("pt-BR"), icon: Home, color: "text-violet-600", bg: "bg-violet-50", suffix: "imóveis registrados" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon size={20} className={item.color} />
                </div>
                <p className="text-[#64748b] text-xs font-medium leading-tight mb-1">{item.label}</p>
                <p className="text-3xl font-bold text-[#0c2340] leading-none">{item.value}</p>
                <p className="text-[#94a3b8] text-[10px] mt-1">{item.suffix}</p>
              </div>
            );
          })}
        </div>

        {/* Subgrupo — Irregulares (fundo alerta) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: "Meios de Hospedagem Irregular", value: snap.infra.meiosIrregulares, icon: AlertTriangle, desc: "sem licença ou CADASTUR" },
            { label: "Total de UHs Irregulares", value: snap.infra.uhsIrregulares.toLocaleString("pt-BR"), icon: Layers, desc: "unidades em situação irregular" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-[#fef3c7] rounded-xl border border-amber-200 p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-700 text-xs font-medium">{item.label}</p>
                  <p className="text-3xl font-bold text-amber-800 leading-none mt-1">{item.value}</p>
                  <p className="text-amber-500 text-[10px] mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Painel de totais e estimativas — tipografia grande */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Geral de UHs", value: snap.infra.totalGeralUHs.toLocaleString("pt-BR"), icon: KeyRound, color: "text-[#1a6fbf]", desc: "incluindo temporada" },
            { label: "Total Geral de Leitos", value: snap.infra.totalGeralLeitos.toLocaleString("pt-BR"), icon: BedDouble, color: "text-emerald-600", desc: "capacidade total instalada" },
            { label: "Estimativa Leitos em Construção", value: snap.infra.estimativaLeiosConstrucao.toLocaleString("pt-BR"), icon: TrendingUp, color: "text-violet-600", desc: "sem indicador cadastrado" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white rounded-xl border-2 border-[#e2e8f0] p-6 shadow-sm text-center">
                <Icon size={28} className={`${item.color} mx-auto mb-3`} />
                <p className="text-[#64748b] text-sm font-medium mb-2">{item.label}</p>
                <p className="text-5xl font-bold text-[#0c2340] leading-none">{item.value}</p>
                <p className="text-[#94a3b8] text-xs mt-2">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BLOCO 4 — Módulo ODS - Agenda 2030
      ══════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={18} className="text-emerald-600" />
          <h2 className="text-[#0c2340]">Desempenho Módulo ODS</h2>
          <span className="ml-2 text-xs text-[#94a3b8] font-normal">Agenda 2030 — Sustentabilidade e Responsabilidade</span>
        </div>

        <div className="flex gap-4">
          {snap.ods.map((ods) => (
            <OdsDonut key={ods.titulo} {...ods} />
          ))}
        </div>

        {/* Rodapé informativo */}
        <div className="mt-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Accessibility size={16} className="text-[#1a6fbf]" />
            <span className="text-xs text-[#64748b]">ODS 10 & 11 — Redução das Desigualdades e Cidades Sustentáveis</span>
          </div>
          <div className="w-px h-4 bg-[#e2e8f0]" />
          <div className="flex items-center gap-2">
            <Recycle size={16} className="text-emerald-600" />
            <span className="text-xs text-[#64748b]">ODS 12 — Consumo e Produção Responsáveis</span>
          </div>
          <div className="w-px h-4 bg-[#e2e8f0]" />
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <span className="text-xs text-[#64748b]">ODS 7 — Energia Limpa e Acessível</span>
          </div>
        </div>
      </div>

    </div>
  );
}
