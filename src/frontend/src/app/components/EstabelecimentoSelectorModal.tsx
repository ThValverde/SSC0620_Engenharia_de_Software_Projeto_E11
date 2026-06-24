import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Check } from "lucide-react";

type EstablishmentOption = {
  id: number;
  endpoint: string;
  label: string;
  segmento: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishments: EstablishmentOption[];
  onSelect: (establishment: EstablishmentOption) => void;
  selectedId?: number;
};

export function EstabelecimentoSelectorModal({
  open,
  onOpenChange,
  establishments,
  onSelect,
  selectedId,
}: Props) {
  const [search, setSearch] = useState("");
  const [segmentoFilter, setSegmentoFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const segmentos = useMemo(() => {
    return Array.from(new Set(establishments.map((e) => e.segmento))).sort();
  }, [establishments]);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return establishments.filter((item) => {
      const matchSearch = item.label.toLowerCase().includes(searchLower);
      const matchSegmento = !segmentoFilter || item.segmento === segmentoFilter;
      return matchSearch && matchSegmento;
    });
  }, [establishments, search, segmentoFilter]);

  const paginatedFiltered = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleSelect = (establishment: EstablishmentOption) => {
    onSelect(establishment);
    onOpenChange(false);
    setSearch("");
    setSegmentoFilter("");
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Selecionar Estabelecimento</DialogTitle>
          <DialogDescription>
            Escolha um estabelecimento para vincular a este usuário Trade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-[#64748b]">Buscar</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  className="pl-9"
                  placeholder="Nome, CNPJ, CPF..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#64748b]">Segmento</label>
              <select
                value={segmentoFilter}
                onChange={(e) => {
                  setSegmentoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-md border border-[#e2e8f0] bg-white px-3 text-sm"
              >
                <option value="">Todos os segmentos</option>
                {segmentos.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="border border-[#e2e8f0] rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-4 text-xs font-semibold uppercase text-[#64748b] flex-1 min-w-0">Nome</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold uppercase text-[#64748b] w-24">Segmento</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold uppercase text-[#64748b] w-24">Tipo</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold uppercase text-[#64748b] w-20">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {paginatedFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#94a3b8]">
                        Nenhum estabelecimento encontrado
                      </td>
                    </tr>
                  ) : (
                    paginatedFiltered.map((est) => (
                      <tr
                        key={`${est.endpoint}-${est.id}`}
                        className="hover:bg-[#f8fafc] transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-[#0c2340] truncate">
                            {est.label.split(" — ")[0]}
                          </div>
                          <div className="text-xs text-[#94a3b8] mt-1">ID {est.id}</div>
                        </td>
                        <td className="px-4 py-4 text-[#334155] text-xs">{est.segmento}</td>
                        <td className="px-4 py-4 text-[#64748b] text-xs font-mono bg-[#f1f5f9] rounded truncate">
                          {est.endpoint}
                        </td>
                        <td className="px-4 py-4 text-center flex-shrink-0">
                          {selectedId === est.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check size={18} className="text-green-600" />
                              <span className="text-xs text-green-600 font-medium">Selecionado</span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSelect(est)}
                              className="bg-[#1a6fbf] hover:bg-[#1560a8] text-xs"
                            >
                              Selecionar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#f8fafc] p-4 rounded-lg">
              <div className="text-sm text-[#64748b] font-medium">
                Página {currentPage} de {totalPages} ({filtered.length} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  ← Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs"
                >
                  Próxima →
                </Button>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
