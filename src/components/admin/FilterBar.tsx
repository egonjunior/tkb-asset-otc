import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export interface FilterState {
  volumeMin: number;
  ordersMin: number;
  registrationPeriod: string;
  orderStatus: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const activeFiltersCount = Object.values(filters).filter(v => v !== 0 && v !== 'all').length;

  const clearFilters = () => {
    onFilterChange({
      volumeMin: 0,
      ordersMin: 0,
      registrationPeriod: 'all',
      orderStatus: 'all',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtros</h3>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Volume mínimo</label>
          <Select
            value={filters.volumeMin.toString()}
            onValueChange={(v) => onFilterChange({ ...filters, volumeMin: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todos</SelectItem>
              <SelectItem value="100000">Acima de R$ 100k</SelectItem>
              <SelectItem value="500000">Acima de R$ 500k</SelectItem>
              <SelectItem value="1000000">Acima de R$ 1M</SelectItem>
              <SelectItem value="5000000">Acima de R$ 5M</SelectItem>
              <SelectItem value="10000000">Acima de R$ 10M</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Ordens mínimas</label>
          <Select
            value={filters.ordersMin.toString()}
            onValueChange={(v) => onFilterChange({ ...filters, ordersMin: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todas</SelectItem>
              <SelectItem value="1">Mais de 1</SelectItem>
              <SelectItem value="5">Mais de 5</SelectItem>
              <SelectItem value="10">Mais de 10</SelectItem>
              <SelectItem value="50">Mais de 50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Período de cadastro</label>
          <Select
            value={filters.registrationPeriod}
            onValueChange={(v) => onFilterChange({ ...filters, registrationPeriod: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select
            value={filters.orderStatus}
            onValueChange={(v) => onFilterChange({ ...filters, orderStatus: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Com ordens pendentes</SelectItem>
              <SelectItem value="completed">Só completadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.volumeMin > 0 && (
            <Badge variant="secondary">
              Volume ≥ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filters.volumeMin)}
            </Badge>
          )}
          {filters.ordersMin > 0 && (
            <Badge variant="secondary">Ordens ≥ {filters.ordersMin}</Badge>
          )}
          {filters.registrationPeriod !== 'all' && (
            <Badge variant="secondary">
              Cadastro: últimos {filters.registrationPeriod} dias
            </Badge>
          )}
          {filters.orderStatus !== 'all' && (
            <Badge variant="secondary">
              Status: {filters.orderStatus === 'pending' ? 'Pendentes' : 'Completadas'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}