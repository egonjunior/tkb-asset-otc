import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PartnerB2BConfigModalProps {
  partner: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PartnerB2BConfigModal = ({ partner, isOpen, onClose, onSuccess }: PartnerB2BConfigModalProps) => {
  // Normalizar config: garantir que seja null ou objeto válido
  const config = Array.isArray(partner?.partner_b2b_config) 
    ? partner.partner_b2b_config[0] 
    : partner?.partner_b2b_config;

  const [markupPercent, setMarkupPercent] = useState(
    config?.markup_percent?.toString() || "0.4"
  );
  const [notes, setNotes] = useState(partner?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock Binance price for preview (in real app, fetch from API)
  const mockBinancePrice = 5.40;
  const previewTkbPrice = mockBinancePrice * (1 + parseFloat(markupPercent || 0) / 100);
  const previewStandardPrice = mockBinancePrice * 1.01;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create or update B2B config
      const { error: configError } = await supabase
        .from('partner_b2b_config')
        .upsert({
          user_id: partner.user_id,
          markup_percent: parseFloat(markupPercent),
          is_active: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          company_name: partner.name,
          trading_volume_monthly: parseFloat(partner.trading_volume_monthly || 0),
          notes: notes,
        }, {
          onConflict: 'user_id'
        });

      if (configError) throw configError;

      // Add b2b_partner role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: partner.user_id,
          role: 'b2b_partner',
        });

      // Ignore error if role already exists
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Update partner request status
      const { error: updateError } = await supabase
        .from('partner_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          notes: notes,
        })
        .eq('id', partner.id);

      if (updateError) throw updateError;

      toast.success("Parceiro B2B aprovado com sucesso!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error approving partner:", error);
      toast.error(`Erro ao aprovar parceiro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aprovar Mesa OTC B2B - {partner?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Markup Configuration */}
          <div className="space-y-2">
            <Label htmlFor="markup">Configurar Markup Personalizado (%)</Label>
            <Input
              id="markup"
              type="number"
              step="0.001"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(e.target.value)}
              placeholder="0.4"
            />
            <p className="text-xs text-muted-foreground">
              Ex: 0.4 = 0.4% de markup (Binance + 0.4%)
            </p>
          </div>

          {/* Price Preview */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm mb-3">Preview de Preços:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço Binance:</span>
                <span className="font-mono">R$ {mockBinancePrice.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço Cliente Final TKB (1%):</span>
                <span className="font-mono">R$ {previewStandardPrice.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold">Preço Parceiro B2B ({markupPercent}%):</span>
                <span className="font-mono font-bold text-primary">R$ {previewTkbPrice.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-xs text-green-600">
                <span>Economia vs. Cliente Final:</span>
                <span>R$ {(previewStandardPrice - previewTkbPrice).toFixed(4)} ({(((previewStandardPrice - previewTkbPrice) / previewStandardPrice) * 100).toFixed(2)}%)</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Internas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações internas sobre este parceiro..."
              rows={3}
            />
          </div>

          {/* Partner Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empresa:</span>
              <span className="font-medium">{partner?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WhatsApp:</span>
              <span className="font-medium">{partner?.phone}</span>
            </div>
            {partner?.trading_volume_monthly && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume Mensal:</span>
                <span className="font-medium">R$ {parseFloat(partner.trading_volume_monthly).toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aprovar e Configurar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
