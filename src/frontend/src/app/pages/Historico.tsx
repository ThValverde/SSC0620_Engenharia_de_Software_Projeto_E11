import { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  FolderOpen, Upload, FileText, ImageIcon, Trash2, Download,
  Plus, X, Calendar, FileSpreadsheet, CheckCircle2,
  GripVertical, FolderPlus, Hash, Pencil, ArrowUpDown, ChevronDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────
const CARD_TYPE = "SEARCH_CARD";

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
}

interface SearchCard {
  id: number;
  title: string;
  folderId: string | null;
  createdAt: string;
  cenario: "expectativa" | "consolidado";
  periodo: string;
  segmentos: string[];
  records: number;
  attachments: Attachment[];
  isEditing?: boolean;
}

// ─── Initial Data ────────────────────────────────────────────
const FOLDER_COLORS = ["#1a6fbf", "#16a34a", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const initialFolders: FolderDef[] = [
  { id: "f1", name: "Relatórios 1º Semestre", color: "#1a6fbf" },
  { id: "f2", name: "Planejamento 2026", color: "#16a34a" },
  { id: "f3", name: "Análises Especiais", color: "#8b5cf6" },
];

const initialCards: SearchCard[] = [
  {
    id: 1, title: "Fluxo de Turistas — Carnaval 2025", folderId: "f1",
    createdAt: "05/03/2025", cenario: "consolidado", periodo: "Fev 2025",
    segmentos: ["Hotéis", "Pousadas", "Parques Aquáticos"], records: 8,
    attachments: [{ id: "a1", name: "grafico_carnaval.pdf", type: "pdf", size: "1,2 MB", date: "06/03/2025" }],
  },
  {
    id: 2, title: "Ocupação Hoteleira — Páscoa 2025", folderId: "f1",
    createdAt: "22/04/2025", cenario: "consolidado", periodo: "Abr 2025",
    segmentos: ["Hotéis", "Pousadas", "Resorts"], records: 14,
    attachments: [],
  },
  {
    id: 3, title: "Expectativa Natal / Réveillon 2025", folderId: null,
    createdAt: "01/11/2025", cenario: "expectativa", periodo: "Dez 2025",
    segmentos: ["Hotéis", "Resorts", "Restaurantes"], records: 22,
    attachments: [{ id: "a3", name: "expectativa_natal25.xlsx", type: "xlsx", size: "256 KB", date: "01/11/2025" }],
  },
  {
    id: 4, title: "Análise Corpus Christi 2025", folderId: "f1",
    createdAt: "25/06/2025", cenario: "consolidado", periodo: "Jun 2025",
    segmentos: ["Hotéis", "Parques Aquáticos"], records: 11,
    attachments: [],
  },
  {
    id: 5, title: "Projeção Carnaval 2026", folderId: "f2",
    createdAt: "15/10/2025", cenario: "expectativa", periodo: "Fev 2026",
    segmentos: ["Hotéis", "Parques", "Restaurantes"], records: 18,
    attachments: [],
  },
  {
    id: 6, title: "Fluxo Julho 2025 — Férias Escolares", folderId: null,
    createdAt: "05/08/2025", cenario: "consolidado", periodo: "Jul 2025",
    segmentos: ["Hotéis", "Resorts", "Parques", "Restaurantes"], records: 31,
    attachments: [{ id: "a4", name: "dashboard_julho25.png", type: "png", size: "1,8 MB", date: "06/08/2025" }],
  },
];

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText size={13} className="text-red-500" />,
  png: <ImageIcon size={13} className="text-blue-500" />,
  jpg: <ImageIcon size={13} className="text-blue-400" />,
  xlsx: <FileSpreadsheet size={13} className="text-green-600" />,
};

// ─── Droppable Folder Pill ───────────────────────────────────
interface FolderPillProps {
  folder: FolderDef;
  cardCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrop: (cardId: number, folderId: string) => void;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
}

