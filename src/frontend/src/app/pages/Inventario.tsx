import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Pencil, Trash2, X, ChevronDown,
  CheckCircle2, XCircle, Filter, Download,
  FileText, Building,
} from "lucide-react";
import { apiService } from "../services/api";
import { formatCNPJ, formatCPFOrCNPJ, formatCEP, formatPhone, toNumberOrNull } from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import { CatalogTreeEditor, type CatalogSection } from "../components/CatalogTreeEditor";

type Segmento =
  | "Meio de Hospedagem"
  | "Atrativo Turístico"
  | "Alimentação"
  | "Espaço de Evento"
  | "Agência de Viagem"
  | "Organizador de Evento"
  | "Transporte Turístico"
  | "Artesanato"
  | "Banco"
  | "Templo Religioso"
  | "Serviço de Saúde"
  | "Serviço de Apoio"
  | "Guia de Turismo"
  | "RHC"
  | "Grupo Folclórico"
  | "Táxi/Aplicativo";

type OdsNatureza = "quali" | "quant";

type OdsCatalogItem = {
  id: number;
  eixo: number;
  ods: number;
  descricao: string;
  natureza: OdsNatureza;
};

type OdsFormItem = OdsCatalogItem & {
  ativo: boolean;
  valor: string;
};

interface Estabelecimento {
  id: number;
  endpoint: string;
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
  "Espaço de Evento",
  "Agência de Viagem",
  "Organizador de Evento",
  "Transporte Turístico",
  "Artesanato",
  "Banco",
  "Templo Religioso",
  "Serviço de Saúde",
  "Serviço de Apoio",
  "Guia de Turismo",
  "RHC",
  "Grupo Folclórico",
  "Táxi/Aplicativo",
];

const segmentoColors: Record<Segmento, string> = {
  "Meio de Hospedagem": "bg-blue-100 text-blue-700",
  "Atrativo Turístico": "bg-amber-100 text-amber-700",
  "Alimentação": "bg-green-100 text-green-700",
  "Espaço de Evento": "bg-purple-100 text-purple-700",
  "Agência de Viagem": "bg-cyan-100 text-cyan-700",
  "Organizador de Evento": "bg-pink-100 text-pink-700",
  "Transporte Turístico": "bg-orange-100 text-orange-700",
  "Artesanato": "bg-red-100 text-red-700",
  "Banco": "bg-yellow-100 text-yellow-700",
  "Templo Religioso": "bg-indigo-100 text-indigo-700",
  "Serviço de Saúde": "bg-violet-100 text-violet-700",
  "Serviço de Apoio": "bg-teal-100 text-teal-700",
  "Guia de Turismo": "bg-lime-100 text-lime-700",
  "RHC": "bg-fuchsia-100 text-fuchsia-700",
  "Grupo Folclórico": "bg-rose-100 text-rose-700",
  "Táxi/Aplicativo": "bg-slate-100 text-slate-700",
};

const segmentMapping: Record<Segmento, string> = {
  "Meio de Hospedagem": "hospedagens",
  "Atrativo Turístico": "atrativos",
  "Alimentação": "alimentacao",
  "Espaço de Evento": "espacos-eventos",
  "Agência de Viagem": "agencias",
  "Organizador de Evento": "organizadores-eventos",
  "Transporte Turístico": "locadoras-transporte",
  "Artesanato": "artesanato",
  "Banco": "bancos",
  "Templo Religioso": "templos",
  "Serviço de Saúde": "saude",
  "Serviço de Apoio": "apoio",
  "Guia de Turismo": "guias",
  "RHC": "rhc",
  "Grupo Folclórico": "grupos-folcloricos",
  "Táxi/Aplicativo": "taxis",
};

const endpointToSegment = Object.entries(segmentMapping).reduce(
  (acc, [segmento, endpoint]) => {
    acc[endpoint] = segmento as Segmento;
    return acc;
  },
  {} as Record<string, Segmento>
);

