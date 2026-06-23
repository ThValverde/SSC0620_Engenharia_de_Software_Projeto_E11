import { useEffect, useMemo, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  FolderPlus,
  GripVertical,
  Hash,
  ImageIcon,
  Info,
  List,
  Pencil,
  Plus,
  LayoutGrid,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../services/api";

const CARD_TYPE = "SEARCH_CARD";

type HistoricoImportacao = {
  id: number;
  arquivo: string;
  nome: string;
  fonte: string;
  status: "processado" | "falhou" | string;
  status_label?: string;
  autor_nome: string;
  importado_em: string;
  download_url: string;
};

interface FolderDef {
  id: string;
  name: string;
  color: string;
}

interface Attachment {
  id: string;
  name: string;
  type: "pdf" | "png" | "jpg" | "xlsx";
  size: string;
  date: string;
  url: string;
}

interface SearchCard {
  sourceKey: string;
  title: string;
  folderId: string | null;
  createdAt: string;
  cenario: "expectativa" | "consolidado";
  periodo: string;
  segmentos: string[];
  records: number;
  attachments: Attachment[];
}

const FOLDER_COLORS = ["#1a6fbf", "#16a34a", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const initialFolders: FolderDef[] = [
  { id: "f1", name: "Relatórios 1º Semestre", color: "#1a6fbf" },
  { id: "f2", name: "Planejamento 2026", color: "#16a34a" },
  { id: "f3", name: "Análises Especiais", color: "#8b5cf6" },
];

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText size={13} className="text-red-500" />,
  png: <ImageIcon size={13} className="text-blue-500" />,
  jpg: <ImageIcon size={13} className="text-blue-400" />,
  xlsx: <FileSpreadsheet size={13} className="text-green-600" />,
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileType(name: string): Attachment["type"] {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "png";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  return "pdf";
}

function getFileSizeLabel(value: string) {
  return value ? value : "—";
}

function getSourceKey(item: HistoricoImportacao) {
  return item.fonte?.trim() || "Sem fonte";
}

function groupImports(
  imports: HistoricoImportacao[],
  folders: FolderDef[],
  folderMap: Record<string, string | null>,
  displayTitles: Record<string, string>,
  segmentTagsBySource: Record<string, string[]>
): SearchCard[] {
  const groups = new Map<string, HistoricoImportacao[]>();
  imports.forEach((item) => {
    const key = getSourceKey(item);
    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .map(([sourceKey, records], index) => {
      const sorted = [...records].sort(
        (a, b) => new Date(b.importado_em).getTime() - new Date(a.importado_em).getTime()
      );
      const folderId = folderMap[sourceKey] ?? folders[index % folders.length]?.id ?? null;
      const title = displayTitles[sourceKey] || sourceKey;

      return {
        sourceKey,
        title,
        folderId,
        createdAt: formatDate(sorted[0]?.importado_em ?? new Date().toISOString()),
        cenario: sorted.some((item) => item.status === "falhou") ? "expectativa" : "consolidado",
        periodo: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
          new Date(sorted[0]?.importado_em ?? new Date().toISOString())
        ),
        segmentos: segmentTagsBySource[sourceKey] ?? [],
        records: sorted.length,
        attachments: sorted.map((item) => ({
          id: String(item.id),
          name: item.nome || item.arquivo.split("/").pop() || item.fonte,
          type: getFileType(item.arquivo),
          size: "Importado",
          date: formatDate(item.importado_em),
          url: item.download_url,
        })),
      } satisfies SearchCard;
    })
    .sort((a, b) => b.records - a.records);
}

interface FolderPillProps {
  folder: FolderDef;
  cardCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrop: (cardSourceKey: string, folderId: string) => void;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
}

function FolderPill({ folder, cardCount, isSelected, onSelect, onDrop, onRename, onDelete }: FolderPillProps) {
  const [{ isOver }, drop] = useDrop<{ sourceKey: string }, void, { isOver: boolean }>({
    accept: CARD_TYPE,
    drop: (item) => onDrop(item.sourceKey, folder.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed) onRename(folder.id, trimmed);
    else setRenameValue(folder.name);
    setIsRenaming(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDeleteConfirm(false);
      }}
    >
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        onClick={!isRenaming ? onSelect : undefined}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all select-none relative ${
          isSelected
            ? "text-white shadow-lg"
            : isOver
            ? "shadow-lg scale-[1.04]"
            : "bg-white border border-[#e2e8f0] hover:shadow-sm"
        } ${isRenaming ? "cursor-default" : "cursor-pointer"}`}
        style={
          isSelected
            ? { backgroundColor: folder.color, boxShadow: `0 4px 14px ${folder.color}55` }
            : isOver
            ? { backgroundColor: `${folder.color}10`, border: `2px solid ${folder.color}`, boxShadow: `0 0 0 3px ${folder.color}25` }
            : {}
        }
      >
        {isOver && !isRenaming && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1a6fbf] rounded-full flex items-center justify-center z-10">
            <Plus size={10} className="text-white" />
          </span>
        )}

        <FolderOpen
          size={15}
          className="flex-shrink-0"
          style={{ color: isSelected ? "white" : folder.color }}
        />

        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") {
                  setRenameValue(folder.name);
                  setIsRenaming(false);
                }
              }}
              onBlur={confirmRename}
              onClick={(e) => e.stopPropagation()}
              className={`text-sm font-medium outline-none bg-transparent border-b w-full ${
                isSelected ? "text-white border-white/50" : "text-[#334155] border-[#94a3b8]"
              }`}
              style={{ minWidth: 80 }}
            />
          ) : (
            <p className={`text-sm leading-tight font-medium truncate ${isSelected ? "text-white" : "text-[#334155]"}`}>
              {folder.name}
            </p>
          )}
          <p className={`text-[10px] ${isSelected ? "text-white/70" : "text-[#94a3b8]"}`}>
            {cardCount} busca{cardCount !== 1 ? "s" : ""}
          </p>
        </div>

        {isHovered && !isOver && !isRenaming && (
          <div className="flex gap-0.5 ml-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              title="Renomear pasta"
              onClick={() => {
                setRenameValue(folder.name);
                setIsRenaming(true);
                setShowDeleteConfirm(false);
              }}
              className={`p-1 rounded transition-colors ${
                isSelected
                  ? "hover:bg-white/20 text-white/80 hover:text-white"
                  : "hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#334155]"
              }`}
            >
              <Pencil size={11} />
            </button>
            <button
              title="Excluir pasta"
              onClick={() => {
                setShowDeleteConfirm(true);
                setIsRenaming(false);
              }}
              className={`p-1 rounded transition-colors ${
                isSelected
                  ? "hover:bg-white/20 text-white/80 hover:text-red-200"
                  : "hover:bg-red-50 text-[#94a3b8] hover:text-red-400"
              }`}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-xl p-3.5 w-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -top-1.5 left-5 w-3 h-3 bg-white border-l border-t border-[#e2e8f0] rotate-45" />
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0">
              <Trash2 size={12} className="text-red-500" />
            </div>
            <p className="text-sm text-[#0c2340] font-medium">Excluir pasta?</p>
          </div>
          <p className="text-[11px] text-[#64748b] mb-3 leading-snug">
            {cardCount > 0
              ? `As ${cardCount} busca${cardCount !== 1 ? "s" : ""} serão movidas para "Sem Pasta".`
              : "A pasta está vazia e será removida."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onDelete(folder.id);
                setShowDeleteConfirm(false);
              }}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SemPastaPillProps {
  count: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrop: (cardSourceKey: string) => void;
}

function SemPastaPill({ count, isSelected, onSelect, onDrop }: SemPastaPillProps) {
  const [{ isOver }, drop] = useDrop<{ sourceKey: string }, void, { isOver: boolean }>({
    accept: CARD_TYPE,
    drop: (item) => onDrop(item.sourceKey),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      onClick={onSelect}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all select-none relative ${
        isSelected
          ? "bg-[#475569] text-white shadow-md"
          : isOver
          ? "scale-[1.04] shadow-lg"
          : "bg-white border border-[#e2e8f0] hover:shadow-sm"
      }`}
      style={
        isOver && !isSelected
          ? { backgroundColor: "#f1f5f9", border: "2px dashed #94a3b8", boxShadow: "0 0 0 3px #94a3b825" }
          : {}
      }
    >
      {isOver && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#64748b] rounded-full flex items-center justify-center">
          <X size={9} className="text-white" />
        </span>
      )}
      <FolderOpen size={15} className={isSelected ? "text-white" : "text-[#94a3b8]"} />
      <div>
        <p className={`text-sm leading-tight font-medium ${isSelected ? "text-white" : "text-[#64748b]"}`}>
          Sem Pasta
        </p>
        <p className={`text-[10px] ${isSelected ? "text-white/70" : "text-[#94a3b8]"}`}>
          {count} busca{count !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

interface DraggableCardProps {
  card: SearchCard;
  folders: FolderDef[];
  viewMode: "grid" | "list";
  attachmentSearch: string;
  onAddAttachment: (sourceKey: string, files: File[]) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onDelete: (sourceKey: string) => void;
  onRenameCard: (sourceKey: string, newTitle: string) => void;
  onEdit: (card: SearchCard) => void;
}

function DraggableCard({
  card,
  folders,
  viewMode,
  attachmentSearch,
  onAddAttachment,
  onDeleteAttachment,
  onDelete,
  onRenameCard,
  onEdit,
}: DraggableCardProps) {
  const [{ isDragging }, drag] = useDrag<{ sourceKey: string }, void, { isDragging: boolean }>({
    type: CARD_TYPE,
    item: { sourceKey: card.sourceKey },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [isFileOver, setIsFileOver] = useState(false);
  const folder = folders.find((f) => f.id === card.folderId);
  const normalizedAttachmentSearch = attachmentSearch.trim().toLowerCase();
  const visibleAttachments = normalizedAttachmentSearch
    ? card.attachments.filter((attachment) => attachment.name.toLowerCase().includes(normalizedAttachmentSearch))
    : card.attachments;

  const processFiles = (files: File[]) => {
    const valid = files.filter((f) =>
      ["application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(f.type)
    );
    if (valid.length === 0) {
      toast.error("Selecione arquivos PDF, PNG, JPG ou XLSX.");
      return;
    }
    onAddAttachment(card.sourceKey, valid);
  };

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden transition-all ${
        viewMode === "list" ? "w-full" : ""
      } ${
        isDragging ? "opacity-50 shadow-xl scale-[0.97] cursor-grabbing" : "hover:shadow-md cursor-grab"
      }`}
    >
      {folder && (
        <div className="px-4 pt-3 pb-0">
          <span
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${folder.color}18`, color: folder.color }}
          >
            <FolderOpen size={9} />
            {folder.name}
          </span>
        </div>
      )}

      <div className="p-4 border-b border-[#f1f5f9]">
        <div className="flex items-start gap-2">
          <GripVertical size={16} className="text-[#d1d5db] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 group">
              <h3 className="text-[#0c2340] text-sm leading-snug flex-1">{card.title}</h3>
              <button
                onClick={() => onEdit(card)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#94a3b8] hover:text-[#1a6fbf] hover:bg-blue-50 transition-all"
                title="Editar anexo"
              >
                <Pencil size={12} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                <Calendar size={10} />
                {card.createdAt}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                <Hash size={10} />
                {card.records} registros
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.sourceKey);
            }}
            className="p-1.5 rounded-lg text-[#d1d5db] hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1 mt-2.5 ml-6">
          {card.segmentos.map((seg) => (
            <span key={seg} className="text-[9px] px-1.5 py-0.5 bg-[#f1f5f9] text-[#64748b] rounded">
              {seg}
            </span>
          ))}
        </div>
      </div>

      {visibleAttachments.length > 0 && (
        <div className="px-4 py-2.5 bg-[#fafbfc] border-b border-[#f1f5f9]">
          <p className="text-[9px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Arquivos Anexados</p>
          <div className="space-y-1.5">
            {visibleAttachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 group">
                <span className="flex-shrink-0">{fileTypeIcons[att.type]}</span>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#334155] flex-1 truncate hover:text-[#1a6fbf]"
                >
                  {att.name}
                </a>
                <span className="text-[10px] text-[#94a3b8] flex-shrink-0">{getFileSizeLabel(att.size)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-0.5 rounded text-[#94a3b8] hover:text-[#334155] hover:bg-[#e2e8f0] transition-colors"
                    title="Baixar"
                  >
                    <a href={att.url} target="_blank" rel="noreferrer">
                      <Download size={11} />
                    </a>
                  </button>
                  <button
                    onClick={() => onDeleteAttachment(att.id)}
                    className="p-0.5 rounded text-[#94a3b8] hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsFileOver(true);
          }}
          onDragLeave={() => setIsFileOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsFileOver(false);
            processFiles(Array.from(e.dataTransfer.files));
          }}
          className={`flex flex-col items-center justify-center py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            isFileOver ? "border-[#1a6fbf] bg-[#eff6ff]" : "border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#f8fafc]"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.xlsx"
            multiple
            className="hidden"
            onChange={(e) => processFiles(Array.from(e.target.files || []))}
          />
          <Upload size={14} className={`mb-1 ${isFileOver ? "text-[#1a6fbf]" : "text-[#cbd5e1]"}`} />
          <p className={`text-[10px] text-center leading-snug ${isFileOver ? "text-[#1a6fbf]" : "text-[#94a3b8]"}`}>
            Anexe aqui a visualização final ou gráficos gerados
            <br />
            <span className="text-[9px]">(PDF, PNG, JPG)</span>
          </p>
        </label>
      </div>
    </div>
  );
}

const ALL_SEGMENTS = ["Hotéis", "Pousadas", "Resorts", "Parques Aquáticos", "Restaurantes", "Agências", "Transporte"];

interface CardModalProps {
  initial: Partial<SearchCard> | null;
  folders: FolderDef[];
  onClose: () => void;
  onSave: (data: { title: string; folderId: string | null; segmentos: string[]; files: File[] }) => void;
}

function CardModal({ initial, folders, onClose, onSave }: CardModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [folderId, setFolderId] = useState<string | null>(initial?.folderId ?? null);
  const [segmentos, setSegmentos] = useState<string[]>(initial?.segmentos ?? []);
  const [fileOver, setFileOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const toggleSeg = (seg: string) =>
    setSegmentos((prev) => (prev.includes(seg) ? prev.filter((s) => s !== seg) : [...prev, seg]));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileOver(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0] flex-shrink-0">
          <h3 className="text-[#0c2340]">{initial?.sourceKey ? "Editar Anexo" : "Novo Anexo"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">
              Título da Busca / Relatório <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fluxo de Turistas — Carnaval 2026"
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Pasta</label>
            <div className="relative">
              <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select
                value={folderId ?? ""}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#1a6fbf]/30 focus:border-[#1a6fbf] appearance-none"
              >
                <option value="">— Sem pasta —</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-2">
              Tags de Segmento
              <span className="ml-1 text-[#94a3b8] font-normal">(clique para selecionar)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SEGMENTS.map((seg) => {
                const active = segmentos.includes(seg);
                return (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => toggleSeg(seg)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active ? "bg-[#1a6fbf] text-white shadow-sm" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    {active && <CheckCircle2 size={10} />}
                    {seg}
                  </button>
                );
              })}
            </div>
            {segmentos.length > 0 && (
              <p className="text-[10px] text-[#94a3b8] mt-1.5">
                {segmentos.length} segmento{segmentos.length !== 1 ? "s" : ""} selecionado{segmentos.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-2">Arquivos Anexados</label>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setFileOver(true);
              }}
              onDragLeave={() => setFileOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                fileOver ? "border-[#1a6fbf] bg-[#eff6ff]" : "border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#f8fafc]"
              }`}
            >
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx" multiple className="hidden" onChange={handleFileInput} />
              <Upload size={22} className={`mb-2 ${fileOver ? "text-[#1a6fbf]" : "text-[#cbd5e1]"}`} />
              <p className={`text-sm font-medium ${fileOver ? "text-[#1a6fbf]" : "text-[#64748b]"}`}>
                Arraste e solte os arquivos aqui
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">ou clique para selecionar</p>
              <p className="text-[10px] text-[#cbd5e1] mt-2">PDF, PNG, JPG, XLSX</p>
            </label>

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <FileText size={12} className="text-[#94a3b8] flex-shrink-0" />
                    <span className="text-xs text-[#334155] flex-1 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-[#94a3b8] hover:text-red-400 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-[#e2e8f0] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc]">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title: title.trim(), folderId, segmentos, files });
            }}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm bg-[#1a6fbf] hover:bg-[#1560a8] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {initial?.sourceKey ? "Salvar Alterações" : "Criar Anexo"}
          </button>
        </div>
      </div>
    </div>
  );
}

