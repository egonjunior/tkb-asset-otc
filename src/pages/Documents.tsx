import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { DocumentViewerModal } from "@/components/documents/DocumentViewerModal";
import { TermsModal } from "@/components/documents/TermsModal";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";
import { Eye, CheckCircle2, LogOut, Settings } from "lucide-react";
import { getTemplatePath, type DocumentStatus } from "@/lib/documentHelpers";
import tkbLogo from "@/assets/tkb-logo.png";

interface Document {
  id: string;
  document_type: string;
  status: DocumentStatus;
  client_file_url: string | null;
  tkb_file_url: string | null;
  rejection_reason: string | null;
  pld_acknowledged: boolean;
  pld_acknowledged_at: string | null;
}

export default function Documents() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  const [loading, setLoading] = useState(true);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [pldModalOpen, setPldModalOpen] = useState(false);
  const [viewerModal, setViewerModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
    subscribeToDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      const documentsMap: Record<string, Document> = {};
      data?.forEach(doc => {
        documentsMap[doc.document_type] = doc as Document;
      });
      setDocuments(documentsMap);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDocuments = () => {
    const channel = supabase
      .channel('user-documents')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePLDAcknowledge = async () => {
    try {
      let docId = documents['politica-pld']?.id;

      if (!docId) {
        const { data, error } = await supabase
          .from('documents')
          .insert([{
            user_id: user?.id,
            document_type: 'politica-pld' as const,
            pld_acknowledged: true,
            pld_acknowledged_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        docId = data.id;
      } else {
        const { error } = await supabase
          .from('documents')
          .update({
            pld_acknowledged: true,
            pld_acknowledged_at: new Date().toISOString()
          })
          .eq('id', docId);

        if (error) throw error;
      }

      toast.success('Leitura da Política de PLD/FTP confirmada');
      setPldModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error acknowledging PLD:', error);
      toast.error('Erro ao confirmar leitura');
    }
  };

  const handleUpload = async (type: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `client/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      let docId = documents[type]?.id;

      if (!docId) {
        const { data, error } = await supabase
          .from('documents')
          .insert([{
            user_id: user?.id,
            document_type: type as 'contrato-quadro' | 'dossie-kyc',
            client_file_url: filePath,
            status: 'under_review' as const,
            uploaded_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('documents')
          .update({
            client_file_url: filePath,
            status: 'under_review',
            uploaded_at: new Date().toISOString(),
            rejection_reason: null
          })
          .eq('id', docId);

        if (error) throw error;
      }

      toast.success('Documento enviado para análise');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleDownloadTemplate = (type: string) => {
    const path = getTemplatePath(type as any);
    const link = document.createElement('a');
    link.href = path;
    link.download = `${type}-tkb-asset.pdf`;
    link.click();
  };

  const handleView = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;

      // Forçar download ao invés de abrir no navegador
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = title;
      link.click();
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const completedCount = Object.values(documents).filter(
    doc => doc.status === 'approved' || (doc.document_type === 'politica-pld' && doc.pld_acknowledged)
  ).length + 1; // Terms always accepted at registration

  const totalCount = 4;
  const progressPercentage = (completedCount / totalCount) * 100;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-tkb-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220,15%,92%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220,15%,92%)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="h-20 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white border-b border-neutral-700 shadow-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigate('/dashboard')}
            >
              <img src={tkbLogo} alt="TKB Asset" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-brand">TKB ASSET</h1>
                <p className="text-xs text-neutral-300 font-inter uppercase tracking-wider">Mesa OTC</p>
              </div>
            </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-inter hidden sm:inline">
                  Olá, <strong className="font-semibold">{profile?.full_name || user?.email?.split("@")[0] || "Usuário"}</strong>
                </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-neutral-600 text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Layout com Sidebar e Conteúdo */}
        <SidebarProvider defaultOpen={true} style={{ ["--sidebar-width" as any]: "12rem" }}>
          <div className="flex w-full min-h-[calc(100vh-80px)]">
            {/* Sidebar */}
            <AppSidebar />

            {/* Main Content */}
            <main className="flex-1 px-6 py-10">
              <div className="max-w-6xl mx-auto space-y-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📄 Documentos Contratuais</h1>
        <p className="text-muted-foreground">
          Gerencie seus documentos contratuais com a TKB Asset
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Status Geral dos Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{completedCount} de {totalCount} documentos completos</span>
              <span className="font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Card de Instruções */}
      <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📋 Como Preencher os Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-2">
                Para documentos que requerem preenchimento (Contrato-Quadro e Dossiê KYC):
              </p>
              <div className="space-y-1 text-muted-foreground ml-2">
                <p>1️⃣ Baixe a minuta do documento</p>
                <p>2️⃣ Preencha com seus dados</p>
                <p>3️⃣ Assine digitalmente via Gov.br ou Certificado Digital</p>
                <p>4️⃣ Anexe o documento assinado</p>
              </div>
            </div>
            
            <div className="text-sm pt-2 border-t border-primary/20">
              <p className="font-semibold text-foreground mb-2">
                Para documentos que requerem apenas confirmação (Termos de Uso e Política PLD):
              </p>
              <div className="space-y-1 text-muted-foreground ml-2">
                <p>✅ Leia o conteúdo completo</p>
                <p>✅ Clique em "Confirmo que li e compreendi"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Termos de Uso */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">📜</span>
                Termos de Uso e Política de Privacidade
              </CardTitle>
              <DocumentStatusBadge status="approved" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Aceito ao criar sua conta
            </p>
            <Button
              variant="outline"
              onClick={() => setTermsModalOpen(true)}
              className="w-full justify-start"
            >
              <Eye className="mr-2 h-4 w-4" />
              Visualizar Documento
            </Button>
          </CardContent>
        </Card>

        {/* Política de PLD */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                Política de PLD/FTP
              </CardTitle>
              {documents['politica-pld']?.pld_acknowledged ? (
                <DocumentStatusBadge status="approved" />
              ) : (
                <DocumentStatusBadge status="pending" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents['politica-pld']?.pld_acknowledged ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Confirmado em {new Date(documents['politica-pld'].pld_acknowledged_at!).toLocaleDateString('pt-BR')}
              </p>
            ) : (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>📖 <strong>Passo 1:</strong> Clique em "Ler Política"</p>
                <p>✅ <strong>Passo 2:</strong> Após ler, clique em "Confirmo que li e compreendi"</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setPldModalOpen(true)}
                className="w-full justify-start"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ler Política
              </Button>
              {!documents['politica-pld']?.pld_acknowledged && (
                <Button
                  onClick={handlePLDAcknowledge}
                  className="w-full"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmo que li e compreendi
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contrato-Quadro */}
        <DocumentCard
          title="Contrato-Quadro"
          icon="📄"
          type="contrato-quadro"
          status={documents['contrato-quadro']?.status || 'pending'}
          clientFileUrl={documents['contrato-quadro']?.client_file_url}
          tkbFileUrl={documents['contrato-quadro']?.tkb_file_url}
          rejectionReason={documents['contrato-quadro']?.rejection_reason}
          onDownloadTemplate={() => handleDownloadTemplate('contrato-quadro')}
          onUpload={(file) => handleUpload('contrato-quadro', file)}
          onView={handleView}
        />

        {/* Dossiê KYC/CDD */}
        <DocumentCard
          title="Dossiê KYC/CDD"
          icon="🔍"
          type="dossie-kyc"
          status={documents['dossie-kyc']?.status || 'pending'}
          clientFileUrl={documents['dossie-kyc']?.client_file_url}
          tkbFileUrl={documents['dossie-kyc']?.tkb_file_url}
          rejectionReason={documents['dossie-kyc']?.rejection_reason}
          onDownloadTemplate={() => handleDownloadTemplate('dossie-kyc')}
          onUpload={(file) => handleUpload('dossie-kyc', file)}
          onView={handleView}
        />
      </div>

                <TermsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
                <TermsModal isOpen={pldModalOpen} onClose={() => setPldModalOpen(false)} />
                <DocumentViewerModal
                  isOpen={viewerModal.open}
                  onClose={() => setViewerModal({ open: false, url: '', title: '' })}
                  fileUrl={viewerModal.url}
                  title={viewerModal.title}
                />
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
