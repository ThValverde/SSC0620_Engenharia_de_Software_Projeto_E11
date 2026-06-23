import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus, Save, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";

type ContactForm = {
  telefone: string;
  email: string;
  cargo: string;
};

type TradeEstablishment = {
  id: number;
  tipo: string;
  tipo_label: string;
  nivel_permissao: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  ativo: boolean;
  cadastur: {
    ativo: boolean;
    numero: string;
    vencimento: string | null;
  };
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    bairro: string;
    regiao: string;
    latitude: string | number | null;
    longitude: string | number | null;
  };
  contatos: ContactForm[];
  infraestrutura: {
    uh_total: number | null;
    leitos: number | null;
    capacidade_maxima: number | null;
  };
  mao_de_obra: {
    qtde_funcionarios_fixos: number | null;
    qtde_funcionarios_temporarios: number | null;
  };
  sustentabilidade: {
    acessibilidade_pcd: boolean;
    mulheres_lideranca: boolean;
    gestao_residuos: boolean;
    fontes_renovaveis: boolean;
  };
};

type TradePortalForm = {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  ativo: boolean;
  cadastur_ativo: boolean;
  cadastur_numero: string;
  cadastur_vencimento: string;
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    bairro: string;
    regiao: string;
    latitude: string;
    longitude: string;
  };
  contatos: ContactForm[];
  infraestrutura: {
    uh_total: string;
    leitos: string;
    capacidade_maxima: string;
  };
  mao_de_obra: {
    qtde_funcionarios_fixos: string;
    qtde_funcionarios_temporarios: string;
  };
  sustentabilidade: {
    acessibilidade_pcd: boolean;
    mulheres_lideranca: boolean;
    gestao_residuos: boolean;
    fontes_renovaveis: boolean;
  };
};

const emptyContact = (): ContactForm => ({ telefone: "", email: "", cargo: "" });

const emptyForm = (): TradePortalForm => ({
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  ativo: true,
  cadastur_ativo: false,
  cadastur_numero: "",
  cadastur_vencimento: "",
  endereco: {
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    regiao: "",
    latitude: "",
    longitude: "",
  },
  contatos: [emptyContact()],
  infraestrutura: {
    uh_total: "",
    leitos: "",
    capacidade_maxima: "",
  },
  mao_de_obra: {
    qtde_funcionarios_fixos: "",
    qtde_funcionarios_temporarios: "",
  },
  sustentabilidade: {
    acessibilidade_pcd: false,
    mulheres_lideranca: false,
    gestao_residuos: false,
    fontes_renovaveis: false,
  },
});

function toDigits(value: string) {
  return value.replace(/\D/g, "");
}

function toNumberOrNull(value: string) {
  const cleaned = value.trim();
  return cleaned === "" ? null : Number(cleaned);
}

function normalizeDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function mapToForm(data: TradeEstablishment): TradePortalForm {
  return {
    nome_fantasia: data.nome_fantasia || "",
    razao_social: data.razao_social || "",
    cnpj: data.cnpj || "",
    ativo: data.ativo,
    cadastur_ativo: data.cadastur?.ativo ?? false,
    cadastur_numero: data.cadastur?.numero || "",
    cadastur_vencimento: normalizeDate(data.cadastur?.vencimento),
    endereco: {
      cep: data.endereco?.cep || "",
      rua: data.endereco?.rua || "",
      numero: data.endereco?.numero || "",
      bairro: data.endereco?.bairro || "",
      regiao: data.endereco?.regiao || "",
      latitude: data.endereco?.latitude?.toString() || "",
      longitude: data.endereco?.longitude?.toString() || "",
    },
    contatos: data.contatos?.length ? data.contatos.map((contato) => ({ telefone: contato.telefone || "", email: contato.email || "", cargo: contato.cargo || "" })) : [emptyContact()],
    infraestrutura: {
      uh_total: data.infraestrutura?.uh_total?.toString() || "",
      leitos: data.infraestrutura?.leitos?.toString() || "",
      capacidade_maxima: data.infraestrutura?.capacidade_maxima?.toString() || "",
    },
    mao_de_obra: {
      qtde_funcionarios_fixos: data.mao_de_obra?.qtde_funcionarios_fixos?.toString() || "",
      qtde_funcionarios_temporarios: data.mao_de_obra?.qtde_funcionarios_temporarios?.toString() || "",
    },
    sustentabilidade: { ...data.sustentabilidade },
  };
}

