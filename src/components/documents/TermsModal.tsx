import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">
            📜 Termos de Uso e Política de Privacidade
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <iframe
            src="/documents/termos-de-uso.pdf"
            className="w-full h-[calc(90vh-80px)] border-0"
            title="Termos de Uso"
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