function FolderPill({ folder, cardCount, isSelected, onSelect, onDrop, onRename, onDelete }: FolderPillProps) {
  const [{ isOver }, drop] = useDrop<{ id: number }, void, { isOver: boolean }>({
    accept: CARD_TYPE,
    drop: (item) => onDrop(item.id, folder.id),
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

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(folder.name);
    setIsRenaming(true);
    setShowDeleteConfirm(false);
  };

  const openDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setIsRenaming(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowDeleteConfirm(false); }}
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
        {/* DnD "drop here" badge */}
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
                else if (e.key === "Escape") { setRenameValue(folder.name); setIsRenaming(false); }
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

        {/* Action icons — visible on hover, hidden while dragging over or renaming */}
        {isHovered && !isOver && !isRenaming && (
          <div
            className="flex gap-0.5 ml-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="Renomear pasta"
              onClick={startRename}
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
              onClick={openDeleteConfirm}
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

      {/* Delete confirmation popover */}
      {showDeleteConfirm && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-xl p-3.5 w-60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
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
              onClick={() => { onDelete(folder.id); setShowDeleteConfirm(false); }}
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

// ─── Droppable "Sem Pasta" Pill ──────────────────────────────
interface SemPastaPillProps {
  count: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrop: (cardId: number) => void;
}

function SemPastaPill({ count, isSelected, onSelect, onDrop }: SemPastaPillProps) {
  const [{ isOver }, drop] = useDrop<{ id: number }, void, { isOver: boolean }>({
    accept: CARD_TYPE,
    drop: (item) => onDrop(item.id),
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

// ─── Draggable Card ──────────────────────────────────────────
interface DraggableCardProps {
  card: SearchCard;
  folders: FolderDef[];
  onAddAttachment: (cardId: number, files: File[]) => void;
  onDeleteAttachment: (cardId: number, attId: string) => void;
  onDelete: (cardId: number) => void;
  onRenameCard: (cardId: number, newTitle: string) => void;
  onEdit: (card: SearchCard) => void;
}

function DraggableCard({ card, folders, onAddAttachment, onDeleteAttachment, onDelete, onRenameCard, onEdit }: DraggableCardProps) {
  const [{ isDragging }, drag] = useDrag<{ id: number }, void, { isDragging: boolean }>({
    type: CARD_TYPE,
    item: { id: card.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [isFileOver, setIsFileOver] = useState(false);
  const folder = folders.find((f) => f.id === card.folderId);

  const processFiles = (files: File[]) => {
    const valid = files.filter((f) =>
      ["application/pdf", "image/png", "image/jpeg",
       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(f.type)
    ).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      type: (f.name.split(".").pop()?.toLowerCase() as Attachment["type"]) || "pdf",
      size: f.size > 1024 * 1024
        ? `${(f.size / 1024 / 1024).toFixed(1)} MB`
        : `${Math.round(f.size / 1024)} KB`,
      date: new Date().toLocaleDateString("pt-BR"),
    }));
    onAddAttachment(card.id, valid as unknown as File[]);
  };

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden transition-all ${
        isDragging
          ? "opacity-50 shadow-xl scale-[0.97] cursor-grabbing"
          : "hover:shadow-md cursor-grab"
      }`}
    >
      {/* Folder badge */}
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

      {/* Header */}
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
                <Calendar size={10} />{card.createdAt}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                <Hash size={10} />{card.records} registros
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            className="p-1.5 rounded-lg text-[#d1d5db] hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Segments */}
        <div className="flex flex-wrap gap-1 mt-2.5 ml-6">
          {card.segmentos.map((seg) => (
            <span key={seg} className="text-[9px] px-1.5 py-0.5 bg-[#f1f5f9] text-[#64748b] rounded">
              {seg}
            </span>
          ))}
        </div>
      </div>

      {/* Attachments */}
      {card.attachments.length > 0 && (
        <div className="px-4 py-2.5 bg-[#fafbfc] border-b border-[#f1f5f9]">
          <p className="text-[9px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
            Arquivos Anexados
          </p>
          <div className="space-y-1.5">
            {card.attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 group">
                <span className="flex-shrink-0">{fileTypeIcons[att.type]}</span>
                <span className="text-xs text-[#334155] flex-1 truncate">{att.name}</span>
                <span className="text-[10px] text-[#94a3b8] flex-shrink-0">{att.size}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-0.5 rounded text-[#94a3b8] hover:text-[#334155] hover:bg-[#e2e8f0] transition-colors">
                    <Download size={11} />
                  </button>
                  <button
                    onClick={() => onDeleteAttachment(card.id, att.id)}
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

      {/* Upload Zone */}
      <div className="p-3">
        <label
          onDragOver={(e) => { e.preventDefault(); setIsFileOver(true); }}
          onDragLeave={() => setIsFileOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsFileOver(false);
            processFiles(Array.from(e.dataTransfer.files));
          }}
          className={`flex flex-col items-center justify-center py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            isFileOver
              ? "border-[#1a6fbf] bg-[#eff6ff]"
              : "border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#f8fafc]"
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
            Anexe aqui a visualização final ou gráficos gerados<br />
            <span className="text-[9px]">(PDF, PNG, JPG)</span>
          </p>
        </label>
      </div>
    </div>
  );
}

// ─── Modal de criação / edição ───────────────────────────────
const ALL_SEGMENTS = ["Hotéis", "Pousadas", "Resorts", "Parques Aquáticos", "Restaurantes", "Agências", "Transporte"];

interface CardModalProps {
  initial: Partial<SearchCard> | null;
  folders: FolderDef[];
  onClose: () => void;
  onSave: (data: { title: string; folderId: string | null; segmentos: string[] }) => void;
}

function CardModal({ initial, folders, onClose, onSave }: CardModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [folderId, setFolderId] = useState<string | null>(initial?.folderId ?? null);
  const [segmentos, setSegmentos] = useState<string[]>(initial?.segmentos ?? []);
  const [fileOver, setFileOver] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  const toggleSeg = (seg: string) =>
    setSegmentos((prev) => prev.includes(seg) ? prev.filter((s) => s !== seg) : [...prev, seg]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileOver(false);
    const names = Array.from(e.dataTransfer.files).map((f) => f.name);
    setFiles((prev) => [...prev, ...names]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files || []).map((f) => f.name);
    setFiles((prev) => [...prev, ...names]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0] flex-shrink-0">
          <h3 className="text-[#0c2340]">{initial?.id ? "Editar Anexo" : "Novo Anexo"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Título */}
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

          {/* Pasta */}
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
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
          </div>

          {/* Tags de Segmento */}
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
                      active
                        ? "bg-[#1a6fbf] text-white shadow-sm"
                        : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
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

          {/* Upload */}
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-2">Arquivos Anexados</label>
            <label
              onDragOver={(e) => { e.preventDefault(); setFileOver(true); }}
              onDragLeave={() => setFileOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                fileOver
                  ? "border-[#1a6fbf] bg-[#eff6ff]"
                  : "border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#f8fafc]"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
              <Upload size={22} className={`mb-2 ${fileOver ? "text-[#1a6fbf]" : "text-[#cbd5e1]"}`} />
              <p className={`text-sm font-medium ${fileOver ? "text-[#1a6fbf]" : "text-[#64748b]"}`}>
                Arraste e solte os arquivos aqui
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">ou clique para selecionar</p>
              <p className="text-[10px] text-[#cbd5e1] mt-2">PDF, PNG, JPG, XLSX</p>
            </label>

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <FileText size={12} className="text-[#94a3b8] flex-shrink-0" />
                    <span className="text-xs text-[#334155] flex-1 truncate">{name}</span>
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

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-[#e2e8f0] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc]">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title: title.trim(), folderId, segmentos });
            }}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm bg-[#1a6fbf] hover:bg-[#1560a8] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {initial?.id ? "Salvar Alterações" : "Criar Anexo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inner Content (needs DndProvider context) ───────────────
type SortOrder = "recent" | "modified" | "alpha";

function HistoricoContent() {
  const [folders, setFolders] = useState<FolderDef[]>(initialFolders);
  const [cards, setCards] = useState<SearchCard[]>(initialCards);
  const [viewFilter, setViewFilter] = useState<"all" | "unassigned" | string>("all");
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [cardModal, setCardModal] = useState<{ card: Partial<SearchCard> | null } | null>(null);

  const moveCardToFolder = (cardId: number, folderId: string | null) => {
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, folderId } : c));
  };

  const handleAddAttachment = (cardId: number, newAtts: File[]) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, attachments: [...c.attachments, ...(newAtts as unknown as Attachment[])] }
          : c
      )
    );
  };

  const handleDeleteAttachment = (cardId: number, attId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, attachments: c.attachments.filter((a) => a.id !== attId) }
          : c
      )
    );
  };

  const handleDeleteCard = (cardId: number) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleRenameCard = (cardId: number, newTitle: string) => {
    // Verifica se já existe outro card com o mesmo nome
    const exists = cards.some((c) => c.id !== cardId && c.title.toLowerCase() === newTitle.toLowerCase());
    if (exists) {
      alert("Já existe um anexo com este nome. Por favor, escolha outro nome.");
      return;
    }
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, title: newTitle } : c)));
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
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, name: newName }
          : f
      )
    );
  };

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setCards((prev) =>
      prev.map((c) =>
        c.folderId === folderId
          ? { ...c, folderId: null }
          : c
      )
    );
    if (viewFilter === folderId) setViewFilter("all");
  };

  const handleSaveCard = (data: { title: string; folderId: string | null; segmentos: string[] }) => {
    if (cardModal?.card?.id) {
      // edit
      setCards((prev) => prev.map((c) => c.id === cardModal.card!.id ? { ...c, ...data } : c));
    } else {
      // create
      const newCard: SearchCard = {
        id: Date.now(),
        title: data.title,
        folderId: data.folderId,
        createdAt: new Date().toLocaleDateString("pt-BR"),
        cenario: "consolidado",
        periodo: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        segmentos: data.segmentos,
        records: 0,
        attachments: [],
      };
      setCards((prev) => [newCard, ...prev]);
    }
    setCardModal(null);
  };

  const baseFiltered = cards.filter((c) => {
    if (viewFilter === "all") return true;
    if (viewFilter === "unassigned") return c.folderId === null;
    return c.folderId === viewFilter;
  });

  const filteredCards = [...baseFiltered].sort((a, b) => {
    if (sortOrder === "alpha") return a.title.localeCompare(b.title, "pt-BR");
    if (sortOrder === "modified") return b.id - a.id; // proxy: last modified ≈ higher id
    return b.id - a.id; // recent: newest first
  });

  const selectedFolderDef = folders.find((f) => f.id === viewFilter);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0c2340]">Histórico e Anexos</h1>
          <p className="text-[#64748b] text-sm mt-0.5">
            Buscas salvas organizadas em pastas com visualizações centralizadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <FolderOpen size={16} />
            <span>{cards.length} buscas · {folders.length} pastas</span>
          </div>

          {/* Dropdown de ordenação */}
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
                {([
                  { key: "recent", label: "Criação (Mais recentes)" },
                  { key: "modified", label: "Última Modificação" },
                  { key: "alpha", label: "Ordem Alfabética (A-Z)" },
                ] as { key: SortOrder; label: string }[]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortOrder(opt.key); setSortOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      sortOrder === opt.key
                        ? "bg-blue-50 text-[#1a6fbf] font-medium"
                        : "text-[#334155] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {opt.label}
                    {sortOrder === opt.key && <CheckCircle2 size={13} />}
                  </button>
                ))}
              </div>
            )}
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

      {/* DnD hint */}
      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl px-4 py-2.5 flex items-center gap-2.5">
        <div className="w-6 h-6 bg-[#1a6fbf] rounded-md flex items-center justify-center flex-shrink-0">
          <GripVertical size={13} className="text-white" />
        </div>
        <p className="text-xs text-[#3b82f6]">
          <strong>Drag & Drop:</strong> Arraste um cartão e solte sobre uma pasta para organizá-lo.
          Solte sobre "Sem Pasta" para remover de uma pasta. Clique numa pasta para filtrar.
        </p>
      </div>

      {/* ── Folders Strip ──────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
            Pastas Organizadoras
          </p>
          <button
            onClick={() => setAddingFolder(true)}
            className="flex items-center gap-1.5 text-xs text-[#1a6fbf] hover:text-[#1560a8] transition-colors"
          >
            <FolderPlus size={13} />
            Nova Pasta
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* All */}
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
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              viewFilter === "all" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#94a3b8]"
            }`}>
              {cards.length}
            </span>
          </button>

          {/* Sem Pasta */}
          <SemPastaPill
            count={cards.filter((c) => !c.folderId).length}
            isSelected={viewFilter === "unassigned"}
            onSelect={() => setViewFilter(viewFilter === "unassigned" ? "all" : "unassigned")}
            onDrop={(cardId) => moveCardToFolder(cardId, null)}
          />

          {/* Folder pills */}
          {folders.map((folder) => (
            <FolderPill
              key={folder.id}
              folder={folder}
              cardCount={cards.filter((c) => c.folderId === folder.id).length}
              isSelected={viewFilter === folder.id}
              onSelect={() => setViewFilter(viewFilter === folder.id ? "all" : folder.id)}
              onDrop={moveCardToFolder}
              onRename={renameFolder}
              onDelete={deleteFolder}
            />
          ))}

          {/* Add folder inline input */}
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
                  else if (e.key === "Escape") { setAddingFolder(false); setNewFolderName(""); }
                }}
                placeholder="Nome da pasta..."
                className="text-sm text-[#334155] outline-none w-36 bg-transparent"
              />
              <button onClick={addFolder} className="text-[#1a6fbf] hover:text-[#1560a8] transition-colors">
                <CheckCircle2 size={15} />
              </button>
              <button
                onClick={() => { setAddingFolder(false); setNewFolderName(""); }}
                className="text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active filter label */}
      {viewFilter !== "all" && (
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: selectedFolderDef?.color ?? "#94a3b8" }}
          />
          <span className="text-sm text-[#334155] font-medium">
            {viewFilter === "unassigned"
              ? "Buscas sem pasta"
              : selectedFolderDef?.name ?? "Pasta"}
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

      {/* ── Cards Grid ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            folders={folders}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onDelete={handleDeleteCard}
            onRenameCard={handleRenameCard}
            onEdit={(c) => setCardModal({ card: c })}
          />
        ))}

        {filteredCards.length === 0 && (
          <div className="col-span-3 bg-white rounded-xl border border-dashed border-[#e2e8f0] flex flex-col items-center justify-center py-16">
            <FolderOpen size={36} className="text-[#cbd5e1] mb-3" />
            <p className="text-[#64748b] text-sm">Nenhuma busca nesta pasta.</p>
            <p className="text-[#94a3b8] text-xs mt-1">
              Arraste um cartão de outra pasta ou gere uma nova busca em Relatórios.
            </p>
          </div>
        )}
      </div>

      {/* Modal criação / edição */}
      {cardModal !== null && (
        <CardModal
          initial={cardModal.card}
          folders={folders}
          onClose={() => setCardModal(null)}
          onSave={handleSaveCard}
        />
      )}

      {/* Instructions */}
      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#1a6fbf] rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-[#1e40af] font-medium">Como usar o Histórico e Anexos</p>
            <p className="text-xs text-[#3b82f6] mt-1 leading-relaxed">
              Após gerar um cruzamento em Relatórios, clique em "Salvar Busca" para que ele apareça aqui.
              Organize os cartões arrastando-os para pastas. Dentro de cada cartão, arraste ou clique
              na área tracejada para anexar visualizações finais (PDF, PNG, JPG) — mantendo tudo centralizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export (wraps with DndProvider) ────────────────────────
export function Historico() {
  return <HistoricoContent />;
}