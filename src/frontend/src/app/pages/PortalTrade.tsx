import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Plus, Search, Shield, Pencil, Trash2 } from "lucide-react";
import { EstabelecimentoSelectorModal } from "../components/EstabelecimentoSelectorModal";

type TradeUserRecord = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  last_login?: string | null;
  estabelecimento?: {
    id: number;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    tipo: string;
    endpoint: string;
    nivel_permissao: string;
  } | null;
};

type EstablishmentOption = {
  id: number;
  endpoint: string;
  label: string;
  segmento: string;
};

type TradeForm = {
  email: string;
  nome: string;
  apelido: string;
  password: string;
  is_active: boolean;
  establishment_id: string;
  nivel_permissao: "admin" | "editor" | "visualizador";
};

const emptyForm: TradeForm = {
  email: "",
  nome: "",
  apelido: "",
  password: "",
  is_active: true,
  establishment_id: "",
  nivel_permissao: "visualizador",
};

const inventoryEndpoints = [
  "hospedagens",
  "alimentacao",
  "atrativos",
  "espacos-eventos",
  "agencias",
  "organizadores-eventos",
  "locadoras-transporte",
  "artesanato",
  "bancos",
  "templos",
  "saude",
  "apoio",
  "guias",
  "rhc",
  "grupos-folcloricos",
  "taxis",
];

const endpointToSegment: Record<string, string> = {
  hospedagens: "Meio de Hospedagem",
  alimentacao: "Alimentação",
  atrativos: "Atrativo Turístico",
  "espacos-eventos": "Espaço de Evento",
  agencias: "Agência de Viagem",
  "organizadores-eventos": "Organizador de Evento",
  "locadoras-transporte": "Transporte Turístico",
  artesanato: "Artesanato",
  bancos: "Banco",
  templos: "Templo Religioso",
  saude: "Serviço de Saúde",
  apoio: "Serviço de Apoio",
  guias: "Guia de Turismo",
  rhc: "RHC",
  "grupos-folcloricos": "Grupo Folclórico",
  taxis: "Táxi/Aplicativo",
};

