import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";

export type CatalogOption = {
  id: number;
  categoria: string;
  customizada: boolean;
};

export type CatalogSubgroup = {
  subgrupo_nome: string;
  opcoes: CatalogOption[];
};

export type CatalogSection = {
  secao_id: number;
  secao_nome: string;
  com_pergunta: boolean;
  subgrupos: CatalogSubgroup[];
};

type Props = {
  tree: CatalogSection[];
  selectedIds: number[];
  canEdit: boolean;
  canManageOptions?: boolean;
  onToggleOption: (id: number, checked: boolean) => void;
  onToggleSectionQuestion: (section: CatalogSection, checked: boolean) => void;
  onCreateOption?: (section: CatalogSection, subgroup: CatalogSubgroup, label: string) => Promise<void>;
  onEditOption?: (option: CatalogOption, label: string) => Promise<void>;
  onDeleteOption?: (option: CatalogOption) => Promise<void>;
  emptyMessage: string;
  title?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();
const isNegativeOption = (option: CatalogOption) => normalize(option.categoria) === "não";

export function CatalogTreeEditor({
  tree,
  selectedIds,
  canEdit,
  canManageOptions = false,
  onToggleOption,
  onToggleSectionQuestion,
  onCreateOption,
  onEditOption,
  onDeleteOption,
  emptyMessage,
  title,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  // Define apenas o estado INICIAL de cada seção (uma vez por seção).
  // Não depende de `selectedIds` para não reverter o clique do usuário:
  // depois de inicializada, a seção só muda quando o usuário clica no Sim/Não.
  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const section of tree) {
        if (next[section.secao_id] !== undefined) continue;
        const hasPositive = section.subgrupos.some((group) =>
          group.opcoes.some((option) => selectedIds.includes(option.id) && !isNegativeOption(option))
        );
        next[section.secao_id] = !section.com_pergunta || hasPositive;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const handleToggleSection = (section: CatalogSection, checked: boolean) => {
    setExpandedSections((prev) => ({ ...prev, [section.secao_id]: checked }));
    onToggleSectionQuestion(section, checked);
  };

  const handleCreate = async (section: CatalogSection, subgroup: CatalogSubgroup) => {
    const key = `${section.secao_id}:${subgroup.subgrupo_nome}`;
    const label = (drafts[key] || "").trim();
    if (!label || !onCreateOption) {
      return;
    }

    setCreatingKey(key);
    try {
      await onCreateOption(section, subgroup, label);
      setDrafts((prev) => ({ ...prev, [key]: "" }));
    } finally {
      setCreatingKey(null);
    }
  };

  const beginEdit = (option: CatalogOption) => {
    setEditingOptionId(option.id);
    setEditingValue(option.categoria);
  };

  const cancelEdit = () => {
    setEditingOptionId(null);
    setEditingValue("");
  };

  const saveEdit = async (option: CatalogOption) => {
    if (!onEditOption) {
      return;
    }
    const label = editingValue.trim();
    if (!label) {
      return;
    }
    await onEditOption(option, label);
    cancelEdit();
  };

  if (tree.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#cbd5e1] p-4 text-sm text-[#64748b]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h4 className="text-[#0c2340]">{title}</h4>}
      {tree.map((section) => {
        const expanded = section.com_pergunta ? Boolean(expandedSections[section.secao_id]) : true;

        return (
          <div key={section.secao_id} className="rounded-lg border border-[#e2e8f0] p-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-[#0c2340]">{section.secao_nome}</p>
                <p className="text-xs text-[#94a3b8]">
                  {section.com_pergunta ? "Seção com pergunta" : "Seção sempre aberta"}
                </p>
              </div>

              {section.com_pergunta && (
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleToggleSection(section, !expanded)}
                  className={`relative inline-flex h-6 w-24 items-center rounded-full border border-transparent px-2 text-xs font-medium transition-colors ${
                    expanded ? "bg-emerald-500 text-white justify-end" : "bg-[#cbd5e1] text-[#334155] justify-start"
                  } ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                  aria-pressed={expanded}
                >
                  <span>{expanded ? "Sim" : "Não"}</span>
                </button>
              )}
            </div>

            {section.com_pergunta && !expanded ? (
              <div className="rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
                Selecione "Sim" para visualizar e marcar as opções desta seção.
              </div>
            ) : null}

            {!section.com_pergunta || expanded ? (
              <div className="space-y-4">
                {section.subgrupos.map((group) => {
                  const options = section.com_pergunta
                    ? group.opcoes.filter((option) => !isNegativeOption(option))
                    : group.opcoes;
                  const key = `${section.secao_id}:${group.subgrupo_nome}`;

                  return (
                    <div key={key} className="rounded-md border border-[#f1f5f9] p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-medium text-[#64748b]">{group.subgrupo_nome}</p>

                        {canManageOptions && onCreateOption && (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              value={drafts[key] || ""}
                              onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                              disabled={!canEdit}
                              placeholder="Adicionar nova opção"
                              className="w-56 rounded-md border border-[#e2e8f0] px-3 py-2 text-xs focus:border-[#1a6fbf] focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/20 disabled:bg-[#f8fafc]"
                            />
                            <button
                              type="button"
                              disabled={!canEdit || creatingKey === key}
                              onClick={() => void handleCreate(section, group)}
                              className="inline-flex items-center gap-2 rounded-md bg-[#1a6fbf] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1560a8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Plus size={14} />
                              Adicionar nova opção
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        {options.map((option) => {
                          const editing = editingOptionId === option.id;
                          return (
                            <div
                              key={option.id}
                              className="flex items-start justify-between gap-3 rounded-md border border-[#e2e8f0] px-3 py-2 text-[#334155]"
                            >
                              <label className="flex min-w-0 flex-1 items-start gap-3 text-sm leading-tight">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(option.id)}
                                  disabled={!canEdit || editing}
                                  onChange={(e) => onToggleOption(option.id, e.target.checked)}
                                />

                                {editing ? (
                                  <input
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="min-w-0 flex-1 rounded-md border border-[#cbd5e1] px-2 py-1 text-sm focus:border-[#1a6fbf] focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/20"
                                  />
                                ) : (
                                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                    <span className="whitespace-normal break-words">{option.categoria}</span>
                                    {option.customizada && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-medium text-[#1a6fbf]">
                                        <Check size={10} />
                                        Customizada
                                      </span>
                                    )}
                                  </span>
                                )}
                              </label>

                              {canManageOptions && (
                                <div className="flex items-center gap-1">
                                  {editing ? (
                                    <>
                                      <button
                                        type="button"
                                        disabled={!onEditOption}
                                        onClick={() => void saveEdit(option)}
                                        className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                                        title="Salvar"
                                      >
                                        <Save size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="rounded p-1 text-[#64748b] hover:bg-slate-100"
                                        title="Cancelar"
                                      >
                                        <X size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        disabled={!onEditOption}
                                        onClick={() => beginEdit(option)}
                                        className="rounded p-1 text-[#64748b] hover:bg-slate-100 hover:text-[#1a6fbf]"
                                        title="Editar"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!onDeleteOption}
                                        onClick={() => onDeleteOption?.(option)}
                                        className="rounded p-1 text-[#64748b] hover:bg-red-50 hover:text-red-600"
                                        title="Excluir"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {options.length === 0 && (
                          <div className="rounded-md border border-dashed border-[#cbd5e1] px-3 py-4 text-xs text-[#64748b]">
                            Nenhuma opção disponível neste subgrupo.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
