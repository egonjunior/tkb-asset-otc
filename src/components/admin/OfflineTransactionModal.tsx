import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OfflineTransaction {
  id: string;
  transaction_date: string;
  usdt_amount: number;
  brl_amount: number;
  usdt_rate: number;
  operation_type: string;
  notes?: string;
}

interface OfflineTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
  transactionToEdit?: OfflineTransaction;
}

export function OfflineTransactionModal({ open, onOpenChange, clientId, onSuccess, transactionToEdit }: OfflineTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    usdt_amount: 0,
    brl_amount: 0,
    usdt_rate: 0,
    operation_type: 'compra',
    notes: '',
  });

  // Preencher form quando editar
  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        transaction_date: new Date(transactionToEdit.transaction_date).toISOString().split('T')[0],
        usdt_amount: transactionToEdit.usdt_amount,
        brl_amount: transactionToEdit.brl_amount,
        usdt_rate: transactionToEdit.usdt_rate,
        operation_type: transactionToEdit.operation_type,
        notes: transactionToEdit.notes || '',
      });
    } else {
      // Reset ao abrir para criar novo
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        usdt_amount: 0,
        brl_amount: 0,
        usdt_rate: 0,
        operation_type: 'compra',
        notes: '',
      });
    }
  }, [transactionToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (transactionToEdit) {
        // UPDATE
        const { error } = await supabase
          .from('offline_transactions')
          .update({
            transaction_date: new Date(formData.transaction_date).toISOString(),
            usdt_amount: formData.usdt_amount,
            brl_amount: formData.brl_amount,
            usdt_rate: formData.usdt_rate,
            operation_type: formData.operation_type,
            notes: formData.notes || null,
          })
          .eq('id', transactionToEdit.id);

        if (error) throw error;
        toast({ title: "Transação atualizada com sucesso" });
      } else {
        // INSERT
        const { error } = await supabase
          .from('offline_transactions')
          .insert({
            client_id: clientId,
            transaction_date: new Date(formData.transaction_date).toISOString(),
            usdt_amount: formData.usdt_amount,
            brl_amount: formData.brl_amount,
            usdt_rate: formData.usdt_rate,
            operation_type: formData.operation_type,
            notes: formData.notes || null,
            created_by: user.id,
          });

        if (error) throw error;
        toast({ title: "Transação registrada com sucesso" });
      }
      onSuccess();
      onOpenChange(false);
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
    if (formData.usdt_amount > 0 && formData.brl_amount > 0) {
      setFormData({ ...formData, usdt_rate: parseFloat((formData.brl_amount / formData.usdt_amount).toFixed(4)) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? 'Editar Transação' : 'Registrar Transação'}</DialogTitle>
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
              <CurrencyInput
                id="usdt_amount"
                value={formData.usdt_amount}
                onChange={(value) => setFormData({ ...formData, usdt_amount: value })}
                onBlur={calculateRate}
                placeholder="Ex: 222.332,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="brl_amount">Valor em BRL *</Label>
              <CurrencyInput
                id="brl_amount"
                value={formData.brl_amount}
                onChange={(value) => setFormData({ ...formData, brl_amount: value })}
                onBlur={calculateRate}
                placeholder="Ex: 1.214.999,91"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="usdt_rate">Cotação USDT/BRL *</Label>
            <CurrencyInput
              id="usdt_rate"
              value={formData.usdt_rate}
              onChange={(value) => setFormData({ ...formData, usdt_rate: value })}
              decimals={4}
              placeholder="Ex: 5,4648"
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
