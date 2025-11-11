import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OfflineTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export function OfflineTransactionModal({ open, onOpenChange, clientId, onSuccess }: OfflineTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    usdt_amount: '',
    brl_amount: '',
    usdt_rate: '',
    operation_type: 'compra',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('offline_transactions')
        .insert({
          client_id: clientId,
          transaction_date: new Date(formData.transaction_date).toISOString(),
          usdt_amount: parseFloat(formData.usdt_amount),
          brl_amount: parseFloat(formData.brl_amount),
          usdt_rate: parseFloat(formData.usdt_rate),
          operation_type: formData.operation_type,
          notes: formData.notes || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast({ title: "Transação registrada com sucesso" });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        usdt_amount: '',
        brl_amount: '',
        usdt_rate: '',
        operation_type: 'compra',
        notes: '',
      });
    } catch (error: any) {
      console.error("Erro ao registrar transação:", error);
      toast({
        title: "Erro ao registrar transação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRate = () => {
    const usdt = parseFloat(formData.usdt_amount);
    const brl = parseFloat(formData.brl_amount);
    if (usdt > 0 && brl > 0) {
      setFormData({ ...formData, usdt_rate: (brl / usdt).toFixed(4) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction_date">Data da Operação *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="operation_type">Tipo de Operação *</Label>
              <Select
                value={formData.operation_type}
                onValueChange={(value) => setFormData({ ...formData, operation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="usdt_amount">Valor em USDT *</Label>
              <Input
                id="usdt_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.usdt_amount}
                onChange={(e) => setFormData({ ...formData, usdt_amount: e.target.value })}
                onBlur={calculateRate}
                required
              />
            </div>

            <div>
              <Label htmlFor="brl_amount">Valor em BRL *</Label>
              <Input
                id="brl_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.brl_amount}
                onChange={(e) => setFormData({ ...formData, brl_amount: e.target.value })}
                onBlur={calculateRate}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="usdt_rate">Cotação USDT/BRL *</Label>
            <Input
              id="usdt_rate"
              type="number"
              step="0.0001"
              min="0.0001"
              value={formData.usdt_rate}
              onChange={(e) => setFormData({ ...formData, usdt_rate: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Calculado automaticamente ou insira manualmente
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Informações adicionais sobre a transação..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