export function TradePortalPage() {
  const { user, isTradeUser, isLoading } = useAuth();
  const tradeUser = isTradeUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entity, setEntity] = useState<TradeEstablishment | null>(null);
  const [form, setForm] = useState<TradePortalForm>(emptyForm());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiService.getMyTradeEstablishment();
        setEntity(data);
        setForm(mapToForm(data));
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar o estabelecimento do trade.");
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && tradeUser) {
      load();
    }
  }, [isLoading, tradeUser]);

  const permission = entity?.nivel_permissao || "visualizador";
  const canEdit = permission === "editor" || permission === "admin";
  const canToggleActive = permission === "admin";
  const tipo = entity?.tipo || "";

  const infraFields = useMemo(() => {
    if (tipo === "meio_hospedagem") {
      return { title: "Hospedagem", mode: "hotel" as const };
    }
    if (tipo === "meio_alimentacao_bebida" || tipo === "atrativo") {
      return { title: "Capacidade máxima", mode: "capacidade" as const };
    }
    return { title: "Sem campos específicos", mode: "none" as const };
  }, [tipo]);

  const addContact = () => {
    setForm((prev) => ({ ...prev, contatos: [...prev.contatos, emptyContact()] }));
  };

  const updateContact = (index: number, field: keyof ContactForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      contatos: prev.contatos.map((contato, idx) => (idx === index ? { ...contato, [field]: value } : contato)),
    }));
  };

  const removeContact = (index: number) => {
    setForm((prev) => ({
      ...prev,
      contatos: prev.contatos.length > 1 ? prev.contatos.filter((_, idx) => idx !== index) : [emptyContact()],
    }));
  };

  const handleSubmit = async () => {
    if (!entity) return;
    if (!canEdit) {
      toast.error("Seu nível de acesso permite apenas visualização.");
      return;
    }

    const payload = {
      nome_fantasia: form.nome_fantasia,
      razao_social: form.razao_social,
      cnpj: toDigits(form.cnpj),
      ativo: form.ativo,
      cadastur: {
        ativo: form.cadastur_ativo,
        numero: form.cadastur_numero,
        vencimento: form.cadastur_vencimento || null,
      },
      endereco: {
        cep: toDigits(form.endereco.cep),
        rua: form.endereco.rua,
        numero: form.endereco.numero,
        bairro: form.endereco.bairro,
        regiao: form.endereco.regiao,
        latitude: form.endereco.latitude ? Number(form.endereco.latitude) : null,
        longitude: form.endereco.longitude ? Number(form.endereco.longitude) : null,
      },
      contatos: form.contatos
        .map((contato) => ({
          telefone: contato.telefone.trim(),
          email: contato.email.trim(),
          cargo: contato.cargo.trim(),
        }))
        .filter((contato) => contato.telefone || contato.email || contato.cargo),
      infraestrutura: {
        uh_total: tipo === "meio_hospedagem" ? toNumberOrNull(form.infraestrutura.uh_total) : null,
        leitos: tipo === "meio_hospedagem" ? toNumberOrNull(form.infraestrutura.leitos) : null,
        capacidade_maxima: tipo === "meio_alimentacao_bebida" || tipo === "atrativo"
          ? toNumberOrNull(form.infraestrutura.capacidade_maxima)
          : null,
      },
      mao_de_obra: {
        qtde_funcionarios_fixos: toNumberOrNull(form.mao_de_obra.qtde_funcionarios_fixos),
        qtde_funcionarios_temporarios: toNumberOrNull(form.mao_de_obra.qtde_funcionarios_temporarios),
      },
      sustentabilidade: form.sustentabilidade,
    };

    try {
      setSaving(true);
      const saved = await apiService.updateMyTradeEstablishment(payload);
      setEntity(saved);
      setForm(mapToForm(saved));
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return <div className="p-6 text-[#64748b]">Carregando portal do trade...</div>;
  }

  if (!tradeUser) {
    return <div className="p-6 text-[#64748b]">Esta área é exclusiva para usuários do trade.</div>;
  }

  if (!entity) {
    return <div className="p-6 text-[#64748b]">Nenhum estabelecimento vinculado foi encontrado.</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <Card className="border-[#dbe4ee]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#1a6fbf]" />
                <CardTitle className="text-[#0c2340]">Portal do Trade</CardTitle>
              </div>
              <CardDescription>Edite os dados da entidade vinculada diretamente no banco.</CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{entity.tipo_label}</Badge>
                <Badge variant={entity.ativo ? "default" : "outline"}>{entity.ativo ? "Ativo" : "Inativo"}</Badge>
                <Badge variant="outline">Permissão: {permission}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#64748b]">Usuário logado</p>
              <p className="text-sm font-medium text-[#0c2340]">{user?.first_name || user?.username}</p>
              <p className="text-xs text-[#94a3b8]">{entity.nome_fantasia || entity.razao_social}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="infraestrutura">Infraestrutura</TabsTrigger>
          <TabsTrigger value="mao-de-obra">Mão de obra</TabsTrigger>
          <TabsTrigger value="sustentabilidade">Sustentabilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card className="border-[#dbe4ee]">
            <CardHeader>
              <CardTitle className="text-[#0c2340]">Dados gerais</CardTitle>
              <CardDescription>Razão social, endereço, contatos, status e Cadastur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Razão social">
                  <Input value={form.razao_social} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, razao_social: e.target.value }))} />
                </Field>
                <Field label="Nome fantasia">
                  <Input value={form.nome_fantasia} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, nome_fantasia: e.target.value }))} />
                </Field>
                <Field label="CNPJ">
                  <Input value={form.cnpj} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))} />
                </Field>
                <div className="flex items-center justify-between rounded-md border border-[#e2e8f0] px-3 py-2">
                  <div>
                    <Label htmlFor="ativo">Status do estabelecimento</Label>
                    <p className="text-xs text-[#94a3b8]">Ativo ou inativo no inventário</p>
                  </div>
                  <Switch
                    id="ativo"
                    checked={form.ativo}
                    disabled={!canToggleActive}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, ativo: checked }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="CEP">
                  <Input value={form.endereco.cep} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, cep: e.target.value } }))} />
                </Field>
                <Field label="Rua">
                  <Input value={form.endereco.rua} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, rua: e.target.value } }))} />
                </Field>
                <Field label="Número">
                  <Input value={form.endereco.numero} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, numero: e.target.value } }))} />
                </Field>
                <Field label="Bairro">
                  <Input value={form.endereco.bairro} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))} />
                </Field>
                <Field label="Região">
                  <Input value={form.endereco.regiao} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, regiao: e.target.value } }))} />
                </Field>
                <Field label="Latitude">
                  <Input value={form.endereco.latitude} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, latitude: e.target.value } }))} />
                </Field>
                <Field label="Longitude">
                  <Input value={form.endereco.longitude} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, longitude: e.target.value } }))} />
                </Field>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-[#0c2340]">Contatos</h4>
                    <p className="text-xs text-[#94a3b8]">Cadastre um ou mais contatos da entidade.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addContact} disabled={!canEdit}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar contato
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.contatos.map((contato, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <Input placeholder="Telefone" value={contato.telefone} disabled={!canEdit} onChange={(e) => updateContact(index, "telefone", e.target.value)} />
                      <Input placeholder="E-mail" value={contato.email} disabled={!canEdit} onChange={(e) => updateContact(index, "email", e.target.value)} />
                      <Input placeholder="Cargo" value={contato.cargo} disabled={!canEdit} onChange={(e) => updateContact(index, "cargo", e.target.value)} />
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" disabled={!canEdit} onClick={() => removeContact(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Cadastur ativo">
                  <div className="flex items-center gap-3 rounded-md border border-[#e2e8f0] px-3 py-2">
                    <Switch
                      checked={form.cadastur_ativo}
                      disabled={!canEdit}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, cadastur_ativo: checked }))}
                    />
                    <span className="text-sm text-[#334155]">Registro válido</span>
                  </div>
                </Field>
                <Field label="Número do Cadastur">
                  <Input value={form.cadastur_numero} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, cadastur_numero: e.target.value }))} />
                </Field>
                <Field label="Validade do Cadastur">
                  <Input type="date" value={form.cadastur_vencimento} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, cadastur_vencimento: e.target.value }))} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infraestrutura">
          <Card className="border-[#dbe4ee]">
            <CardHeader>
              <CardTitle className="text-[#0c2340]">{infraFields.title}</CardTitle>
              <CardDescription>Campos específicos conforme o tipo da entidade.</CardDescription>
            </CardHeader>
            <CardContent>
              {infraFields.mode === "hotel" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Quantidade de UHs">
                    <Input type="number" value={form.infraestrutura.uh_total} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, infraestrutura: { ...prev.infraestrutura, uh_total: e.target.value } }))} />
                  </Field>
                  <Field label="Quantidade de leitos">
                    <Input type="number" value={form.infraestrutura.leitos} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, infraestrutura: { ...prev.infraestrutura, leitos: e.target.value } }))} />
                  </Field>
                </div>
              )}

              {infraFields.mode === "capacidade" && (
                <div className="max-w-md">
                  <Field label="Capacidade máxima">
                    <Input type="number" value={form.infraestrutura.capacidade_maxima} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, infraestrutura: { ...prev.infraestrutura, capacidade_maxima: e.target.value } }))} />
                  </Field>
                </div>
              )}

              {infraFields.mode === "none" && (
                <div className="rounded-lg border border-dashed border-[#cbd5e1] p-6 text-sm text-[#64748b]">
                  Este tipo de entidade não possui campos específicos nesta aba.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mao-de-obra">
          <Card className="border-[#dbe4ee]">
            <CardHeader>
              <CardTitle className="text-[#0c2340]">Mão de obra</CardTitle>
              <CardDescription>Quantidade de funcionários fixos e temporários.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Funcionários fixos">
                  <Input type="number" value={form.mao_de_obra.qtde_funcionarios_fixos} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, mao_de_obra: { ...prev.mao_de_obra, qtde_funcionarios_fixos: e.target.value } }))} />
                </Field>
                <Field label="Funcionários temporários">
                  <Input type="number" value={form.mao_de_obra.qtde_funcionarios_temporarios} disabled={!canEdit} onChange={(e) => setForm((prev) => ({ ...prev, mao_de_obra: { ...prev.mao_de_obra, qtde_funcionarios_temporarios: e.target.value } }))} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sustentabilidade">
          <Card className="border-[#dbe4ee]">
            <CardHeader>
              <CardTitle className="text-[#0c2340]">Sustentabilidade (ODS)</CardTitle>
              <CardDescription>Marque os indicadores que a entidade possui.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ToggleOption
                  label="Acessibilidade PCD"
                  description="Registro booleano para acessibilidade."
                  checked={form.sustentabilidade.acessibilidade_pcd}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, sustentabilidade: { ...prev.sustentabilidade, acessibilidade_pcd: checked } }))}
                />
                <ToggleOption
                  label="Mulheres na liderança (ODS 5)"
                  description="Indicador relacionado à presença feminina."
                  checked={form.sustentabilidade.mulheres_lideranca}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, sustentabilidade: { ...prev.sustentabilidade, mulheres_lideranca: checked } }))}
                />
                <ToggleOption
                  label="Gestão de resíduos (ODS 12)"
                  description="Boas práticas ambientais."
                  checked={form.sustentabilidade.gestao_residuos}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, sustentabilidade: { ...prev.sustentabilidade, gestao_residuos: checked } }))}
                />
                <ToggleOption
                  label="Fontes renováveis (ODS 7)"
                  description="Uso de energia limpa ou renovável."
                  checked={form.sustentabilidade.fontes_renovaveis}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, sustentabilidade: { ...prev.sustentabilidade, fontes_renovaveis: checked } }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-3">
        {!canEdit && (
          <div className="flex items-center gap-2 text-sm text-[#64748b] mr-auto">
            <Shield className="h-4 w-4" />
            Apenas visualização para este nível de acesso.
          </div>
        )}
        <Button variant="outline" onClick={() => setForm(mapToForm(entity))} disabled={!canEdit || saving}>
          Recarregar
        </Button>
        <Button onClick={handleSubmit} disabled={!canEdit || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#0c2340]">{label}</Label>
      {children}
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-[#e2e8f0] p-4">
      <div>
        <p className="text-sm font-medium text-[#0c2340]">{label}</p>
        <p className="text-xs text-[#64748b]">{description}</p>
      </div>
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
    </div>
  );
}
