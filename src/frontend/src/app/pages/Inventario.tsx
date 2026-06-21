import { useState } from "react";
import {
  Plus, Search, Pencil, Trash2, X, ChevronDown,
  CheckCircle2, XCircle, Filter, Download,
  FileText, Building, Leaf, Shield,
} from "lucide-react";

type Segmento =
  | "Meio de Hospedagem"
  | "Atrativo Turístico"
  | "Alimentação"
  | "Serviço de Saúde"
  | "Agência de Viagem"
  | "Transporte Turístico";

interface Estabelecimento {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  segmento: Segmento;
  cnpj: string;
  status: "Ativo" | "Inativo";
}

const segmentos: Segmento[] = [
  "Meio de Hospedagem",
  "Atrativo Turístico",
  "Alimentação",
  "Serviço de Saúde",
  "Agência de Viagem",
  "Transporte Turístico",
];

const initialData: Estabelecimento[] = [
  { id: 1, razaoSocial: "Thermas dos Laranjais S.A.", nomeFantasia: "Thermas dos Laranjais", segmento: "Atrativo Turístico", cnpj: "01.234.567/0001-89", status: "Ativo" },
  { id: 2, razaoSocial: "Hotel Marupiara Ltda.", nomeFantasia: "Hotel Marupiara", segmento: "Meio de Hospedagem", cnpj: "02.345.678/0001-90", status: "Ativo" },
  { id: 3, razaoSocial: "Restaurante Sabores do Cerrado ME", nomeFantasia: "Sabores do Cerrado", segmento: "Alimentação", cnpj: "03.456.789/0001-01", status: "Ativo" },
  { id: 4, razaoSocial: "Clínica Saúde Turista Ltda.", nomeFantasia: "Clínica Turista", segmento: "Serviço de Saúde", cnpj: "04.567.890/0001-12", status: "Ativo" },
  { id: 5, razaoSocial: "Viagens Olímpia Agência de Turismo", nomeFantasia: "Olímpia Tours", segmento: "Agência de Viagem", cnpj: "05.678.901/0001-23", status: "Ativo" },
  { id: 6, razaoSocial: "Pousada Brisa das Águas ME", nomeFantasia: "Pousada Brisa", segmento: "Meio de Hospedagem", cnpj: "06.789.012/0001-34", status: "Inativo" },
  { id: 7, razaoSocial: "Transportes Turísticos Silva Eireli", nomeFantasia: "Silva Turismo", segmento: "Transporte Turístico", cnpj: "07.890.123/0001-45", status: "Ativo" },
  { id: 8, razaoSocial: "Hot Park Entretenimento S.A.", nomeFantasia: "Hot Park", segmento: "Atrativo Turístico", cnpj: "08.901.234/0001-56", status: "Ativo" },
  { id: 9, razaoSocial: "Resort Beira Rio Ltda.", nomeFantasia: "Beira Rio Resort", segmento: "Meio de Hospedagem", cnpj: "09.012.345/0001-67", status: "Ativo" },
  { id: 10, razaoSocial: "Churrascaria Pantaneira ME", nomeFantasia: "Pantaneira Grill", segmento: "Alimentação", cnpj: "10.123.456/0001-78", status: "Inativo" },
];

const segmentoColors: Record<Segmento, string> = {
  "Meio de Hospedagem": "bg-blue-100 text-blue-700",
  "Atrativo Turístico": "bg-amber-100 text-amber-700",
  "Alimentação": "bg-green-100 text-green-700",
  "Serviço de Saúde": "bg-violet-100 text-violet-700",
  "Agência de Viagem": "bg-cyan-100 text-cyan-700",
  "Transporte Turístico": "bg-orange-100 text-orange-700",
};

interface FormData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  cep: string;
  telefone: string;
  email: string;
  segmento: Segmento | "";
  status: "Ativo" | "Inativo";
  categoria: string;
  // Infra
  uhs: string;
  leitos: string;
  capacidade: string;
  areaVerde: boolean;
  piscina: boolean;
  salasEventos: boolean;
  estacionamento: boolean;
  wifiCortesia: boolean;
  // Acessibilidade & Sustentabilidade
  banheirosPCD: boolean;
  rampaAcesso: boolean;
  sinalizacaoBraile: boolean;
  cadeiraRodas: boolean;
  fontesRenovaveis: boolean;
  planoResiduos: boolean;
  captacaoChuva: boolean;
  produtosLocais: boolean;
}