const normalizeInventarioItem = (item: any, endpoint: string, segmento: Segmento): Estabelecimento => {
  // Extrai campo de documento (pode ser cnpj, cpf, documento, cpf_proprietario)
  const getDocument = () => {
    if (segmento === "Guia de Turismo") return item.cpf || "";
    if (segmento === "RHC") return item.cpf_proprietario || "";
    if (segmento === "Grupo Folclórico") return item.documento || "";
    if (segmento === "Táxi/Aplicativo") return item.documento || ""; // pode não ter
    return item.cnpj || "";
  };

  // Extrai razão social / nome principal
  const getRazaoSocial = () => {
    if (segmento === "Guia de Turismo") return item.nome || "";
    if (segmento === "RHC") return item.nome_proprietario || "";
    if (segmento === "Grupo Folclórico") return item.razao_social || item.nome || "";
    if (segmento === "Táxi/Aplicativo") return item.nome || "";
    return item.razao_social || "";
  };

  // Extrai nome fantasia / nome alternativo
  const getNomeFantasia = () => {
    if (segmento === "Guia de Turismo") return item.nome || "";
    if (segmento === "RHC") return item.denominacao_comercial || item.nome_proprietario || "";
    if (segmento === "Grupo Folclórico") return item.nome || item.razao_social || "";
    if (segmento === "Táxi/Aplicativo") return item.empresa || item.nome || "";
    return item.nome_fantasia || item.razao_social || "";
  };

  return {
    id: Number(item.id),
    endpoint,
    razaoSocial: getRazaoSocial(),
    nomeFantasia: getNomeFantasia(),
    segmento,
    cnpj: getDocument(),
    status: item.ativo ? "Ativo" : "Inativo",
  };
};

const segmentoToEscopo: Partial<Record<Segmento, string>> = {
  "Meio de Hospedagem": "meio_hospedagem",
  "Atrativo Turístico": "atrativos",
  "Alimentação": "alimentacao",
  "Espaço de Evento": "espacos_eventos",
  "Agência de Viagem": "agencias",
  "Organizador de Evento": "organizadores",
  "Artesanato": "artesanato",
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
  produtosLocais: boolean;
  sustentabilidade: OdsFormItem[];
  caracteristicasSelecionadas: number[];
  metricas: Array<{ id: number; valor: string }>;
  // Extras for specific segmentos (RHC, Serviço de Apoio)
  tipoServico?: string; // maps to tipo_servico for Serviço de Apoio
  numeracaoRHC?: string; // maps to numeracao_rhc for RHC
  tipoImovelRHC?: string; // maps to tipo_imovel for RHC
}

const buildOdsItems = (catalog: OdsCatalogItem[], current: OdsFormItem[] = []): OdsFormItem[] => {
  const currentById = new Map(current.map((item) => [item.id, item]));
  return catalog.map((indicator) => {
    const existing = currentById.get(indicator.id);
    return {
      ...indicator,
      ativo: existing?.ativo ?? false,
      valor: existing?.valor ?? "",
    };
  });
};

const createEmptyForm = (catalog: OdsCatalogItem[] = []): FormData => ({
  razaoSocial: "", nomeFantasia: "", cnpj: "", endereco: "", cidade: "Olímpia",
  cep: "", telefone: "", email: "", segmento: "", categoria: "", status: "Ativo",
  uhs: "", leitos: "", capacidade: "",
  areaVerde: false, piscina: false, salasEventos: false, estacionamento: false, wifiCortesia: false,
  banheirosPCD: false, rampaAcesso: false, sinalizacaoBraile: false, cadeiraRodas: false,
  produtosLocais: false,
  sustentabilidade: buildOdsItems(catalog),
  caracteristicasSelecionadas: [],
  metricas: [],
  // Defaults for specific segmentos
  tipoServico: "",
  numeracaoRHC: "",
  tipoImovelRHC: "",
});

