import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            📜 Termos de Uso e Política de Privacidade
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Clique no botão abaixo para baixar e ler o documento completo.
          </p>
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Baixar Termos de Uso (PDF)
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
