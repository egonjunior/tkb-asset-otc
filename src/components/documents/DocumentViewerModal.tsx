import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
}

export function DocumentViewerModal({ isOpen, onClose, fileUrl, title }: DocumentViewerModalProps) {
  const isImage = fileUrl.match(/\.(jpg|jpeg|png)$/i);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          {isImage ? (
            <img src={fileUrl} alt={title} className="w-full h-auto" />
          ) : (
            <iframe
              src={fileUrl}
              className="w-full h-[calc(95vh-100px)] border-0"
              title={title}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
