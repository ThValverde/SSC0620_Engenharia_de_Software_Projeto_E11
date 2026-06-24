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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar Estabelecimento</DialogTitle>
          <DialogDescription>
            Escolha um estabelecimento para vincular a este usuário Trade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#64748b]">Buscar</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
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
          <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Nome</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Segmento</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Tipo</th>
                  <th className="text-center px-4 py-3 text-xs uppercase text-[#64748b]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[#94a3b8]">
                      Nenhum estabelecimento encontrado
                    </td>
                  </tr>
                ) : (
                  paginatedFiltered.map((est) => (
                    <tr
                      key={`${est.endpoint}-${est.id}`}
                      className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0c2340]">
                          {est.label.split(" — ")[0]}
                        </div>
                        <div className="text-xs text-[#94a3b8]">ID {est.id}</div>
                      </td>
                      <td className="px-4 py-3 text-[#334155]">{est.segmento}</td>
                      <td className="px-4 py-3 text-[#334155] text-xs">{est.endpoint}</td>
                      <td className="px-4 py-3 text-center">
                        {selectedId === est.id ? (
                          <Check size={18} className="mx-auto text-green-600" />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelect(est)}
                            className="text-xs"
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

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#64748b]">
                Página {currentPage} de {totalPages} ({filtered.length} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima →
                </Button>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
