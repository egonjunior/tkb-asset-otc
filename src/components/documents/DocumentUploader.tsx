import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { validateDocumentFile } from "@/lib/documentHelpers";
import { toast } from "sonner";

interface DocumentUploaderProps {
  onFileSelect: (file: File) => Promise<void>;
  documentType: string;
  disabled?: boolean;
}

export function DocumentUploader({ onFileSelect, documentType, disabled = false }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      setSelectedFile(file);
    }
  }, [disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress (real progress would come from Supabase upload)
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onFileSelect(selectedFile);
      
      clearInterval(interval);
      setProgress(100);
      
      toast.success("Documento enviado com sucesso!");
      setSelectedFile(null);
    } catch (error) {
      toast.error("Erro ao enviar documento. Tente novamente.");
      console.error(error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
          `}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            Arraste e solte seu arquivo aqui
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou clique para selecionar
          </p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            id={`file-upload-${documentType}`}
          />
          <Button
            variant="outline"
            asChild
            disabled={disabled}
          >
            <label htmlFor={`file-upload-${documentType}`} className="cursor-pointer">
              Selecionar Arquivo
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            PDF, JPG ou PNG • Máximo 10MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Enviando... {progress}%
              </p>
            </div>
          )}

          {!uploading && (
            <Button
              onClick={handleUpload}
              className="w-full"
            >
              Enviar Documento
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
