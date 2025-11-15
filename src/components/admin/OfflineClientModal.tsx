import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OfflineClient {
  id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface OfflineClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: OfflineClient | null;
  onSuccess: () => void;
}

export function OfflineClientModal({ open, onOpenChange, client, onSuccess }: OfflineClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    document_type: 'CPF',
    document_number: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name,
        document_type: client.document_type,
        document_number: client.document_number,
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        document_type: 'CPF',
        document_number: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (client) {
        // Update
        const { error } = await supabase
          .from('offline_clients')
          .update({
            full_name: formData.full_name,
            document_type: formData.document_type,
            document_number: formData.document_number,
            email: formData.email || null,
            phone: formData.phone || null,
            notes: formData.notes || null,
          })
          .eq('id', client.id);

        if (error) throw error;
        toast({ title: "Cliente atualizado com sucesso" });
      } else {
        // Create
        const { error } = await supabase
          .from('offline_clients')
          .insert({
            full_name: formData.full_name,
            document_type: formData.document_type,
            document_number: formData.document_number,
            email: formData.email || null,
            phone: formData.phone || null,
            notes: formData.notes || null,
            created_by: user.id,
          });

        if (error) throw error;
        toast({ title: "Cliente adicionado com sucesso" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro ao salvar cliente",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document_type">Tipo de Documento *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="Passaporte">Passaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document_number">Número do Documento *</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
