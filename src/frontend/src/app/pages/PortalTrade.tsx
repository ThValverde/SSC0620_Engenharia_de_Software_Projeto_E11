import { useState } from "react";
import {
  Store, Shield, BedDouble, Sparkles, AlertTriangle,
  CheckCircle2, Mail, Clock, Search, UserCog, Building2,
  ArrowRight, X, Edit, Key, UserPlus, RotateCcw, Lock,
  Pause, XCircle, Calendar, Eye, EyeOff, LogIn, RefreshCw,
  Users, Globe, Instagram, Facebook, Leaf,
} from "lucide-react";

type View = "login" | "empresario" | "secretaria";
type ModalType = "leitos" | "infra" | "encerramento" | "senha" | "editUser" | "addUser" | "resetSenha" | "funcionarios" | "cadastrais";

interface TradeUser {
  id: number;
  estabelecimento: string;
  email: string;
  nivel: "Proprietário" | "Gerente" | "Operacional";
  ultimoAcesso: string;
  ativo: boolean;
}

const initialUsers: TradeUser[] = [
  { id: 1, estabelecimento: "Hotel Marupiara", email: "joao@marupiara.com.br", nivel: "Proprietário", ultimoAcesso: "Hoje, 09:42", ativo: true },
  { id: 2, estabelecimento: "Pousada Brisa das Águas", email: "maria@brisaaguas.com.br", nivel: "Proprietário", ultimoAcesso: "Ontem, 18:21", ativo: true },
  { id: 3, estabelecimento: "Resort Beira Rio", email: "gerencia@beirario.com.br", nivel: "Gerente", ultimoAcesso: "08/05/2026", ativo: true },
  { id: 4, estabelecimento: "Thermas dos Laranjais", email: "cadastro@thermas.com.br", nivel: "Operacional", ultimoAcesso: "05/05/2026", ativo: true },
  { id: 5, estabelecimento: "Hot Park", email: "diretoria@hotpark.com.br", nivel: "Proprietário", ultimoAcesso: "02/05/2026", ativo: false },
  { id: 6, estabelecimento: "Olímpia Tours", email: "contato@olimpiatours.com.br", nivel: "Gerente", ultimoAcesso: "29/04/2026", ativo: true },
  { id: 7, estabelecimento: "Sabores do Cerrado", email: "ana@cerrado.com.br", nivel: "Proprietário", ultimoAcesso: "—", ativo: false },
  { id: 8, estabelecimento: "Silva Turismo", email: "silva@silvaturismo.com.br", nivel: "Operacional", ultimoAcesso: "20/04/2026", ativo: true },
];

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-4">
      <CheckCircle2 size={18} className="flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 text-white/70 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Portal raiz ──────────────────────────────────────────────────────────────