const emptyForm: FormData = {
  razaoSocial: "", nomeFantasia: "", cnpj: "", endereco: "", cidade: "Olímpia",
  cep: "", telefone: "", email: "", segmento: "", categoria: "", status: "Ativo",
  uhs: "", leitos: "", capacidade: "",
  areaVerde: false, piscina: false, salasEventos: false, estacionamento: false, wifiCortesia: false,
  banheirosPCD: false, rampaAcesso: false, sinalizacaoBraile: false, cadeiraRodas: false,
  fontesRenovaveis: false, planoResiduos: false, captacaoChuva: false, produtosLocais: false,
};

type TabKey = "cadastrais" | "infra" | "acessibilidade";

const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "cadastrais", label: "Dados Cadastrais", icon: FileText },
  { key: "infra", label: "Infraestrutura e Capacidade", icon: Building },
  { key: "acessibilidade", label: "Acessibilidade e Sustentabilidade", icon: Leaf },
];

export function Inventario() {
  const [dados, setDados] = useState<Estabelecimento[]>(initialData);
  const [search, setSearch] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [activeTab, setActiveTab] = useState<TabKey>("cadastrais");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [modoAdmin, setModoAdmin] = useState(false);

  const filtered = dados.filter((d) => {
    const matchSearch =
      d.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
      d.nomeFantasia.toLowerCase().includes(search.toLowerCase()) ||
      d.cnpj.includes(search);
    const matchSeg = filterSegmento === "Todos" || d.segmento === filterSegmento;
    const matchStatus = filterStatus === "Todos" || d.status === filterStatus;
    return matchSearch && matchSeg && matchStatus;
  });

  const openNewModal = () => {
    setEditId(null);
    setFormData(emptyForm);
    setActiveTab("cadastrais");
    setShowModal(true);
  };

  const openEditModal = (est: Estabelecimento) => {
    setEditId(est.id);
    setFormData({
      ...emptyForm,
      razaoSocial: est.razaoSocial,
      nomeFantasia: est.nomeFantasia,
      cnpj: est.cnpj,
      segmento: est.segmento,
      status: est.status,
    });
    setActiveTab("cadastrais");
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.razaoSocial || !formData.segmento) return;
    if (editId !== null) {
      setDados((prev) =>
        prev.map((d) =>
          d.id === editId
            ? { ...d, razaoSocial: formData.razaoSocial, nomeFantasia: formData.nomeFantasia, cnpj: formData.cnpj, segmento: formData.segmento as Segmento, status: formData.status }
            : d
        )
      );
    } else {
      const newId = Math.max(...dados.map((d) => d.id)) + 1;
      setDados((prev) => [
        ...prev,
        {
          id: newId,
          razaoSocial: formData.razaoSocial,
          nomeFantasia: formData.nomeFantasia,
          segmento: formData.segmento as Segmento,
          cnpj: formData.cnpj,
          status: "Ativo",
        },
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setDados((prev) => prev.filter((d) => d.id !== id));
    setDeleteConfirm(null);
  };

  const isHospedagem = formData.segmento === "Meio de Hospedagem";
  const isAtrativo = formData.segmento === "Atrativo Turístico";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0c2340]">Inventário Turístico</h1>
          <p className="text-[#64748b] text-sm mt-0.5">
            Base de dados profunda do trade turístico de Olímpia
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Modo Administrador */}
          <button
            onClick={() => setModoAdmin(!modoAdmin)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-sm border ${
              modoAdmin
                ? "bg-violet-500 hover:bg-violet-600 text-white border-violet-600"
                : "bg-white hover:bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]"
            }`}
          >
            <Shield size={16} />
            <span className="text-sm font-medium">
              {modoAdmin ? "Modo Admin Ativo" : "Modo Admin"}
            </span>
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-[#1a6fbf] hover:bg-[#1560a8] text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span className="text-sm">Novo Estabelecimento</span>
          </button>
        </div>
      </div>

      {/* Banner Modo Admin — apenas indica que edições se aplicam ao estado atual */}
      {modoAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Shield size={18} className="text-[#1a6fbf] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1a6fbf]">Modo Administrador Ativo</p>
            <p className="text-xs text-blue-600 mt-1 leading-relaxed">
              Edições aplicam-se imediatamente ao estado atual do registro. Todas as alterações são registradas no log de auditoria.
            </p>
          </div>
          <button
            onClick={() => setModoAdmin(false)}
            className="p-1 rounded-lg text-blue-300 hover:text-[#1a6fbf] hover:bg-blue-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-[#f8fafc]"
            />
          </div>
          <Filter size={14} className="text-[#64748b]" />
          <select
            value={filterSegmento}
            onChange={(e) => setFilterSegmento(e.target.value)}
            className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white text-[#334155]"
          >
            <option value="Todos">Todos os Segmentos</option>
            {segmentos.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white text-[#334155]"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc] transition-colors">
            <Download size={14} />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#64748b]">
          Exibindo <strong className="text-[#0c2340]">{filtered.length}</strong> de{" "}
          <strong className="text-[#0c2340]">{dados.length}</strong> estabelecimentos
        </span>
        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {dados.filter((d) => d.status === "Ativo").length} ativos
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <span className="w-2 h-2 rounded-full bg-[#cbd5e1] inline-block" />
            {dados.filter((d) => d.status === "Inativo").length} inativos
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider w-8">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Razão Social</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Nome Fantasia</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">CNPJ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Segmento</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((est, i) => (
              <tr key={est.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                <td className="px-4 py-3 text-xs text-[#94a3b8]">{i + 1}</td>
                <td className="px-4 py-3 text-sm text-[#334155] font-medium max-w-[200px]">
                  <span className="truncate block">{est.razaoSocial}</span>
                </td>
                <td className="px-4 py-3 text-sm text-[#64748b]">{est.nomeFantasia}</td>
                <td className="px-4 py-3 text-xs text-[#94a3b8] font-mono">{est.cnpj}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${segmentoColors[est.segmento]}`}>
                    {est.segmento}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    est.status === "Ativo" ? "bg-emerald-50 text-emerald-700" : "bg-[#f1f5f9] text-[#94a3b8]"
                  }`}>
                    {est.status === "Ativo" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {est.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEditModal(est)}
                      className="p-1.5 rounded-md text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1a6fbf] transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(est.id)}
                      className="p-1.5 rounded-md text-[#64748b] hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#94a3b8]">
                  Nenhum estabelecimento encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-[#0c2340] mb-2">Confirmar Exclusão</h3>
            <p className="text-[#64748b] text-sm mb-6">
              Tem certeza que deseja excluir este estabelecimento? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Modal with Tabs */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-[#0c2340]">
                  {editId ? "Editar Estabelecimento" : "Novo Estabelecimento"}
                </h2>
                <p className="text-[#94a3b8] text-xs mt-0.5">
                  {editId ? "Atualize os dados do inventário" : "Preencha os dados para cadastrar no inventário"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#64748b] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-5 border-b border-[#e2e8f0] bg-[#f8fafc]">
              <div className="flex gap-1">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                        active
                          ? "border-[#1a6fbf] text-[#1a6fbf] font-semibold"
                          : "border-transparent text-[#64748b] hover:text-[#334155]"
                      }`}
                    >
                      <Icon size={15} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {activeTab === "cadastrais" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#64748b] mb-1">
                      Razão Social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.razaoSocial}
                      onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                      placeholder="Ex: Hotel Marupiara Ltda."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.nomeFantasia}
                      onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                      placeholder="Ex: Hotel Marupiara"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">
                      CNPJ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] font-mono"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Endereço</label>
                    <input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Cidade</label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">CEP</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] font-mono"
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Telefone</label>
                    <input
                      type="text"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                      placeholder="(17) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                      placeholder="contato@empresa.com.br"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#64748b] mb-1">
                      Segmento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.segmento}
                        onChange={(e) => setFormData({ ...formData, segmento: e.target.value as Segmento | "" })}
                        className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white appearance-none pr-8 text-[#334155]"
                      >
                        <option value="">Selecione o segmento...</option>
                        {segmentos.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                    </div>
                  </div>

                  {/* Status da Entidade */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#64748b] mb-2">
                      Status da Entidade
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: formData.status === "Ativo" ? "Inativo" : "Ativo" })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          formData.status === "Ativo"
                            ? "bg-emerald-500 focus:ring-emerald-500"
                            : "bg-[#cbd5e1] focus:ring-[#94a3b8]"
                        }`}
                        role="switch"
                        aria-checked={formData.status === "Ativo"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.status === "Ativo" ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <div>
                        <span className={`text-sm font-semibold ${formData.status === "Ativo" ? "text-emerald-600" : "text-[#94a3b8]"}`}>
                          {formData.status}
                        </span>
                        <span className="text-xs text-[#94a3b8] ml-2">
                          {formData.status === "Ativo"
                            ? "— estabelecimento em operação"
                            : "— estabelecimento encerrado ou suspenso"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "infra" && (
                <div className="space-y-4">
                  {!formData.segmento && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                      Selecione um segmento na aba "Dados Cadastrais" para liberar os campos específicos.
                    </div>
                  )}

                  {isHospedagem && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <h4 className="text-[#0c2340] mb-3">Meio de Hospedagem — Capacidade</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Quartos (UHs)</label>
                          <input
                            type="number"
                            value={formData.uhs}
                            onChange={(e) => setFormData({ ...formData, uhs: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Leitos</label>
                          <input
                            type="number"
                            value={formData.leitos}
                            onChange={(e) => setFormData({ ...formData, leitos: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Categoria</label>
                          <select
                            value={formData.categoria}
                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white text-[#334155]"
                          >
                            <option value="">Selecione...</option>
                            <option>Hotel</option>
                            <option>Pousada</option>
                            <option>Resort</option>
                            <option>Hostel</option>
                            <option>Flat</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAtrativo && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <h4 className="text-[#0c2340] mb-3">Atrativo Turístico — Capacidade</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Capacidade Visitantes/Dia</label>
                          <input
                            type="number"
                            value={formData.capacidade}
                            onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Tipo de Atrativo</label>
                          <select className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white text-[#334155]">
                            <option value="">Selecione...</option>
                            <option>Parque Aquático</option>
                            <option>Parque Ecológico</option>
                            <option>Parque Temático</option>
                            <option>Espaço Cultural</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.segmento && (
                    <div>
                      <h4 className="text-[#0c2340] mb-3">Infraestrutura Disponível</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: "areaVerde", label: "Área Verde / Jardins" },
                          { key: "piscina", label: "Piscina" },
                          { key: "salasEventos", label: "Salas de Eventos" },
                          { key: "estacionamento", label: "Estacionamento Próprio" },
                          { key: "wifiCortesia", label: "Wi-Fi Cortesia" },
                        ].map((item) => (
                          <CheckboxItem
                            key={item.key}
                            label={item.label}
                            checked={formData[item.key as keyof FormData] as boolean}
                            onChange={(v) => setFormData({ ...formData, [item.key]: v })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "acessibilidade" && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[#0c2340] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1a6fbf]" />
                      Acessibilidade
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "banheirosPCD", label: "Banheiros adaptados (PCD)" },
                        { key: "rampaAcesso", label: "Rampa de acesso" },
                        { key: "sinalizacaoBraile", label: "Sinalização em Braile" },
                        { key: "cadeiraRodas", label: "Cadeira de rodas disponível" },
                      ].map((item) => (
                        <CheckboxItem
                          key={item.key}
                          label={item.label}
                          checked={formData[item.key as keyof FormData] as boolean}
                          onChange={(v) => setFormData({ ...formData, [item.key]: v })}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[#0c2340] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Sustentabilidade
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "fontesRenovaveis", label: "Uso de Fontes Renováveis" },
                        { key: "planoResiduos", label: "Plano de Gestão de Resíduos" },
                        { key: "captacaoChuva", label: "Captação de Água da Chuva" },
                        { key: "produtosLocais", label: "Compra de Produtos Locais" },
                      ].map((item) => (
                        <CheckboxItem
                          key={item.key}
                          label={item.label}
                          checked={formData[item.key as keyof FormData] as boolean}
                          onChange={(v) => setFormData({ ...formData, [item.key]: v })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-[#e2e8f0] bg-white rounded-b-xl">
              <p className="text-xs text-[#94a3b8]">
                <span className="text-red-500">*</span> Campos obrigatórios
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.razaoSocial || !formData.segmento}
                  className="px-5 py-2 text-sm bg-[#1a6fbf] hover:bg-[#1560a8] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editId ? "Salvar Alterações" : "Cadastrar Estabelecimento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[#e2e8f0] hover:border-[#1a6fbf]/40 hover:bg-[#f8fafc] cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#1a6fbf] cursor-pointer"
      />
      <span className="text-sm text-[#334155]">{label}</span>
    </label>
  );
}