type SortOrder = "recent" | "modified" | "alpha";

function HistoricoContent() {
  const [folders, setFolders] = useState<FolderDef[]>(initialFolders);
  const [imports, setImports] = useState<HistoricoImportacao[]>([]);
  const [viewFilter, setViewFilter] = useState<"all" | "unassigned" | string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [attachmentSearch, setAttachmentSearch] = useState("");
  const [cardModal, setCardModal] = useState<{ card: Partial<SearchCard> | null } | null>(null);
  const [folderMap, setFolderMap] = useState<Record<string, string | null>>({});
  const [displayTitles, setDisplayTitles] = useState<Record<string, string>>({});
  const [segmentTagsBySource, setSegmentTagsBySource] = useState<Record<string, string[]>>({});

  const load = async () => {
    try {
      const data = await apiService.getHistoricoImportacoes();
      setImports(data);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar o histórico.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const uniqueSources = Array.from(new Set(imports.map((item) => item.fonte?.trim() || "Sem fonte")));
    setFolderMap((prev) => {
      const next = { ...prev };
      uniqueSources.forEach((sourceKey, index) => {
        if (next[sourceKey] === undefined) {
          next[sourceKey] = folders[index % folders.length]?.id ?? null;
        }
      });
      Object.keys(next).forEach((key) => {
        if (!uniqueSources.includes(key)) delete next[key];
      });
      return next;
    });
    setDisplayTitles((prev) => {
      const next = { ...prev };
      uniqueSources.forEach((sourceKey) => {
        if (!next[sourceKey]) next[sourceKey] = sourceKey;
      });
      Object.keys(next).forEach((key) => {
        if (!uniqueSources.includes(key)) delete next[key];
      });
      return next;
    });
    setSegmentTagsBySource((prev) => {
      const next = { ...prev };
      uniqueSources.forEach((sourceKey) => {
        if (!next[sourceKey]) next[sourceKey] = [];
      });
      Object.keys(next).forEach((key) => {
        if (!uniqueSources.includes(key)) delete next[key];
      });
      return next;
    });
  }, [imports, folders]);

  const cards = useMemo(
    () => groupImports(imports, folders, folderMap, displayTitles, segmentTagsBySource),
    [imports, folders, folderMap, displayTitles, segmentTagsBySource]
  );

  const folderItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach((folder) => {
      counts[folder.id] = 0;
    });

    imports.forEach((item) => {
      const sourceKey = getSourceKey(item);
      const folderId = folderMap[sourceKey] ?? null;
      if (folderId) {
        counts[folderId] = (counts[folderId] || 0) + 1;
      }
    });

    return counts;
  }, [imports, folderMap, folders]);

  const unassignedItemCount = useMemo(() => {
    return imports.reduce((total, item) => {
      const sourceKey = getSourceKey(item);
      return total + (folderMap[sourceKey] ? 0 : 1);
    }, 0);
  }, [imports, folderMap]);

  const moveCardToFolder = (sourceKey: string, folderId: string | null) => {
    setFolderMap((prev) => ({ ...prev, [sourceKey]: folderId }));
  };

  const handleAddAttachment = async (sourceKey: string, files: File[]) => {
    try {
      for (const file of files) {
        await apiService.uploadArquivoImportacao(file, sourceKey);
      }
      await load();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await apiService.deleteHistoricoImportacao(Number(attachmentId));
      await load();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCard = (sourceKey: string) => {
    setFolderMap((prev) => {
      const next = { ...prev };
      delete next[sourceKey];
      return next;
    });
    setDisplayTitles((prev) => {
      const next = { ...prev };
      delete next[sourceKey];
      return next;
    });
    setSegmentTagsBySource((prev) => {
      const next = { ...prev };
      delete next[sourceKey];
      return next;
    });
  };

  const handleRenameCard = (sourceKey: string, newTitle: string) => {
    setDisplayTitles((prev) => ({ ...prev, [sourceKey]: newTitle }));
  };

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders((prev) => [
      ...prev,
      {
        id: `f${Date.now()}`,
        name: newFolderName.trim(),
        color: FOLDER_COLORS[prev.length % FOLDER_COLORS.length],
      },
    ]);
    setNewFolderName("");
    setAddingFolder(false);
  };

  const renameFolder = (folderId: string, newName: string) => {
    setFolders((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, name: newName } : folder)));
  };

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
    setFolderMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key] === folderId) next[key] = null;
      });
      return next;
    });
    if (viewFilter === folderId) setViewFilter("all");
  };

  const handleSaveCard = async (data: { title: string; folderId: string | null; segmentos: string[]; files: File[] }) => {
    const sourceKey = cardModal?.card?.sourceKey ?? data.title;

    if (!data.files.length && !cardModal?.card?.sourceKey) {
      toast.error("Selecione ao menos um arquivo.");
      return;
    }

    try {
      for (const file of data.files) {
        await apiService.uploadArquivoImportacao(file, sourceKey);
      }
      setFolderMap((prev) => ({ ...prev, [sourceKey]: data.folderId }));
      setDisplayTitles((prev) => ({ ...prev, [sourceKey]: data.title }));
      setSegmentTagsBySource((prev) => ({ ...prev, [sourceKey]: data.segmentos }));
      await load();
      setCardModal(null);
    } catch (error) {
      console.error(error);
    }
  };

  const baseFiltered = cards.filter((card) => {
    if (viewFilter === "all") return true;
    if (viewFilter === "unassigned") return card.folderId === null;
    return card.folderId === viewFilter;
  });

  const filteredCards = [...baseFiltered].sort((a, b) => {
    if (sortOrder === "alpha") return a.title.localeCompare(b.title, "pt-BR");
    if (sortOrder === "modified") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const searchedCards = useMemo(() => {
    const term = attachmentSearch.trim().toLowerCase();
    if (!term) return filteredCards;
    return filteredCards.filter((card) => {
      const haystack = [card.title, card.sourceKey, ...card.attachments.map((attachment) => attachment.name)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [filteredCards, attachmentSearch]);

  const selectedFolderDef = folders.find((folder) => folder.id === viewFilter);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0c2340]">Histórico e Anexos</h1>
          <p className="text-[#64748b] text-sm mt-0.5">Buscas salvas organizadas em pastas com visualizações centralizadas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <FolderOpen size={16} />
            <span>{imports.length} itens · {folders.length} pastas</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] hover:border-[#1a6fbf] transition-colors shadow-sm"
            >
              <ArrowUpDown size={14} className="text-[#94a3b8]" />
              <span className="hidden md:inline">
                {sortOrder === "recent" && "Criação (Mais recentes)"}
                {sortOrder === "modified" && "Última Modificação"}
                {sortOrder === "alpha" && "Ordem Alfabética (A-Z)"}
              </span>
              <ChevronDown size={13} className={`text-[#94a3b8] transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-30 w-52 overflow-hidden">
                {[
                  { key: "recent", label: "Criação (Mais recentes)" },
                  { key: "modified", label: "Última Modificação" },
                  { key: "alpha", label: "Ordem Alfabética (A-Z)" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortOrder(opt.key as SortOrder);
                      setSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      sortOrder === opt.key ? "bg-blue-50 text-[#1a6fbf] font-medium" : "text-[#334155] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {opt.label}
                    {sortOrder === opt.key && <CheckCircle2 size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center rounded-lg border border-[#e2e8f0] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                viewMode === "grid" ? "bg-[#eff6ff] text-[#1a6fbf]" : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
              aria-label="Visualização em grade"
            >
              <LayoutGrid size={14} />
              Grade
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                viewMode === "list" ? "bg-[#eff6ff] text-[#1a6fbf]" : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
              aria-label="Visualização em lista"
            >
              <List size={14} />
              Lista
            </button>
          </div>

          <div className="min-w-[260px]">
            <input
              type="text"
              value={attachmentSearch}
              onChange={(e) => setAttachmentSearch(e.target.value)}
              placeholder="Buscar por nome do anexo..."
              className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#334155] shadow-sm outline-none focus:border-[#1a6fbf]"
            />
          </div>

          <button
            onClick={() => setCardModal({ card: null })}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a6fbf] hover:bg-[#1560a8] text-white text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            Novo Anexo
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="group relative inline-flex">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] text-[#1a6fbf] shadow-sm"
            aria-label="Informações sobre arrastar e soltar"
          >
            <Info size={14} />
          </button>
          <div className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-80 rounded-xl border border-[#bfdbfe] bg-white p-3 text-xs text-[#334155] shadow-xl group-hover:block">
            <p className="font-medium text-[#1e40af]">Drag & Drop</p>
            <p className="mt-1 leading-relaxed">
              Arraste um cartão para uma pasta para organizar os arquivos. Solte em “Sem Pasta” para remover a associação.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Pastas Organizadoras</p>
          <button
            onClick={() => setAddingFolder(true)}
            className="flex items-center gap-1.5 text-xs text-[#1a6fbf] hover:text-[#1560a8] transition-colors"
          >
            <FolderPlus size={13} />
            Nova Pasta
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setViewFilter("all")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all select-none ${
              viewFilter === "all"
                ? "bg-[#0c2340] text-white shadow-lg"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:shadow-sm"
            }`}
          >
            <FolderOpen size={15} />
            <span className="font-medium">Todas</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                viewFilter === "all" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#94a3b8]"
              }`}
            >
              {cards.length}
            </span>
          </button>

          <SemPastaPill
            count={unassignedItemCount}
            isSelected={viewFilter === "unassigned"}
            onSelect={() => setViewFilter(viewFilter === "unassigned" ? "all" : "unassigned")}
            onDrop={(sourceKey) => moveCardToFolder(sourceKey, null)}
          />

          {folders.map((folder) => (
            <FolderPill
              key={folder.id}
              folder={folder}
              cardCount={folderItemCounts[folder.id] || 0}
              isSelected={viewFilter === folder.id}
              onSelect={() => setViewFilter(viewFilter === folder.id ? "all" : folder.id)}
              onDrop={moveCardToFolder}
              onRename={renameFolder}
              onDelete={deleteFolder}
            />
          ))}

          {addingFolder && (
            <div className="flex items-center gap-2 bg-white border-2 border-[#1a6fbf] rounded-xl px-3 py-2 shadow-sm">
              <FolderPlus size={14} className="text-[#1a6fbf]" />
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addFolder();
                  else if (e.key === "Escape") {
                    setAddingFolder(false);
                    setNewFolderName("");
                  }
                }}
                placeholder="Nome da pasta..."
                className="text-sm text-[#334155] outline-none w-36 bg-transparent"
              />
              <button onClick={addFolder} className="text-[#1a6fbf] hover:text-[#1560a8] transition-colors">
                <CheckCircle2 size={15} />
              </button>
              <button
                onClick={() => {
                  setAddingFolder(false);
                  setNewFolderName("");
                }}
                className="text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewFilter !== "all" && (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedFolderDef?.color ?? "#94a3b8" }} />
          <span className="text-sm text-[#334155] font-medium">
            {viewFilter === "unassigned" ? "Buscas sem pasta" : selectedFolderDef?.name ?? "Pasta"}
          </span>
          <span className="text-xs text-[#94a3b8]">({filteredCards.length} resultado{filteredCards.length !== 1 ? "s" : ""})</span>
          <button
            onClick={() => setViewFilter("all")}
            className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-[#64748b] ml-1 transition-colors"
          >
            <X size={11} /> Limpar filtro
          </button>
        </div>
      )}

      <div className={viewMode === "grid" ? "grid grid-cols-3 gap-4" : "space-y-3"}>
        {searchedCards.map((card) => (
          <DraggableCard
            key={card.sourceKey}
            card={card}
            folders={folders}
            viewMode={viewMode}
            attachmentSearch={attachmentSearch}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onDelete={handleDeleteCard}
            onRenameCard={handleRenameCard}
            onEdit={(c) => setCardModal({ card: c })}
          />
        ))}

        {searchedCards.length === 0 && (
          <div
            className={`bg-white rounded-xl border border-dashed border-[#e2e8f0] flex flex-col items-center justify-center py-16 ${
              viewMode === "grid" ? "col-span-3" : ""
            }`}
          >
            <FolderOpen size={36} className="text-[#cbd5e1] mb-3" />
            <p className="text-[#64748b] text-sm">Nenhuma busca nesta pasta.</p>
            <p className="text-[#94a3b8] text-xs mt-1">Arraste um cartão de outra pasta ou envie um novo anexo.</p>
          </div>
        )}
      </div>

      {cardModal !== null && (
        <CardModal
          initial={cardModal.card}
          folders={folders}
          onClose={() => setCardModal(null)}
          onSave={handleSaveCard}
        />
      )}

      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#1a6fbf] rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-[#1e40af] font-medium">Como usar o Histórico e Anexos</p>
            <p className="text-xs text-[#3b82f6] mt-1 leading-relaxed">
              Após importar um arquivo, ele aparece nesta visualização em cards. Organize os itens em pastas e use a área tracejada para anexar novas visualizações.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelStatus(value: string) {
  if (value === "processado") return "Processado";
  if (value === "falhou") return "Falhou";
  return value;
}

export function Historico() {
  return <HistoricoContent />;
}
