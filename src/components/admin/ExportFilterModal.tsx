import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, FileText, Calendar } from "lucide-react";

interface ExportFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (startDate: Date, endDate: Date, format: 'pdf' | 'excel') => void;
}

export function ExportFilterModal({ open, onOpenChange, onExport }: ExportFilterModalProps) {
  const [periodType, setPeriodType] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  // Gerar últimos 12 meses
  const getLastMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label: monthYear.charAt(0).toUpperCase() + monthYear.slice(1), value });
    }
    return months;
  };

  const handleExport = () => {
    let start: Date;
    let end: Date;

    if (periodType === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59);
    } else if (periodType === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59);
    } else {
      return; // Validação: período não selecionado
    }

    onExport(start, end, format);
    onOpenChange(false);
  };

  const isValid = 
    (periodType === 'month' && selectedMonth) || 
    (periodType === 'custom' && startDate && endDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Período */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Período
            </Label>
            <RadioGroup value={periodType} onValueChange={(v) => setPeriodType(v as 'month' | 'custom')}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month" className="font-normal cursor-pointer">Selecionar mês</Label>
                </div>
                {periodType === 'month' && (
                  <div className="ml-6 space-y-2">
                    {getLastMonths().map((month) => (
                      <div key={month.value} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={month.value} 
                          id={month.value}
                          checked={selectedMonth === month.value}
                          onClick={() => setSelectedMonth(month.value)}
                        />
                        <Label htmlFor={month.value} className="font-normal cursor-pointer">
                          {month.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="font-normal cursor-pointer">Período customizado</Label>
                </div>
                {periodType === 'custom' && (
                  <div className="ml-6 grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="startDate" className="text-sm">Data início</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-sm">Data fim</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Formato */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Formato
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                className="h-20 flex flex-col gap-2"
              >
                <FileText className="h-6 w-6" />
                <span>PDF</span>
              </Button>
              <Button
                type="button"
                variant={format === 'excel' ? 'default' : 'outline'}
                onClick={() => setFormat('excel')}
                className="h-20 flex flex-col gap-2"
              >
                <FileSpreadsheet className="h-6 w-6" />
                <span>Excel</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={!isValid}>
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
