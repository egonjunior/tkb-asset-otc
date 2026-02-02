import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Wallet, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateWalletAddress, type NetworkType } from "@/lib/walletValidation";

interface ClientWallet {
  id?: string;
  wallet_address: string;
  network: NetworkType;
  label: string;
}

interface RecurringClient {
  id: string;
  name: string;
  notes: string | null;
  wallets: ClientWallet[];
}

interface RecurringClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: RecurringClient | null;
  onSave: () => void;
}

const NETWORKS: { value: NetworkType; label: string }[] = [
  { value: "ERC20", label: "ERC20 (Ethereum)" },
  { value: "TRC20", label: "TRC20 (Tron)" },
  { value: "BEP20", label: "BEP20 (BSC)" },
  { value: "POLYGON", label: "Polygon" },
];

export const RecurringClientModal = ({
  open,
  onOpenChange,
  client,
  onSave,
}: RecurringClientModalProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [wallets, setWallets] = useState<ClientWallet[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (client) {
      setName(client.name);
      setNotes(client.notes || "");
      setWallets(client.wallets || []);
    } else {
      setName("");
      setNotes("");
      setWallets([{ wallet_address: "", network: "TRC20", label: "" }]);
    }
    setErrors({});
  }, [client, open]);

  const addWallet = () => {
    setWallets([...wallets, { wallet_address: "", network: "TRC20", label: "" }]);
  };

  const removeWallet = (index: number) => {
    setWallets(wallets.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const updateWallet = (index: number, field: keyof ClientWallet, value: string) => {
    const updated = [...wallets];
    updated[index] = { ...updated[index], [field]: value };
    setWallets(updated);

    // Validate address when it changes
    if (field === "wallet_address" || field === "network") {
      const wallet = updated[index];
      if (wallet.wallet_address) {
        const validation = validateWalletAddress(wallet.wallet_address, wallet.network);
        if (!validation.isValid) {
          setErrors({ ...errors, [index]: validation.error || "Endereço inválido" });
        } else {
          const newErrors = { ...errors };
          delete newErrors[index];
          setErrors(newErrors);
        }
      }
    }
  };

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do cliente",
        variant: "destructive",
      });
      return;
    }

    // Validate wallets
    const validWallets = wallets.filter((w) => w.wallet_address.trim());
    if (validWallets.length === 0) {
      toast({
        title: "Carteira obrigatória",
        description: "Adicione pelo menos uma carteira",
        variant: "destructive",
      });
      return;
    }

    // Check for validation errors
    const hasErrors = validWallets.some((w, i) => {
      const validation = validateWalletAddress(w.wallet_address, w.network);
      if (!validation.isValid) {
        setErrors({ ...errors, [i]: validation.error || "Endereço inválido" });
        return true;
      }
      return false;
    });

    if (hasErrors) {
      toast({
        title: "Endereço inválido",
        description: "Corrija os erros de validação",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (client) {
        // Update existing client
        const { error: updateError } = await supabase
          .from("okx_recurring_clients")
          .update({ name, notes: notes || null })
          .eq("id", client.id);

        if (updateError) throw updateError;

        // Delete old wallets and insert new ones
        await supabase.from("okx_client_wallets").delete().eq("client_id", client.id);

        const walletsToInsert = validWallets.map((w) => ({
          client_id: client.id,
          wallet_address: w.wallet_address.trim(),
          network: w.network,
          label: w.label || null,
        }));

        const { error: walletsError } = await supabase
          .from("okx_client_wallets")
          .insert(walletsToInsert);

        if (walletsError) throw walletsError;

        toast({ title: "Cliente atualizado com sucesso" });
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from("okx_recurring_clients")
          .insert({ name, notes: notes || null })
          .select()
          .single();

        if (insertError) throw insertError;

        const walletsToInsert = validWallets.map((w) => ({
          client_id: newClient.id,
          wallet_address: w.wallet_address.trim(),
          network: w.network,
          label: w.label || null,
        }));

        const { error: walletsError } = await supabase
          .from("okx_client_wallets")
          .insert(walletsToInsert);

        if (walletsError) throw walletsError;

        toast({ title: "Cliente criado com sucesso" });
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? "Editar Cliente" : "Adicionar Cliente Recorrente"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input
              id="name"
              placeholder="Ex: Virtual Pay"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre o cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Wallets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Carteiras Vinculadas *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addWallet}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Carteira
              </Button>
            </div>

            <div className="space-y-3">
              {wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-muted/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      Carteira {index + 1}
                    </div>
                    {wallets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeWallet(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Endereço</Label>
                      <Input
                        placeholder="0x... ou T..."
                        value={wallet.wallet_address}
                        onChange={(e) =>
                          updateWallet(index, "wallet_address", e.target.value)
                        }
                        className={errors[index] ? "border-destructive" : ""}
                      />
                      {errors[index] && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors[index]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Rede</Label>
                      <Select
                        value={wallet.network}
                        onValueChange={(value) =>
                          updateWallet(index, "network", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NETWORKS.map((net) => (
                            <SelectItem key={net.value} value={net.value}>
                              {net.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Rótulo (opcional)</Label>
                    <Input
                      placeholder="Ex: Principal, Backup..."
                      value={wallet.label}
                      onChange={(e) => updateWallet(index, "label", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : client ? "Atualizar" : "Criar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
