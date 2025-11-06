import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface AdminDocument {
  id: string;
  document_type: string;
  user_id: string;
}

interface TKBUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AdminDocument;
  onUploadComplete: () => void;
}

export function TKBUploadModal({ isOpen, onClose, document, onUploadComplete }: TKBUploadModalProps) {
  const [tkbFile, setTkbFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!tkbFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    setUploading(true);
    try {
      const fileExt = tkbFile.name.split('.').pop();
      const fileName = `${document.document_type}-tkb-${Date.now()}.${fileExt}`;
      const filePath = `tkb/${document.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, tkbFile);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          tkb_file_url: filePath
        })
        .eq('id', document.id);

      if (updateError) throw updateError;

      toast.success('Documento TKB anexado com sucesso');
      onUploadComplete();
      onClose();
    } catch (error) {
      console.error('Error uploading TKB document:', error);
      toast.error('Erro ao anexar documento TKB');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setTkbFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Anexar Documento TKB
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Anexe o documento assinado pela TKB Asset. Este documento já foi aprovado, você está apenas adicionando o arquivo assinado.
          </p>

          <DocumentUploader
            onFileSelect={async (file) => setTkbFile(file)}
            documentType="tkb"
          />

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!tkbFile || uploading}
              className="flex-1"
            >
              {uploading ? 'Anexando...' : 'Anexar Documento'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
