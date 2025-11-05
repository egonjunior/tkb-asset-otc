import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Lead {
  id: string;
  nome_completo: string;
  email_corporativo: string;
  volume_mensal: string;
  necessidade: string;
  necessidade_outro?: string;
  status: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  admin_notes?: string;
}

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const LeadDetailsModal = ({ lead, isOpen, onClose, onUpdate }: LeadDetailsModalProps) => {
  const [notes, setNotes] = useState(lead?.admin_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!lead) return null;

  const getVolumeBadge = (volume: string) => {
    switch (volume) {
      case 'R$ 100k-500k/mês':
        return 'bg-blue-100 text-blue-800';
      case 'R$ 500k-2M/mês':
        return 'bg-blue-200 text-blue-900';
      case 'R$ 2M-10M/mês':
        return 'bg-purple-100 text-purple-800';
      case 'R$ 10M+/mês':
        return 'bg-amber-100 text-amber-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleEmailClick = () => {
    const subject = `TKB Asset - Retorno da sua solicitação`;
    const body = `Olá ${lead.nome_completo},%0D%0A%0D%0ARecebemos sua solicitação e gostaríamos de conversar mais sobre como a TKB Asset pode ajudar sua empresa.%0D%0A%0D%0AQuando você teria disponibilidade para uma conversa?%0D%0A%0D%0AAtenciosamente,%0D%0AEquipe TKB Asset`;
    window.open(`mailto:${lead.email_corporativo}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppClick = () => {
    const message = `Olá ${lead.nome_completo}! Recebemos seu cadastro pela nossa landing page. Gostaria de agendar uma conversa sobre as soluções TKB Asset para sua empresa?`;
    window.open(`https://wa.me/5541984219668?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ admin_notes: notes })
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: "Notas salvas!",
        description: "As observações foram atualizadas com sucesso.",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as notas.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalhes do Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              📋 Dados do Lead
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                <p className="text-base">{lead.nome_completo}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Corporativo</label>
                <div className="flex items-center gap-2">
                  <p className="text-base">{lead.email_corporativo}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(lead.email_corporativo, 'Email')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEmailClick}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Volume Mensal</label>
                <div>
                  <Badge className={`${getVolumeBadge(lead.volume_mensal)} border mt-1`}>
                    {lead.volume_mensal}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Principal Necessidade</label>
                <p className="text-base">{lead.necessidade}</p>
              </div>

              {lead.necessidade_outro && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Detalhes Adicionais</label>
                  <p className="text-base">{lead.necessidade_outro}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informações Técnicas */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              🔍 Informações Técnicas
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {lead.ip_address && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">IP Address</label>
                  <p className="text-sm font-mono">{lead.ip_address}</p>
                </div>
              )}
              
              {lead.utm_source && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">UTM Source</label>
                  <p className="text-sm">{lead.utm_source}</p>
                </div>
              )}
              
              {lead.utm_medium && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">UTM Medium</label>
                  <p className="text-sm">{lead.utm_medium}</p>
                </div>
              )}
              
              {lead.utm_campaign && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">UTM Campaign</label>
                  <p className="text-sm">{lead.utm_campaign}</p>
                </div>
              )}
            </div>

            {lead.user_agent && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">User Agent</label>
                <p className="text-xs font-mono text-muted-foreground break-all">{lead.user_agent}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              📅 Timeline
            </h3>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
              <p className="text-base">{format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Observações Internas</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre este lead..."
                className="min-h-[100px]"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="mt-2"
              >
                {isSaving ? 'Salvando...' : 'Salvar Notas'}
              </Button>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleEmailClick}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Enviar Email
            </Button>
            
            <Button
              onClick={handleWhatsAppClick}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