export function PortalTrade() {
  const [view, setView] = useState<View>("login");

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0c2340]">Portal do Trade</h1>
          <p className="text-[#64748b] text-sm mt-0.5">
            Área dedicada ao empresariado turístico de Olímpia
          </p>
        </div>
        <div className="inline-flex bg-white border border-[#e2e8f0] rounded-lg p-1 shadow-sm">
          {(["login", "empresario", "secretaria"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all ${
                view === v ? "bg-[#1a6fbf] text-white shadow-sm" : "text-[#64748b] hover:text-[#334155]"
              }`}
            >
              {v === "login" && <LogIn size={14} />}
              {v === "empresario" && <Store size={14} />}
              {v === "secretaria" && <Shield size={14} />}
              {v === "login" ? "Login Externo" : v === "empresario" ? "Visão do Empresário" : "Visão da Secretaria"}
            </button>
          ))}
        </div>
      </div>

      {view === "login" && <LoginView onLogin={() => setView("empresario")} />}
      {view === "empresario" && <EmpresarioView />}
      {view === "secretaria" && <SecretariaView users={initialUsers} />}
    </div>
  );
}

// ─── LOGIN EXTERNO ────────────────────────────────────────────────────────────

function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  return (
    <div className="flex items-start justify-center gap-10 pt-4">
      {/* Card de Login */}
      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="bg-gradient-to-br from-[#0c2340] to-[#1a6fbf] rounded-2xl p-6 mb-6 text-white text-center shadow-lg">
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Store size={28} />
          </div>
          <h2 className="text-white text-lg">Portal do Trade Turístico</h2>
          <p className="text-white/70 text-xs mt-1">Secretaria de Turismo — Olímpia/SP</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-[#0c2340] mb-1">Entrar na sua conta</h3>
            <p className="text-[#94a3b8] text-xs">Acesse para gerenciar os dados do seu estabelecimento.</p>
          </div>

          <Field label="E-mail cadastrado">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
              />
            </div>
          </Field>

          <Field label="Senha">
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-[#1a6fbf] hover:underline font-medium"
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#1a6fbf] hover:bg-[#1560a8] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <LogIn size={15} />
            Entrar
          </button>

          <p className="text-center text-xs text-[#94a3b8]">
            Problemas de acesso? Contate a Secretaria de Turismo.
          </p>
        </div>
      </div>

      {/* Modal Esqueci Minha Senha */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
              <h3 className="text-[#0c2340]">Redefinir Senha</h3>
              <button onClick={() => { setForgotOpen(false); setForgotSent(false); setForgotEmail(""); }} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {forgotSent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0c2340]">Link enviado!</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      Verifique a caixa de entrada de <strong>{forgotEmail}</strong>. O link expira em 30 minutos.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#64748b]">
                    Digite o e-mail cadastrado e enviaremos um link de redefinição automática, sem necessidade de intervenção da Secretaria.
                  </p>
                  <Field label="E-mail cadastrado">
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu@email.com.br"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                      />
                    </div>
                  </Field>
                </>
              )}
            </div>
            {!forgotSent && (
              <div className="flex justify-end gap-3 p-5 border-t border-[#e2e8f0]">
                <button onClick={() => setForgotOpen(false)} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc]">
                  Cancelar
                </button>
                <button
                  onClick={() => setForgotSent(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1a6fbf] hover:bg-[#1560a8] text-white rounded-lg"
                >
                  <RefreshCw size={14} />
                  Enviar link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EMPRESÁRIO ───────────────────────────────────────────────────────────────

type LogEntry = { date: string; desc: string };

function EmpresarioView() {
  const [modalKey, setModalKey] = useState<ModalType | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([
    { date: "12/04/2026", desc: "Leitos atualizados de 56 para 58" },
    { date: "03/02/2026", desc: "Wi-Fi Cortesia adicionado à infraestrutura" },
    { date: "18/11/2025", desc: "Telefone de contato atualizado" },
  ]);

  const handleSaved = (msg: string, logDesc?: string) => {
    setModalKey(null);
    setToast(msg);
    if (logDesc) {
      const now = new Date().toLocaleDateString("pt-BR");
      setLog((prev) => [{ date: now, desc: logDesc }, ...prev]);
    }
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0c2340] to-[#1a6fbf] rounded-xl p-6 text-white shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <Store size={26} />
          </div>
          <div className="flex-1">
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Bem-vindo(a)</p>
            <h2 className="text-white text-xl">Olá, Pousada Brisa das Águas</h2>
            <p className="text-white/80 text-sm mt-1">
              Gerencie diretamente as informações do seu estabelecimento. Todas as alterações são aplicadas imediatamente ao inventário turístico.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-white/60 text-xs">Última atualização</p>
            <p className="text-white text-sm font-medium">12/04/2026</p>
          </div>
        </div>
      </div>

      {/* Meu Inventário */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-[#1a6fbf]" />
            <h3 className="text-[#0c2340]">Meu Inventário</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalKey("cadastrais")}
              className="inline-flex items-center gap-1.5 text-xs text-[#1a6fbf] border border-[#1a6fbf] px-2.5 py-1 rounded-full hover:bg-blue-50 transition-colors"
            >
              <Edit size={11} />
              Editar dados
            </button>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={11} />
              Cadastro Ativo
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCell label="CNPJ" value="06.789.012/0001-34" mono />
          <InfoCell label="Segmento" value="Meio de Hospedagem" />
          <InfoCell label="Quartos (UHs)" value="24" />
          <InfoCell label="Leitos" value="58" />
          <InfoCell label="Categoria" value="Pousada" />
          <InfoCell label="Telefone" value="(17) 3279-1234" />
          <InfoCell label="E-mail" value="maria@brisaaguas.com.br" />
          <InfoCell label="Acessibilidade" value="Parcial" />
        </div>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h3 className="text-[#0c2340] mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            color="bg-blue-50 border-blue-200 hover:bg-blue-100"
            iconBg="bg-[#1a6fbf]"
            icon={<BedDouble size={22} className="text-white" />}
            title="Atualizar Leitos e Quartos"
            desc="Atualize a capacidade do seu meio de hospedagem diretamente no inventário."
            onClick={() => setModalKey("leitos")}
          />
          <ActionCard
            color="bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            iconBg="bg-emerald-600"
            icon={<Sparkles size={22} className="text-white" />}
            title="Infraestrutura, Acessibilidade e ODS"
            desc="Gerencie equipamentos, áreas comuns, itens de acessibilidade e práticas de sustentabilidade do seu espaço."
            onClick={() => setModalKey("infra")}
          />
          <ActionCard
            color="bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
            iconBg="bg-cyan-600"
            icon={<Users size={22} className="text-white" />}
            title="Quadro de Funcionários"
            desc="Atualize a flutuação da sua equipe informando a quantidade de colaboradores fixos e temporários."
            onClick={() => setModalKey("funcionarios")}
          />
          <ActionCard
            color="bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
            iconBg="bg-indigo-600"
            icon={<Globe size={22} className="text-white" />}
            title="Dados Cadastrais e Redes Sociais"
            desc="Atualize telefone, e-mail e links de Instagram, Facebook e Site do seu estabelecimento."
            onClick={() => setModalKey("cadastrais")}
          />
          <ActionCard
            color="bg-violet-50 border-violet-200 hover:bg-violet-100"
            iconBg="bg-violet-600"
            icon={<Key size={22} className="text-white" />}
            title="Alterar Senha"
            desc="Redefina sua senha de acesso ao portal de forma autônoma, sem precisar da Secretaria."
            onClick={() => setModalKey("senha")}
          />
          <ActionCard
            color="bg-amber-50 border-amber-200 hover:bg-amber-100"
            iconBg="bg-amber-500"
            icon={<Pause size={22} className="text-white" />}
            title="Suspensão ou Encerramento"
            desc="Informe suspensão temporária (reforma) ou encerramento permanente das atividades."
            onClick={() => setModalKey("encerramento")}
          />
        </div>
      </div>

      {/* Log de Atividades */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
        <h3 className="text-[#0c2340] mb-4">Log de Atividades</h3>
        <div className="space-y-2">
          {log.map((h, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#f1f5f9] last:border-0">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-[#94a3b8] w-28 flex-shrink-0">{h.date}</span>
              <span className="text-sm text-[#334155] flex-1">{h.desc}</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                Aplicado
              </span>
            </div>
          ))}
        </div>
      </div>

      {modalKey && (
        <ModalContent
          type={modalKey}
          onClose={() => setModalKey(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[#94a3b8] mb-0.5">{label}</p>
      <p className={`text-sm text-[#0c2340] font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ActionCard({
  color, iconBg, icon, title, desc, onClick,
}: {
  color: string; iconBg: string; icon: React.ReactNode;
  title: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border-2 p-5 transition-all group ${color}`}
    >
      <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center mb-3 shadow-sm`}>
        {icon}
      </div>
      <h4 className="text-[#0c2340] mb-1.5">{title}</h4>
      <p className="text-xs text-[#64748b] mb-3 leading-relaxed">{desc}</p>
      <div className="inline-flex items-center gap-1 text-xs text-[#1a6fbf] font-semibold group-hover:gap-2 transition-all">
        Atualizar agora <ArrowRight size={12} />
      </div>
    </button>
  );
}

// ─── SECRETARIA ───────────────────────────────────────────────────────────────

function SecretariaView({ users }: { users: TradeUser[] }) {
  const [list, setList] = useState(users);
  const [search, setSearch] = useState("");
  const [filterNivel, setFilterNivel] = useState("Todos");
  const [modalKey, setModalKey] = useState<{ type: ModalType; user?: TradeUser } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toggle = (id: number) =>
    setList((prev) => prev.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u)));

  const updateUser = (updatedUser: TradeUser) =>
    setList((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

  const addUser = (newUser: Omit<TradeUser, "id">) =>
    setList((prev) => [...prev, { ...newUser, id: Date.now() }]);

  const filtered = list.filter((u) => {
    const m = u.estabelecimento.toLowerCase().includes(search.toLowerCase()) ||
              u.email.toLowerCase().includes(search.toLowerCase());
    const n = filterNivel === "Todos" || u.nivel === filterNivel;
    return m && n;
  });

  const ativos = list.filter((u) => u.ativo).length;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon={<UserCog size={18} className="text-white" />} bg="bg-[#1a6fbf]" label="Total de Usuários" value={list.length} />
        <KpiCard icon={<CheckCircle2 size={18} className="text-white" />} bg="bg-emerald-500" label="Acesso Liberado" value={ativos} />
        <KpiCard icon={<Shield size={18} className="text-white" />} bg="bg-red-500" label="Bloqueados" value={list.length - ativos} />
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#1a6fbf]" />
            <h3 className="text-[#0c2340]">Gestão de Acessos do Trade Turístico</h3>
          </div>
          <div className="flex-1 relative max-w-md ml-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estabelecimento ou e-mail..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-[#f8fafc]"
            />
          </div>
          <select
            value={filterNivel}
            onChange={(e) => setFilterNivel(e.target.value)}
            className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white text-[#334155]"
          >
            <option>Todos</option>
            <option>Proprietário</option>
            <option>Gerente</option>
            <option>Operacional</option>
          </select>
          <button
            onClick={() => setModalKey({ type: "addUser" })}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a6fbf] hover:bg-[#1560a8] text-white text-sm rounded-lg shadow-sm transition-colors"
          >
            <UserPlus size={16} />
            Novo Usuário
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Estabelecimento</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">E-mail de Login</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Nível de Permissão</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Último Acesso</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Acesso</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                <td className="px-4 py-3 text-sm text-[#0c2340] font-medium">{u.estabelecimento}</td>
                <td className="px-4 py-3 text-sm text-[#64748b]">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={12} className="text-[#94a3b8]" />
                    {u.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    u.nivel === "Proprietário" ? "bg-blue-100 text-blue-700" :
                    u.nivel === "Gerente" ? "bg-violet-100 text-violet-700" :
                    "bg-cyan-100 text-cyan-700"
                  }`}>
                    {u.nivel}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[#64748b]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={12} className="text-[#94a3b8]" />
                    {u.ultimoAcesso}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Toggle on={u.ativo} onChange={() => toggle(u.id)} />
                    <span className={`text-xs font-medium ${u.ativo ? "text-emerald-600" : "text-[#94a3b8]"}`}>
                      {u.ativo ? "Liberado" : "Bloqueado"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setModalKey({ type: "editUser", user: u })}
                      className="p-1.5 rounded-lg text-[#1a6fbf] hover:bg-blue-50 transition-colors"
                      title="Editar usuário"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setModalKey({ type: "resetSenha", user: u })}
                      className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
                      title="Resetar senha"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#94a3b8]">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalKey && (
        <ModalContent
          type={modalKey.type}
          user={modalKey.user}
          onClose={() => setModalKey(null)}
          onSaved={(msg) => {
            if (modalKey.type === "editUser" && modalKey.user) updateUser({ ...modalKey.user });
            else if (modalKey.type === "addUser") { /* handled inside */ }
            setModalKey(null);
            setToast(msg);
            setTimeout(() => setToast(null), 4000);
          }}
          onSave={(data) => {
            if (modalKey.type === "editUser" && modalKey.user) updateUser({ ...modalKey.user, ...data });
            else if (modalKey.type === "addUser") addUser(data as Omit<TradeUser, "id">);
            setModalKey(null);
            setToast("Dados atualizados com sucesso");
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

function KpiCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#64748b]">{label}</p>
        <p className="text-2xl font-semibold text-[#0c2340] leading-tight">{value}</p>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        on ? "bg-emerald-500" : "bg-[#cbd5e1]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── MODAIS ───────────────────────────────────────────────────────────────────

function ModalContent({
  type, user, onClose, onSaved, onSave,
}: {
  type: ModalType;
  user?: TradeUser;
  onClose: () => void;
  onSaved?: (msg: string, logDesc?: string) => void;
  onSave?: (data: any) => void;
}) {
  const [searchEntidade, setSearchEntidade] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("Todas");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [formData, setFormData] = useState({
    estabelecimento: user?.estabelecimento ?? "",
    email: user?.email ?? "",
    nivel: user?.nivel ?? ("Proprietário" as TradeUser["nivel"]),
    tipoSuspensao: "temporaria" as "temporaria" | "permanente",
    dataInicio: "",
    dataRetorno: "",
    motivo: "",
    entidadeVinculada: "",
    // senha
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
    // funcionarios
    fixos: "",
    temporarios: "",
    // cadastrais / redes sociais
    telefone: "",
    emailContato: "",
    instagram: "",
    facebook: "",
    site: "",
    // infra ODS
    gestaoSustentavel: false,
    mulheresLideranca: "",
  });

  const entidadesPorTipo: Record<string, string[]> = {
    "Hotéis": ["Hotel Marupiara", "Hotel Thermas Palace"],
    "Pousadas": ["Pousada Brisa das Águas", "Pousada Recanto Verde"],
    "Resorts": ["Resort Beira Rio"],
    "Parques Aquáticos": ["Thermas dos Laranjais", "Hot Park"],
    "Restaurantes": ["Sabores do Cerrado", "Restaurante Sabor da Terra"],
    "Agências de Turismo": ["Olímpia Tours", "Silva Turismo", "Agência Vale do Sol"],
  };

  const estabelecimentosComCadastro = [
    "Hotel Marupiara", "Pousada Brisa das Águas", "Resort Beira Rio",
    "Thermas dos Laranjais", "Hot Park", "Olímpia Tours", "Sabores do Cerrado", "Silva Turismo",
  ];

  const getEntidadesFiltradas = () => {
    const result: Array<{ nome: string; categoria: string; temCadastro: boolean }> = [];
    Object.entries(entidadesPorTipo).forEach(([categoria, lista]) => {
      if (selectedCategoria === "Todas" || selectedCategoria === categoria) {
        lista.forEach((nome) => {
          if (!searchEntidade || nome.toLowerCase().includes(searchEntidade.toLowerCase())) {
            result.push({ nome, categoria, temCadastro: estabelecimentosComCadastro.includes(nome) });
          }
        });
      }
    });
    return result;
  };

  const titles: Record<ModalType, string> = {
    leitos: "Atualizar Leitos e Quartos",
    infra: "Infraestrutura, Acessibilidade e ODS",
    encerramento: "Suspensão ou Encerramento de Atividades",
    senha: "Alterar Senha",
    editUser: "Editar Usuário",
    addUser: "Cadastrar Novo Usuário",
    resetSenha: "Resetar Senha do Usuário",
    funcionarios: "Quadro de Funcionários",
    cadastrais: "Dados Cadastrais e Redes Sociais",
  };

  const primaryLabel = () => {
    if (type === "encerramento")
      return formData.tipoSuspensao === "temporaria" ? "Confirmar Suspensão" : "Confirmar Encerramento";
    if (type === "senha") return "Atualizar Senha";
    if (type === "resetSenha") return "Resetar Senha";
    if (type === "addUser") return "Cadastrar Usuário";
    if (type === "funcionarios") return "Salvar Alterações";
    if (type === "cadastrais") return "Salvar Alterações";
    return "Salvar Alterações";
  };

  const logDescFor = (): string | undefined => {
    if (type === "leitos") return "Leitos e quartos atualizados";
    if (type === "infra") return "Infraestrutura, acessibilidade e ODS atualizados";
    if (type === "funcionarios")
      return `Quadro de funcionários atualizado — Fixos: ${formData.fixos || "—"}, Temporários: ${formData.temporarios || "—"}`;
    if (type === "cadastrais") return "Dados cadastrais e redes sociais atualizados";
    if (type === "senha") return "Senha de acesso alterada";
    if (type === "encerramento")
      return formData.tipoSuspensao === "temporaria" ? "Suspensão temporária registrada" : "Encerramento permanente registrado";
    return undefined;
  };

  const primaryColor = () => {
    if (type === "encerramento")
      return formData.tipoSuspensao === "temporaria"
        ? "bg-orange-500 hover:bg-orange-600"
        : "bg-red-600 hover:bg-red-700";
    if (type === "resetSenha") return "bg-red-500 hover:bg-red-600";
    return "bg-[#1a6fbf] hover:bg-[#1560a8]";
  };

  const handleSubmit = () => {
    if (onSave) onSave(formData);
    if (onSaved) onSaved("Dados atualizados com sucesso", logDescFor());
    else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0] flex-shrink-0">
          <h3 className="text-[#0c2340]">{titles[type]}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* ── Leitos ── */}
          {type === "leitos" && (
            <>
              <Field label="Quartos (UHs)">
                <input type="number" defaultValue={24} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30" />
              </Field>
              <Field label="Leitos">
                <input type="number" defaultValue={58} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30" />
              </Field>
            </>
          )}

          {/* ── Infra + ODS ── */}
          {type === "infra" && (
            <div className="space-y-4">
              <div className="space-y-2">
                {["Piscina", "Área Verde", "Sala de Eventos", "Estacionamento", "Wi-Fi Cortesia", "Banheiros PCD", "Rampa de Acesso", "Sinalização Braile", "Captação de Chuva"].map((l) => (
                  <label key={l} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e2e8f0] cursor-pointer hover:bg-[#f8fafc]">
                    <input type="checkbox" className="accent-[#1a6fbf]" />
                    <span className="text-sm text-[#334155]">{l}</span>
                  </label>
                ))}
              </div>

              {/* Seção ODS */}
              <div className="pt-2 border-t border-[#f1f5f9]">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf size={14} className="text-emerald-600" />
                  <p className="text-xs font-semibold text-[#0c2340] uppercase tracking-wider">Indicadores ODS — Agenda 2030</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formData.gestaoSustentavel}
                      onChange={(e) => setFormData({ ...formData, gestaoSustentavel: e.target.checked })}
                      className="accent-emerald-600 mt-0.5"
                    />
                    <div>
                      <span className="text-sm text-[#334155] font-medium">Práticas de gestão sustentável</span>
                      <p className="text-xs text-[#64748b] mt-0.5">Uso consciente de água e/ou energia renovável nas operações</p>
                    </div>
                  </label>
                  <Field label="Mulheres em posições de liderança">
                    <div className="relative">
                      <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        type="number"
                        min={0}
                        value={formData.mulheresLideranca}
                        onChange={(e) => setFormData({ ...formData, mulheresLideranca: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Encerramento ── */}
          {type === "encerramento" && (
            <>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-[#64748b]">
                  Tipo de Suspensão/Encerramento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["temporaria", "permanente"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipoSuspensao: t })}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                        formData.tipoSuspensao === t
                          ? t === "temporaria" ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
                          : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        formData.tipoSuspensao === t
                          ? t === "temporaria" ? "border-amber-500 bg-amber-500" : "border-red-500 bg-red-500"
                          : "border-[#cbd5e1]"
                      }`}>
                        {formData.tipoSuspensao === t && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {t === "temporaria"
                            ? <Pause size={14} className={formData.tipoSuspensao === t ? "text-amber-600" : "text-[#94a3b8]"} />
                            : <XCircle size={14} className={formData.tipoSuspensao === t ? "text-red-600" : "text-[#94a3b8]"} />
                          }
                          <p className="text-sm font-semibold text-[#0c2340]">
                            {t === "temporaria" ? "Suspensão Temporária" : "Encerramento Permanente"}
                          </p>
                        </div>
                        <p className="text-xs text-[#64748b]">
                          {t === "temporaria" ? "Reforma, manutenção ou pausa sazonal" : "Fechamento definitivo das atividades"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alerta com novo texto unificado */}
              <div className={`p-3 border rounded-lg flex items-start gap-2 ${
                formData.tipoSuspensao === "temporaria" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
              }`}>
                <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${formData.tipoSuspensao === "temporaria" ? "text-amber-600" : "text-red-600"}`} />
                <p className={`text-xs leading-relaxed ${formData.tipoSuspensao === "temporaria" ? "text-amber-700" : "text-red-700"}`}>
                  Ao confirmar, seu estabelecimento ficará marcado como <strong>Inativo</strong> no inventário turístico e a Secretaria de Turismo será notificada automaticamente.
                </p>
              </div>

              {formData.tipoSuspensao === "temporaria" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Início da Suspensão">
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                        <input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                      </div>
                    </Field>
                    <Field label="Previsão de Retorno">
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                        <input type="date" value={formData.dataRetorno} onChange={(e) => setFormData({ ...formData, dataRetorno: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                      </div>
                    </Field>
                  </div>
                  <Field label="Motivo da Suspensão">
                    <textarea rows={3} value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Ex: Reforma geral das instalações..." />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Data de Encerramento">
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                      <input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                    </div>
                  </Field>
                  <Field label="Motivo do Encerramento">
                    <textarea rows={3} value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30" placeholder="Descreva o motivo do encerramento permanente..." />
                  </Field>
                </>
              )}
            </>
          )}

          {/* ── Senha (autoatendimento) ── */}
          {type === "senha" && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Lock size={16} className="text-[#1a6fbf] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Sua nova senha será salva imediatamente. Não é necessário contatar a Secretaria.
                </p>
              </div>
              <Field label="Senha Atual">
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showSenhaAtual ? "text" : "password"}
                    value={formData.senhaAtual}
                    onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30"
                  />
                  <button type="button" onClick={() => setShowSenhaAtual(!showSenhaAtual)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
                    {showSenhaAtual ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Nova Senha">
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showNovaSenha ? "text" : "password"}
                    value={formData.novaSenha}
                    onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30"
                  />
                  <button type="button" onClick={() => setShowNovaSenha(!showNovaSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
                    {showNovaSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirmar Nova Senha">
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showConfirmar ? "text" : "password"}
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                      formData.confirmarSenha && formData.confirmarSenha !== formData.novaSenha
                        ? "border-red-400 focus:ring-red-400/30"
                        : "border-[#e2e8f0] focus:ring-[#1a6fbf]/30"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmar(!showConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
                    {showConfirmar ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {formData.confirmarSenha && formData.confirmarSenha !== formData.novaSenha && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
                )}
              </Field>
            </>
          )}

          {/* ── Funcionários ── */}
          {type === "funcionarios" && (
            <>
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex items-start gap-2">
                <Users size={16} className="text-cyan-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-cyan-700">
                  Os dados serão aplicados imediatamente ao inventário e refletidos nos indicadores de mão de obra do setor.
                </p>
              </div>
              <Field label="Funcionários Fixos">
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="number"
                    min={0}
                    value={formData.fixos}
                    onChange={(e) => setFormData({ ...formData, fixos: e.target.value })}
                    placeholder="Ex: 12"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </Field>
              <Field label="Funcionários Temporários">
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="number"
                    min={0}
                    value={formData.temporarios}
                    onChange={(e) => setFormData({ ...formData, temporarios: e.target.value })}
                    placeholder="Ex: 4"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </Field>
              {formData.fixos && formData.temporarios && (
                <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">Total da equipe</span>
                  <span className="text-sm font-bold text-[#0c2340]">
                    {Number(formData.fixos) + Number(formData.temporarios)} colaboradores
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── Dados Cadastrais + Redes Sociais ── */}
          {type === "cadastrais" && (
            <>
              <Field label="Telefone de Contato">
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(17) 99999-9999"
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30"
                />
              </Field>
              <Field label="E-mail de Contato">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="email"
                    value={formData.emailContato}
                    onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
                    placeholder="contato@seuhotel.com.br"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30"
                  />
                </div>
              </Field>

              <div className="pt-2 border-t border-[#f1f5f9]">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={14} className="text-indigo-600" />
                  <p className="text-xs font-semibold text-[#0c2340] uppercase tracking-wider">Redes Sociais e Site</p>
                </div>
                <div className="space-y-3">
                  <Field label="Instagram">
                    <div className="relative">
                      <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        type="url"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/seuperfil"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </Field>
                  <Field label="Facebook">
                    <div className="relative">
                      <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        type="url"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="https://facebook.com/suapagina"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </Field>
                  <Field label="Site Oficial">
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        type="url"
                        value={formData.site}
                        onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                        placeholder="https://www.seuhotel.com.br"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* ── EditUser / AddUser ── */}
          {(type === "editUser" || type === "addUser") && (
            <>
              <Field label="Vincular com Entidade do Inventário">
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input type="text" value={searchEntidade} onChange={(e) => setSearchEntidade(e.target.value)} placeholder="Buscar estabelecimento..." className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 bg-[#f8fafc]" />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {["Todas", ...Object.keys(entidadesPorTipo)].map((cat) => (
                      <button key={cat} type="button" onClick={() => setSelectedCategoria(cat)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-all ${selectedCategoria === cat ? "bg-[#1a6fbf] text-white shadow-sm" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-[#e2e8f0] rounded-lg bg-white">
                  {getEntidadesFiltradas().length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#94a3b8]">Nenhuma entidade encontrada</div>
                  ) : (
                    <div className="divide-y divide-[#f1f5f9]">
                      {getEntidadesFiltradas().map((entidade) => (
                        <button key={entidade.nome} type="button"
                          onClick={() => setFormData({ ...formData, entidadeVinculada: entidade.nome, estabelecimento: entidade.nome })}
                          className={`w-full text-left px-3 py-2.5 hover:bg-[#f8fafc] transition-colors ${formData.entidadeVinculada === entidade.nome ? "bg-blue-50" : ""}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-[#0c2340] font-medium truncate">{entidade.nome}</p>
                                {entidade.temCadastro && (
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                                    <AlertTriangle size={9} />
                                    Já cadastrado
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#94a3b8] mt-0.5">{entidade.categoria}</p>
                            </div>
                            {formData.entidadeVinculada === entidade.nome && <CheckCircle2 size={16} className="text-[#1a6fbf] flex-shrink-0" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <Field label="E-mail de Login">
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30" placeholder="email@exemplo.com.br" />
              </Field>

              {/* Nível de Permissão — destacado conforme spec */}
              <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-[#1a6fbf]" />
                  <label className="text-sm font-semibold text-[#0c2340]">Nível de Permissão</label>
                </div>
                <select
                  value={formData.nivel}
                  onChange={(e) => setFormData({ ...formData, nivel: e.target.value as TradeUser["nivel"] })}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30"
                >
                  <option value="Proprietário">Proprietário</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Operacional">Operacional</option>
                </select>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Apenas <strong className="text-[#334155]">Proprietário</strong> pode solicitar a Suspensão ou Encerramento do estabelecimento.
                </p>
              </div>
            </>
          )}

          {/* ── Reset Senha (Secretaria) ── */}
          {type === "resetSenha" && (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Resetar Senha do Usuário</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Uma nova senha temporária será gerada e enviada para: <strong>{user?.email}</strong>
                  </p>
                </div>
              </div>
              <Field label="Confirmação">
                <p className="text-sm text-[#64748b] mb-2">Digite o nome do estabelecimento para confirmar:</p>
                <input type="text" placeholder={user?.estabelecimento} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30" />
              </Field>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-[#e2e8f0] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc]">
            Cancelar
          </button>
          <button onClick={handleSubmit} className={`px-4 py-2 text-sm rounded-lg text-white font-medium ${primaryColor()}`}>
            {primaryLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748b] mb-1">{label}</label>
      {children}
    </div>
  );
}