type TabKey = "cadastrais" | "infra";

const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "cadastrais", label: "Dados Cadastrais", icon: FileText },
  { key: "infra", label: "Infraestrutura, Acessibilidade e Sustentabilidade", icon: Building },
];

export function Inventario() {
  const { isSuperuser, isSecretariaAdmin, isSecretariaStaff } = useAuth();
  const [dados, setDados] = useState<Estabelecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(createEmptyForm());
  const [activeTab, setActiveTab] = useState<TabKey>("cadastrais");
  const [deleteConfirm, setDeleteConfirm] = useState<Estabelecimento | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [odsCatalog, setOdsCatalog] = useState<OdsCatalogItem[]>([]);
  const [catalogTree, setCatalogTree] = useState<CatalogSection[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const endpoints = Object.values(segmentMapping);
        const results = await Promise.all(
          endpoints.map(async (endpoint) => {
            const items = await apiService.listInventory(endpoint);
            const segmento = endpointToSegment[endpoint];

            return items.map((item: any) => normalizeInventarioItem(item, endpoint, segmento));
          })
        );

        setDados(results.flat());
      } catch (error) {
        console.error("Erro de rede:", error);
        setLoadError("Não foi possível carregar os estabelecimentos do backend.");
        toast.error("Falha ao carregar o inventário.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventario();
  }, []);

  useEffect(() => {
    const fetchOdsCatalog = async () => {
      try {
        const catalog = await apiService.getOdsCatalog();
        setOdsCatalog(catalog);
      } catch (error) {
        console.error("Erro ao carregar catálogo ODS:", error);
        toast.error("Falha ao carregar o catálogo ODS.");
        setOdsCatalog([]);
      }
    };

    fetchOdsCatalog();
  }, []);

  useEffect(() => {
    const fetchCatalogTree = async () => {
      const escopo = formData.segmento ? segmentoToEscopo[formData.segmento] : undefined;
      if (!escopo) {
        setCatalogTree([]);
        return;
      }

      try {
        const tree = await apiService.getCatalogTree(escopo);
        setCatalogTree(tree);
      } catch (error) {
        console.error("Erro ao carregar árvore de características:", error);
        setCatalogTree([]);
      }
    };

    if (showModal) {
      fetchCatalogTree();
    } else {
      setCatalogTree([]);
    }
  }, [formData.segmento, showModal]);

  const filtered = dados.filter((d) => {
    const matchSearch =
      d.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
      d.nomeFantasia.toLowerCase().includes(search.toLowerCase()) ||
      d.cnpj.includes(search);
    const matchSeg = filterSegmento === "Todos" || d.segmento === filterSegmento;
    const matchStatus = filterStatus === "Todos" || d.status === filterStatus;
    return matchSearch && matchSeg && matchStatus;
  });

  const toggleCaracteristica = (id: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      caracteristicasSelecionadas: checked
        ? Array.from(new Set([...prev.caracteristicasSelecionadas, id]))
        : prev.caracteristicasSelecionadas.filter((itemId) => itemId !== id),
    }));
  };

  const toggleCatalogSectionQuestion = (section: CatalogSection, checked: boolean) => {
    const sectionIds = section.subgrupos.flatMap((group) => group.opcoes.map((option) => option.id));

    setFormData((prev) => {
      const current = new Set(prev.caracteristicasSelecionadas);
      // Responder "Não" (ou reabrir a pergunta) limpa as marcações desta seção.
      // Não existe mais opção "Não" no catálogo: ausência de marcação = não possui.
      sectionIds.forEach((id) => current.delete(id));

      return {
        ...prev,
        caracteristicasSelecionadas: Array.from(current),
      };
    });
  };

  const createCatalogOption = async (section: CatalogSection, subgroup: { subgrupo_nome: string }, label: string) => {
    const escopo = formData.segmento ? segmentoToEscopo[formData.segmento] : undefined;
    if (!escopo) {
      toast.error("Selecione um segmento válido antes de adicionar opções ao catálogo.");
      return;
    }

    const canCreate = isSuperuser() || isSecretariaAdmin();
    if (!canCreate) {
      toast.error("Seu nível de acesso não permite criar opções no catálogo.");
      return;
    }

    const created = await apiService.createCatalogCharacteristic({
      escopo,
      secao: section.secao_id,
      nome: subgroup.subgrupo_nome,
      categoria: label,
      customizada: true,
    });

    setCatalogTree((prev) =>
      prev.map((item) => {
        if (item.secao_id !== section.secao_id) return item;
        return {
          ...item,
          subgrupos: item.subgrupos.map((group) => {
            if (group.subgrupo_nome !== subgroup.subgrupo_nome) return group;
            return {
              ...group,
              opcoes: [
                ...group.opcoes,
                {
                  id: Number(created.id),
                  categoria: created.categoria,
                  customizada: Boolean(created.customizada),
                },
              ],
            };
          }),
        };
      })
    );

    setFormData((prev) => ({
      ...prev,
      caracteristicasSelecionadas: Array.from(new Set([...prev.caracteristicasSelecionadas, Number(created.id)])),
    }));
  };

  const editCatalogOption = async (option: { id: number; categoria: string }, label: string) => {
    const updated = await apiService.updateCatalogCharacteristic(option.id, { categoria: label });
    setCatalogTree((prev) =>
      prev.map((section) => ({
        ...section,
        subgrupos: section.subgrupos.map((group) => ({
          ...group,
          opcoes: group.opcoes.map((item) =>
            item.id === option.id
              ? { ...item, categoria: updated.categoria, customizada: Boolean(updated.customizada) }
              : item
          ),
        })),
      }))
    );
  };

  const deleteCatalogOption = async (option: { id: number }) => {
    await apiService.deleteCatalogCharacteristic(option.id);
    setCatalogTree((prev) =>
      prev.map((section) => ({
        ...section,
        subgrupos: section.subgrupos.map((group) => ({
          ...group,
          opcoes: group.opcoes.filter((item) => item.id !== option.id),
        })),
      }))
    );
    setFormData((prev) => ({
      ...prev,
      caracteristicasSelecionadas: prev.caracteristicasSelecionadas.filter((id) => id !== option.id),
    }));
  };

  const openNewModal = () => {
    setEditId(null);
    setEditingEndpoint(null);
    setFormData(createEmptyForm(odsCatalog));
    setActiveTab("cadastrais");
    setShowModal(true);
  };

  const normalizeFormData = (detail: any, segmento: Segmento, est: Estabelecimento) => {
    // Mapeia campos de documento para razaoSocial e nomeFantasia
    const getRazaoSocial = () => {
      if (segmento === "Guia de Turismo") return detail.nome || est.razaoSocial || "";
      if (segmento === "RHC") return detail.nome_proprietario || est.razaoSocial || "";
      if (segmento === "Grupo Folclórico") return detail.razao_social || detail.nome || est.razaoSocial || "";
      if (segmento === "Táxi/Aplicativo") return detail.nome || est.razaoSocial || "";
      return detail.razao_social || est.razaoSocial || "";
    };

    const getNomeFantasia = () => {
      if (segmento === "Guia de Turismo") return detail.nome || est.nomeFantasia || "";
      if (segmento === "RHC") return detail.denominacao_comercial || detail.nome_proprietario || est.nomeFantasia || "";
      if (segmento === "Grupo Folclórico") return detail.nome || detail.razao_social || est.nomeFantasia || "";
      if (segmento === "Táxi/Aplicativo") return detail.empresa || detail.nome || est.nomeFantasia || "";
      return detail.nome_fantasia || detail.razao_social || est.nomeFantasia || "";
    };

    const getDocument = () => {
      if (segmento === "Guia de Turismo") return detail.cpf || est.cnpj || "";
      if (segmento === "RHC") return detail.cpf_proprietario || est.cnpj || "";
      if (segmento === "Grupo Folclórico") return detail.documento || est.cnpj || "";
      if (segmento === "Táxi/Aplicativo") return detail.documento || est.cnpj || "";
      return detail.cnpj || est.cnpj || "";
    };

    // Campos específicos
    const getNumeracaoRHC = () => segmento === "RHC" ? (detail.numeracao_rhc || "") : "";
    const getTipoImovelRHC = () => segmento === "RHC" ? (detail.tipo_imovel || "") : "";

    return {
      razaoSocial: getRazaoSocial(),
      nomeFantasia: getNomeFantasia(),
      cnpj: getDocument(),
      numeracaoRHC: getNumeracaoRHC(),
      tipoImovelRHC: getTipoImovelRHC(),
    };
  };

  const openEditModal = async (est: Estabelecimento) => {
    setEditId(est.id);
    setEditingEndpoint(est.endpoint);
    try {
      const detail = await apiService.getInventoryItem(est.endpoint, est.id);
      const sustainability = Array.isArray(detail.sustentabilidade)
        ? detail.sustentabilidade.map((item: any) => ({
          id: Number(item.id),
          eixo: Number(item.eixo),
          ods: Number(item.ods),
          descricao: item.descricao || "",
          natureza: item.natureza as OdsNatureza,
          ativo: Boolean(item.ativo),
          valor: item.valor == null ? "" : String(item.valor),
        }))
        : [];
      const caracteristicasSelecionadas = Array.isArray(detail.caracteristicas)
        ? detail.caracteristicas.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
        : [];
      const metricas = Array.isArray(detail.metricas)
        ? detail.metricas.map((item: any) => ({
          id: Number(item.id),
          valor: item.valor == null ? "" : String(item.valor),
        }))
        : [];
      const sustainabilityItems = odsCatalog.length > 0
        ? buildOdsItems(odsCatalog, sustainability)
        : sustainability;

      // Normalizar campos para o formulário
      const normalized = normalizeFormData(detail, est.segmento, est);

      setFormData({
        ...createEmptyForm(odsCatalog),
        razaoSocial: normalized.razaoSocial,
        nomeFantasia: normalized.nomeFantasia,
        cnpj: normalized.cnpj,
        numeracaoRHC: normalized.numeracaoRHC,
        tipoImovelRHC: normalized.tipoImovelRHC,
        segmento: est.segmento,
        status: detail.ativo ? "Ativo" : "Inativo",
        sustentabilidade: sustainabilityItems,
        caracteristicasSelecionadas,
        metricas,
      });
      setActiveTab("cadastrais");
      setShowModal(true);
    } catch (error) {
      console.error("Erro ao carregar entidade para edição:", error);
      toast.error("Não foi possível carregar os dados da entidade.");
    }
  };

  const buildPayload = (data: FormData) => {
    const isIndependent = ["Guia de Turismo", "RHC", "Grupo Folclórico", "Táxi/Aplicativo"].includes(data.segmento);
    const documentValue = data.cnpj.replace(/\D/g, "");

    const payload: Record<string, any> = {
      ativo: data.status === "Ativo",
    };

    // Handle document fields based on entity type
    if (data.segmento === "Guia de Turismo") {
      payload.nome = data.nomeFantasia || data.razaoSocial;
      payload.cpf = documentValue || null;
    } else if (data.segmento === "RHC") {
      payload.numeracao_rhc = data.numeracaoRHC || `RHC-${Date.now()}`;
      payload.tipo_imovel = data.tipoImovelRHC || "";
      payload.nome_proprietario = data.razaoSocial || "";
      payload.cpf_proprietario = documentValue || null;
      if (data.leitos) payload.quantidade_leitos = Number(data.leitos);
      if (data.capacidade) payload.capacidade_maxima = Number(data.capacidade);
    } else if (data.segmento === "Grupo Folclórico") {
      payload.nome = data.nomeFantasia || data.razaoSocial;
      payload.razao_social = data.razaoSocial || "";
      const cpfOrCnpj = documentValue;
      if (cpfOrCnpj) {
        payload.tipo_documento = cpfOrCnpj.length === 11 ? "cpf" : "cnpj";
        payload.documento = cpfOrCnpj;
      }
      if (data.categoria) payload.classificacao_grupo = data.categoria;
    } else if (data.segmento === "Táxi/Aplicativo") {
      payload.nome = data.nomeFantasia || data.razaoSocial;
      payload.empresa = data.razaoSocial || "";
      const cpfOrCnpj = documentValue;
      if (cpfOrCnpj) {
        payload.tipo_documento = cpfOrCnpj.length === 11 ? "cpf" : "cnpj";
        payload.documento = cpfOrCnpj;
      }
    } else {
      // Estabelecimento-based entities
      payload.razao_social = data.razaoSocial;
      payload.nome_fantasia = data.nomeFantasia || data.razaoSocial;
      payload.cnpj = documentValue || null;
    }

    // Segment-specific fields
    if (data.segmento === "Meio de Hospedagem") {
      if (data.uhs) payload.uh_total = Number(data.uhs);
      if (data.leitos) payload.leitos = Number(data.leitos);
      if (data.categoria) payload.classificacao = data.categoria;
    }

    if (data.segmento === "Atrativo Turístico") {
      payload.estacionamento = data.estacionamento;
      payload.destaque = data.areaVerde;
      if (data.capacidade) payload.informacoes_gerais = `Capacidade estimada: ${data.capacidade}`;
    }

    if (data.segmento === "Alimentação") {
      payload.estacionamento = data.estacionamento;
      payload.parque = data.areaVerde;
      if (data.categoria) payload.especificacao_gastronomia = data.categoria;
      if (data.capacidade) payload.observacao = `Capacidade informada: ${data.capacidade}`;
    }

    if (data.segmento === "Serviço de Saúde") {
      if (data.categoria) payload.principais_servicos = data.categoria;
      if (data.capacidade) payload.horarios_emergencia = data.capacidade;
    }

    if (data.segmento === "Agência de Viagem") {
      payload.estacionamento = data.estacionamento;
      payload.destinos_inteligentes = data.produtosLocais;
      if (data.categoria) payload.observacao = data.categoria;
    }

    if (data.segmento === "Transporte Turístico") {
      payload.destinos_inteligentes = data.produtosLocais;
      payload.acessibilidade = data.banheirosPCD || data.rampaAcesso;
    }

    if (data.segmento === "Serviço de Apoio") {
      if (data.tipoServico) payload.tipo_servico = data.tipoServico;
      if (data.capacidade) payload.observacao = data.capacidade;
    }

    payload.sustentabilidade = data.sustentabilidade.map((item) => ({
      id: item.id,
      ativo: item.ativo,
      valor: item.natureza === "quant" ? toNumberOrNull(item.valor) : null,
    }));
    payload.caracteristicas = data.caracteristicasSelecionadas;
    payload.metricas = data.metricas.map((item) => ({
      id: item.id,
      valor: toNumberOrNull(item.valor),
    }));

    return payload;
  };

  const handleSave = async () => {
    if (!formData.razaoSocial || !formData.segmento) return;

    setSaving(true);
    try {
      const isEdit = editId !== null;
      const endpoint = isEdit ? editingEndpoint : segmentMapping[formData.segmento];
      if (!endpoint) {
        toast.error("Selecione um segmento válido.");
        return;
      }

      const savedData = isEdit
        ? await apiService.updateInventory(endpoint, editId, buildPayload(formData))
        : await apiService.createInventory(endpoint, buildPayload(formData));

      const formatted = normalizeInventarioItem(savedData, endpoint, formData.segmento as Segmento);

      if (isEdit) {
        setDados((prev) => prev.map((d) => (d.id === editId && d.endpoint === endpoint ? formatted : d)));
      } else {
        setDados((prev) => [...prev, formatted]);
      }
      setShowModal(false);
      setFormData(createEmptyForm(odsCatalog));
      setEditId(null);
      setEditingEndpoint(null);
    } catch (error: any) {
      // Provide detailed diagnostics for failures: network vs server vs validation
      console.error("Erro na requisição ao salvar estabelecimento:", error);
      const resp = error?.response;
      if (resp) {
        const status = resp.status;
        const data = resp.data;
        console.error("Resposta do servidor:", status, data);
        toast.error(`Erro servidor ${status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      } else if (error?.request) {
        // Request made but no response
        console.error("Requisição enviada, sem resposta do servidor:", error.request);
        toast.error("Sem resposta do servidor. Verifique se o backend está rodando e acessível.");
      } else {
        // Something happened setting up the request
        toast.error(error?.message || "Erro desconhecido ao tentar salvar.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Estabelecimento) => {
    try {
      await apiService.deleteInventory(item.endpoint, item.id);
      setDados((prev) => prev.filter((d) => !(d.id === item.id && d.endpoint === item.endpoint)));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Erro na requisição:", error);
      toast.error("Não foi possível remover o estabelecimento.");
    }
  };

  const isHospedagem = formData.segmento === "Meio de Hospedagem";
  const isAtrativo = formData.segmento === "Atrativo Turístico";
  const isServicoApoio = formData.segmento === "Serviço de Apoio";
  const isRHC = formData.segmento === "RHC";

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
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-[#1a6fbf] hover:bg-[#1560a8] text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span className="text-sm">Novo Estabelecimento</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Buscar por razão social, nome, CNPJ ou CPF..."
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
        {isLoading && <span className="text-sm text-[#1a6fbf] animate-pulse">A carregar dados...</span>}
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">CNPJ/CPF</th>
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
                      onClick={() => setDeleteConfirm(est)}
                      className="p-1.5 rounded-md text-[#64748b] hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !isLoading && (
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
                      CNPJ/CPF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: formatCPFOrCNPJ(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] font-mono"
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      maxLength={18}
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
                      onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] font-mono"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Telefone</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
                      placeholder="(17) 99999-9999"
                      maxLength={15}
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
                        disabled={editId !== null}
                        className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white appearance-none pr-8 text-[#334155]"
                      >
                        <option value="">Selecione o segmento...</option>
                        {segmentos.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {editId !== null && (
                        <p className="text-[11px] text-[#94a3b8] mt-1">
                          O segmento fica fixo durante a edição.
                        </p>
                      )}
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
                <div className="space-y-6">
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

                  {isServicoApoio && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <h4 className="text-[#0c2340] mb-3">Serviço de Apoio — Tipo</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Tipo de Serviço</label>
                          <select
                            value={formData.tipoServico}
                            onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 bg-white text-[#334155]"
                          >
                            <option value="">Selecione...</option>
                            <option value="cabeleireiro_barbeiro">Cabeleireiro e Barbeiro</option>
                            <option value="clinica_odontologica">Clínica Odontológica</option>
                            <option value="clinica_medica">Clínica Médica</option>
                            <option value="clinica_veterinaria">Clínica Veterinária</option>
                            <option value="educacao">Educação</option>
                            <option value="farmacia">Farmácia e Drogaria</option>
                            <option value="lavanderia">Lavanderia</option>
                            <option value="posto_combustivel">Posto de Combustível</option>
                            <option value="mecanica">Serviços Automotivos (Mecânica)</option>
                            <option value="servico_seguranca">Serviço de Segurança</option>
                            <option value="supermercado">Supermercado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Observação</label>
                          <input
                            type="text"
                            value={formData.capacidade}
                            onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 bg-white"
                            placeholder="Observações sobre o serviço"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isRHC && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <h4 className="text-[#0c2340] mb-3">RHC — Identificação</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Numeração RHC</label>
                          <input
                            type="text"
                            value={formData.numeracaoRHC}
                            onChange={(e) => setFormData({ ...formData, numeracaoRHC: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-white"
                            placeholder="Ex: RHC-0001"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Tipo de Imóvel</label>
                          <select
                            value={formData.tipoImovelRHC}
                            onChange={(e) => setFormData({ ...formData, tipoImovelRHC: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-white text-[#334155]"
                          >
                            <option value="">Selecione...</option>
                            <option value="apartamento">Apartamento</option>
                            <option value="casa">Casa</option>
                            <option value="chale">Chalé</option>
                            <option value="condominio_temporada">Condomínio de temporada</option>
                            <option value="outros">Outros</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748b] mb-1">Leitos</label>
                          <input
                            type="number"
                            value={formData.leitos}
                            onChange={(e) => setFormData({ ...formData, leitos: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-white"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.segmento && (
                    <CatalogTreeEditor
                      tree={catalogTree}
                      selectedIds={formData.caracteristicasSelecionadas}
                      canEdit={true}
                      canManageOptions={isSuperuser() || isSecretariaAdmin()}
                      onToggleOption={toggleCaracteristica}
                      onToggleSectionQuestion={toggleCatalogSectionQuestion}
                      onCreateOption={createCatalogOption}
                      onEditOption={editCatalogOption}
                      onDeleteOption={deleteCatalogOption}
                      emptyMessage="Nenhum catálogo de infraestrutura disponível para este tipo."
                      title="Infraestrutura e acessibilidade do banco"
                    />
                  )}
                  <div>
                    <h4 className="text-[#0c2340] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Sustentabilidade
                    </h4>
                    <div className="mb-4">
                      <CheckboxItem
                        label="Compra de Produtos Locais"
                        checked={formData.produtosLocais}
                        onChange={(v) => setFormData({ ...formData, produtosLocais: v })}
                      />
                    </div>
                    <div className="grid gap-3">
                      {formData.sustentabilidade.length === 0 && (
                        <div className="rounded-lg border border-dashed border-[#cbd5e1] p-4 text-sm text-[#64748b]">
                          Nenhum indicador ODS cadastrado no banco.
                        </div>
                      )}
                      {formData.sustentabilidade.map((item, index) => (
                        <div key={item.id} className="rounded-lg border border-[#e2e8f0] p-4 space-y-3 bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#0c2340]">
                                ODS {item.ods} — {item.descricao}
                              </p>
                              <p className="text-xs text-[#94a3b8]">
                                Eixo {item.eixo} · {item.natureza === "quant" ? "Quantitativo" : "Qualitativo"}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={item.ativo}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                sustentabilidade: prev.sustentabilidade.map((curr, idx) => (
                                  idx === index ? { ...curr, ativo: e.target.checked } : curr
                                )),
                              }))}
                            />
                          </div>
                          {item.natureza === "quant" && (
                            <div className="max-w-xs">
                              <label className="block text-xs font-medium text-[#64748b] mb-1">Valor</label>
                              <input
                                type="number"
                                value={item.valor}
                                disabled={!item.ativo}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  sustentabilidade: prev.sustentabilidade.map((curr, idx) => (
                                    idx === index ? { ...curr, valor: e.target.value } : curr
                                  )),
                                }))}
                                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] bg-white"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
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
                  disabled={!formData.razaoSocial || !formData.segmento || saving}
                  className="px-5 py-2 text-sm bg-[#1a6fbf] hover:bg-[#1560a8] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-white border-transparent border-t-white rounded-full" />
                      Salvando...
                    </>
                  ) : editId ? "Salvar Alterações" : "Cadastrar Estabelecimento"}
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