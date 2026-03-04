import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { DocumentViewerModal } from "@/components/documents/DocumentViewerModal";
import { TermsModal } from "@/components/documents/TermsModal";
import { KYCDocumentsSection } from "@/components/documents/KYCDocumentsSection";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { HeaderMarketTicker } from "@/components/HeaderMarketTicker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Eye, CheckCircle2, LogOut, Settings } from "lucide-react";
import { getTemplatePath, type DocumentStatus, type DocumentType } from "@/lib/documentHelpers";
import tkbLogo from "@/assets/tkb-logo.png";

interface Document {
  id: string;
  document_type: DocumentType;
  status: DocumentStatus;
  client_file_url: string | null;
  tkb_file_url: string | null;
  rejection_reason: string | null;
  pld_acknowledged: boolean;
  pld_acknowledged_at: string | null;
}

export default function Documents() {
  const { user, profile, signOut } = useAuth();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const { binancePrice, tkbPrice, isLoading: priceLoading } = useBinancePrice();
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
        .eq('user_id', user?.id)
        .in('document_type', [
          'contrato-quadro',
          'dossie-kyc',
          'politica-pld',
          'kyc-faturamento',
          'kyc-cnpj',
          'kyc-identificacao',
          'kyc-comprovante-residencia',
          'kyc-outros'
        ]);

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

      // Email ao cliente
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'documents-received',
          to: user?.email,
          data: {
            nome_cliente: profile?.full_name,
            link_plataforma: window.location.origin
          }
        }
      }).catch(err => console.error('Error sending client email:', err));

      // Notificação interna para gestão
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'new-signup',
          to: 'tkb.assetgestao@gmail.com',
          internal: true,
          data: {
            nome_cliente: profile?.full_name,
            email_cliente: user?.email,
            documento: `${profile?.document_type}: ${profile?.document_number}`,
            data_hora_cadastro: new Date().toLocaleString('pt-BR'),
            link_admin_kyc: `${window.location.origin}/admin/documents`
          }
        }
      }).catch(err => console.error('Error sending internal notification:', err));

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

  const totalCount = 8; // 1 termos + 1 pld + 1 contrato + 5 kyc
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
    <SidebarProvider
      defaultOpen={false}
      style={{
        ["--sidebar-width" as any]: "16rem",
        ["--sidebar-width-mobile" as any]: "18rem"
      }}
    >
      <div className="dark min-h-screen w-full bg-[#0A0A0A] relative overflow-hidden">
        {/* Subtle ambient glow - Premium Depth */}
        <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 100%)' }}></div>

        <div className="relative z-10">
          {/* Header alinhado com o Dashboard Premium */}
          <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
                  <img src={tkbLogo} alt="TKB Asset" className="h-8 w-8" />
                  <div>
                    <h1 className="text-sm font-bold text-white tracking-tight">TKB ASSET</h1>
                    <p className="text-[9px] text-[#00D4FF] font-mono uppercase tracking-[0.2em] mt-0.5">Mesa OTC</p>
                  </div>
                </div>
              </div>
              <HeaderMarketTicker binancePrice={binancePrice} tkbPrice={tkbPrice} isLoading={priceLoading} />
              <HeaderUserMenu userName={userName} userEmail={user?.email} onLogout={() => signOut()} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
          </header>

          <div className="flex w-full min-h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <AppSidebar />

            {/* Main Content */}
            <main className="flex-1 px-4 md:px-6 py-8 md:py-10 w-full overflow-y-auto">
              <div className="max-w-6xl mx-auto space-y-10">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">📄 Documentos Contratuais</h1>
                  <p className="text-white/40 font-mono">
                    Gerencie seus documentos contratuais com a TKB Asset
                  </p>
                </div>

                <Card className="mb-8 bg-[#111111] border-white/[0.04]">
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
                <Card className="mb-8 bg-[#111111] border-[#00D4FF]/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
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

                {/* Documentos Básicos - Sempre visíveis */}
                <div className="space-y-6 mb-8">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    ✅ Documentos Básicos
                  </h2>
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
                  </div>
                </div>

                {/* Documentos Contratuais e KYC - Accordion */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    📑 Documentos Contratuais e KYC
                  </h2>

                  <Accordion
                    type="multiple"
                    defaultValue={["contrato-quadro", "kyc-documents"]}
                    className="space-y-4"
                  >
                    {/* SEÇÃO 1: Contrato-Quadro */}
                    <AccordionItem
                      value="contrato-quadro"
                      className="border-2 rounded-lg px-6 bg-card hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-2xl">📄</span>
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-lg">Contrato-Quadro</h3>
                            <p className="text-sm text-muted-foreground">
                              Documento principal do relacionamento comercial
                            </p>
                          </div>
                          <DocumentStatusBadge
                            status={documents['contrato-quadro']?.status || 'pending'}
                          />
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pt-4">
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
                          hideTitle={true}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    {/* SEÇÃO 2: Dossiê KYC/CDD */}
                    <AccordionItem
                      value="kyc-documents"
                      className="border-2 rounded-lg px-6 bg-card hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-2xl">🔍</span>
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-lg">Dossiê KYC/CDD</h3>
                            <p className="text-sm text-muted-foreground">
                              5 documentos complementares para compliance
                            </p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                              {Object.values(documents).filter(d =>
                                d.document_type.startsWith('kyc-') && d.status === 'approved'
                              ).length}/5
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pt-4">
                        <KYCDocumentsSection
                          documents={documents}
                          onUpload={handleUpload}
                          onView={handleView}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
        </div>
      </div>
    </SidebarProvider>
  );
}
