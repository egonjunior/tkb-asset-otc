import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, CheckCircle, Shield, FileText, AlertTriangle } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/documents/termos-de-uso.pdf';
    link.download = 'termos-de-uso-tkb-asset.pdf';
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Termos de Uso e Política de Privacidade
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] px-6">
          <div className="space-y-6 py-4 text-sm">
            {/* Resumo Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle className="h-5 w-5 text-success mb-2" />
                <p className="font-medium text-foreground">Dados Protegidos</p>
                <p className="text-xs text-muted-foreground">Criptografia de ponta</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="h-5 w-5 text-primary mb-2" />
                <p className="font-medium text-foreground">100% Conforme</p>
                <p className="text-xs text-muted-foreground">Lei 14.478/2022</p>
              </div>
              <div className="p-4 rounded-lg bg-tkb-cyan/10 border border-tkb-cyan/20">
                <FileText className="h-5 w-5 text-tkb-cyan mb-2" />
                <p className="font-medium text-foreground">Auditável</p>
                <p className="text-xs text-muted-foreground">Registros completos</p>
              </div>
            </div>

            {/* Seções dos Termos */}
            <div className="space-y-4">
              <section>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  1. Objeto do Serviço
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  A TKB Asset oferece serviços de intermediação para operações de câmbio via ativos digitais (USDT), 
                  facilitando conversões entre Real Brasileiro (BRL) e stablecoins atreladas ao dólar americano, 
                  bem como remessas internacionais expressas.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  2. Elegibilidade e Cadastro
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Para utilizar nossos serviços, você deve: ser maior de 18 anos ou pessoa jurídica legalmente 
                  constituída; fornecer documentação válida para verificação KYC (Know Your Customer); 
                  manter seus dados cadastrais atualizados.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  3. Política de Privacidade
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Coletamos e processamos dados pessoais conforme a LGPD (Lei 13.709/2018). Seus dados são 
                  utilizados exclusivamente para: verificação de identidade, cumprimento de obrigações 
                  regulatórias, prevenção a fraudes e comunicações sobre seus serviços.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  4. Compliance e Regulamentação
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Operamos em conformidade com a Lei 14.478/2022 que regula o mercado de criptoativos no Brasil. 
                  Todas as operações são registradas e podem ser auditadas pelos órgãos competentes. 
                  Mantemos política rigorosa de PLD/FT (Prevenção à Lavagem de Dinheiro e Financiamento ao Terrorismo).
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  5. Responsabilidades e Limitações
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  A TKB Asset não se responsabiliza por: flutuações de mercado após confirmação de ordem; 
                  erros causados por informações incorretas fornecidas pelo usuário; indisponibilidade de 
                  serviços de terceiros (bancos, exchanges, redes blockchain).
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  6. Cancelamentos e Reembolsos
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ordens podem ser canceladas apenas enquanto estiverem no status "Aguardando Pagamento". 
                  Após confirmação do pagamento, a ordem não pode ser cancelada. Em caso de problemas técnicos, 
                  entre em contato com nosso suporte.
                </p>
              </section>

              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">Importante</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao criar sua conta, você declara ter lido e concordado com todos os termos acima. 
                    Para o documento completo, baixe o PDF abaixo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t space-y-3 bg-muted/30">
          <Button onClick={handleDownload} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Baixar documento completo (PDF)
          </Button>
          <Button onClick={onClose} className="w-full">
            Li e entendi os termos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