export function PortalTrade() {
  const { isTradeUser, isLoading } = useAuth();
  const tradeUser = isTradeUser();
  const [users, setUsers] = useState<TradeUserRecord[]>([]);
  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editing, setEditing] = useState<TradeUserRecord | null>(null);
  const [deleting, setDeleting] = useState<TradeUserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TradeForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log("Carregando Portal Trade...");
        const [tradeUsers, inventoryResults] = await Promise.all([
          apiService.listTradeUsers(),
          Promise.allSettled(inventoryEndpoints.map((endpoint) => apiService.listInventory(endpoint, 100, 1))),
        ]);

        console.log("Trade Users carregados:", tradeUsers.length);
        setUsers(tradeUsers as TradeUserRecord[]);

        const options: EstablishmentOption[] = [];
        let successCount = 0;
        let failCount = 0;

        inventoryResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const paginated = result.value;
            const endpoint = inventoryEndpoints[index];
            const segmento = endpointToSegment[endpoint];
            const items = paginated.results || [];
            successCount++;

            console.log(`${endpoint}: ${items.length} itens carregados`);
            items.forEach((item: any) => {
              options.push({
                id: Number(item.id),
                endpoint,
                segmento,
                label: `${item.nome_fantasia || item.razao_social || `ID ${item.id}`} — ${segmento}`,
              });
            });
          } else if (result.status === "rejected") {
            const endpoint = inventoryEndpoints[index];
            failCount++;
            console.warn(`❌ Falha ao carregar ${endpoint}:`, result.reason);
          }
        });

        console.log(`Estabelecimentos carregados: ${options.length} (${successCount} endpoints OK, ${failCount} falharam)`);
        setEstablishments(options);
      } catch (error) {
        console.error("Erro fatal ao carregar Portal Trade:", error);
        toast.error("Não foi possível carregar o portal do trade.");
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && !tradeUser) {
      load();
    } else if (!isLoading && tradeUser) {
      setLoading(false);
    }
  }, [isLoading, tradeUser]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const role = u.estabelecimento?.nivel_permissao || "visualizador";
      const haystack = [u.email, u.first_name || "", u.last_name || "", u.estabelecimento?.nome_fantasia || "", role]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [users, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: TradeUserRecord) => {
    setEditing(item);
    setForm({
      email: item.email,
      nome: item.first_name || "",
      apelido: item.last_name || "",
      password: "",
      is_active: item.is_active,
      establishment_id: item.estabelecimento?.id ? String(item.estabelecimento.id) : "",
      nivel_permissao: (item.estabelecimento?.nivel_permissao as TradeForm["nivel_permissao"]) || "visualizador",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!form.establishment_id) {
        toast.error("Selecione um estabelecimento.");
        return;
      }
      const payload: Record<string, unknown> = {
        email: form.email,
        username: form.email,
        first_name: form.nome,
        last_name: form.apelido,
        is_active: form.is_active,
        estabelecimento_id: Number(form.establishment_id),
        nivel_permissao: form.nivel_permissao,
      };
      if (form.password.trim()) payload.password = form.password;

      if (editing) {
        const saved = await apiService.updateTradeUser(editing.id, payload);
        setUsers((prev) => prev.map((item) => (item.id === editing.id ? saved : item)));
      } else {
        const saved = await apiService.createTradeUser(payload);
        setUsers((prev) => [saved, ...prev]);
      }

      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await apiService.deleteTradeUser(deleting.id);
      setUsers((prev) => prev.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading || loading) {
    return <div className="p-6 text-[#64748b]">Carregando Portal do Trade...</div>;
  }

  if (tradeUser) {
    return <div className="p-6 text-[#64748b]">Esta tela é exclusiva da Secretaria.</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-[#1a6fbf]" />
            <h1 className="text-[#0c2340]">Portal do Trade</h1>
          </div>
          <p className="text-[#64748b] text-sm">Gestão dos usuários Trade com integração direta ao banco de dados.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#1a6fbf] hover:bg-[#1560a8]">
          <Plus size={16} className="mr-2" />
          Novo usuário trade
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Metric label="Usuários trade" value={users.length} />
        <Metric label="Estabelecimentos" value={establishments.length} />
        <Metric label="Ativos" value={users.filter((u) => u.is_active).length} />
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            className="pl-9"
            placeholder="Buscar por usuário, email ou estabelecimento"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Usuário</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Estabelecimento</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Permissão</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Status</th>
              <th className="text-center px-4 py-3 text-xs uppercase text-[#64748b]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0c2340]">{item.first_name || "—"} {item.last_name || ""}</div>
                  <div className="text-xs text-[#94a3b8]">{item.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-[#334155]">{item.estabelecimento?.nome_fantasia || "—"}</div>
                  <div className="text-xs text-[#94a3b8]">{item.estabelecimento?.nivel_permissao || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{item.estabelecimento?.nivel_permissao || "—"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Ativo" : "Inativo"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-md text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1a6fbf]">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleting(item)} className="p-1.5 rounded-md text-[#64748b] hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário trade" : "Novo usuário trade"}</DialogTitle>
            <DialogDescription>Cadastre ou atualize um usuário do trade com vínculo ao estabelecimento.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></Field>
            <Field label="Nome"><Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} /></Field>
            <Field label="Apelido"><Input value={form.apelido} onChange={(e) => setForm((p) => ({ ...p, apelido: e.target.value }))} /></Field>
            <Field label={editing ? "Nova senha (opcional)" : "Senha"}>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="pr-10" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">{showPassword ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </Field>
            <Field label="Estabelecimento">
              <Button
                variant="outline"
                onClick={() => setSelectorOpen(true)}
                className="h-10 w-full justify-start font-normal text-[#334155]"
              >
                {form.establishment_id
                  ? establishments.find((item) => String(item.id) === form.establishment_id)?.label?.split(" — ")[0] || "Selecionar"
                  : "Pesquisar e selecionar"}
              </Button>
            </Field>
            <Field label="Permissão">
              <select value={form.nivel_permissao} onChange={(e) => setForm((p) => ({ ...p, nivel_permissao: e.target.value as TradeForm["nivel_permissao"] }))} className="h-10 w-full rounded-md border border-[#e2e8f0] bg-white px-3 text-sm">
                <option value="visualizador">Visualizador</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            <div className="flex items-center gap-3 pt-7">
              <input id="active" type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 accent-[#1a6fbf]" />
              <Label htmlFor="active">Usuário ativo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário trade</DialogTitle>
            <DialogDescription>Essa ação remove o usuário e seus vínculos.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <EstabelecimentoSelectorModal
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        establishments={establishments}
        selectedId={form.establishment_id ? Number(form.establishment_id) : undefined}
        onSelect={(est) => {
          setForm((prev) => ({ ...prev, establishment_id: String(est.id) }));
          setSelectorOpen(false);
        }}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="text-2xl font-bold text-[#0c2340]">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
