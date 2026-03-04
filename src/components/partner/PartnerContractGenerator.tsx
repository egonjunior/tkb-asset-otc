import { useState } from "react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Upload, FileSignature, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export function PartnerContractGenerator({ onComplete }: { onComplete?: () => void }) {
    const { user, profile } = useAuth();

    // Dados do formulário para preencher o contrato
    const [formData, setFormData] = useState({
        razaoSocial: profile?.full_name || "",
        cnpj: profile?.document_number || "",
        endereco: profile?.address || "",
        nomeRepresentante: profile?.full_name || "",
        nacionalidade: "Brasileiro(a)",
        profissao: "Empresário(a)",
        rg: "",
        cpf: profile?.document_number || "",
    });

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const generatePDF = () => {
        setIsGenerating(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            const textWidth = pageWidth - margin * 2;

            const addText = (text: string, x: number, y: number, isBold = false, size = 11, align: "left" | "center" = "left") => {
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                doc.setFontSize(size);
                if (align === "center") {
                    doc.text(text, pageWidth / 2, y, { align: "center" });
                } else {
                    doc.text(text, x, y, { maxWidth: textWidth, align: "justify" });
                }
            };

            // Cabeçalho
            addText("CONTRATO DE PARCERIA COMERCIAL", margin, 20, true, 14, "center");
            addText("INTERMEDIAÇÃO DE OPERAÇÕES CAMBIAIS EM CRIPTOATIVOS", margin, 28, true, 12, "center");

            // Partes
            let currentY = 45;
            addText("Pelo presente instrumento particular, de um lado:", margin, currentY);

            currentY += 10;
            addText("CONTRATADA:", margin, currentY, true);
            currentY += 8;
            addText("TOKENIZACAO MANAGEMENT GESTAO DE NEGOCIOS, PATRIMONIO E INVESTIMENTOS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº 45.933.866/0001-93, com sede na Rua Fidencio Ramos, nº 100, Vila Olímpia, São Paulo/SP, CEP 04.551-010, atuando sob o nome fantasia \"TOKEN BUSINESS ASSETS\", neste ato representada na forma de seu Contrato Social, doravante denominada simplesmente \"CONTRATADA\" ou \"TKB ASSET\";", margin, currentY);

            currentY += 35;
            addText("CONTRATANTE:", margin, currentY, true);
            currentY += 8;
            const contratanteText = `${formData.razaoSocial.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº ${formData.cnpj}, com sede na ${formData.endereco}, neste ato representada por ${formData.nomeRepresentante.toUpperCase()}, ${formData.nacionalidade}, ${formData.profissao}, portador do RG nº ${formData.rg} e CPF/MF nº ${formData.cpf}, doravante denominada simplesmente "CONTRATANTE" ou "PARCEIRO";`;
            addText(contratanteText, margin, currentY);

            currentY += 35;
            addText("As partes acima qualificadas têm, entre si, justo e contratado o presente CONTRATO DE PARCERIA COMERCIAL, que se regerá pelas cláusulas e condições seguintes, que reciprocamente outorgam e aceitam:", margin, currentY);

            // Cláusulas (Resumidas para o gerador devido ao limite de linhas do jsPDF básico, ou quebras calculadas)
            currentY += 25;
            addText("CLÁUSULA PRIMEIRA – DO OBJETO E NATUREZA DA PARCERIA", margin, currentY, true);
            currentY += 8;
            addText("1.1. O presente contrato tem por objeto estabelecer parceria comercial entre CONTRATADA e CONTRATANTE para intermediação de operações de conversão entre moeda fiduciária (Real - BRL) e criptoativos (USDT - Tether), junto a CLIENTES FINAIS apresentados pelo PARCEIRO.", margin, currentY);

            currentY += 20;
            addText("CLÁUSULA SEGUNDA – DA REMUNERAÇÃO E COMISSIONAMENTO", margin, currentY, true);
            currentY += 8;
            addText("2.1. Como contraprestação pelos serviços de intermediação prestados pelo PARCEIRO, a CONTRATADA pagará comissionamento calculado sobre o volume financeiro das operações.", margin, currentY);
            currentY += 15;
            addText("2.2. A CONTRATADA cobrará dos CLIENTES FINAIS uma taxa base para cobertura de custos operacionais e margem de lucro. O PARCEIRO faturará sua comissão em seu próprio nome diretamente na plataforma.", margin, currentY);

            // Nova página
            doc.addPage();
            currentY = 20;

            addText("CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DO PARCEIRO", margin, currentY, true);
            currentY += 8;
            addText("3.1. Compete ao PARCEIRO realizar Due Diligence Comercial prévia, coleta de documentação KYC, representação comercial, e monitoramento contínuo das operações em conformidade com as leis de PLD.", margin, currentY);

            currentY += 25;
            addText("CLÁUSULA QUARTA – DAS OBRIGAÇÕES DA CONTRATADA", margin, currentY, true);
            currentY += 8;
            addText("4.1. Processar as operações de conversão de criptoativos dos CLIENTES FINAIS com eficiência, realizar análise de compliance, e disponibilizar plataforma sistêmica.", margin, currentY);

            currentY += 25;
            addText("CLÁUSULA QUINTA – DO FORO E DISPOSIÇÕES FINAIS", margin, currentY, true);
            currentY += 8;
            addText("5.1. As partes elegem o Foro da Comarca de São Paulo/SP para dirimir quaisquer questões.", margin, currentY);

            currentY += 20;
            addText("E, por estarem assim justas e contratadas, as partes assinam eletronicamente o presente instrumento, via plataforma Gov.br, em 2 (duas) vias de igual teor e forma.", margin, currentY);

            // Assinaturas
            currentY += 30;
            const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            addText(`São Paulo/SP, ${today}.`, margin, currentY);

            currentY += 30;
            addText("__________________________________________________", margin, currentY);
            currentY += 6;
            addText("TOKENIZACAO MANAGEMENT GESTAO DE NEGOCIOS", margin, currentY, true);
            currentY += 6;
            addText("(TOKEN BUSINESS ASSETS) - Representante Legal", margin, currentY);

            currentY += 25;
            addText("__________________________________________________", margin, currentY);
            currentY += 6;
            addText(formData.razaoSocial.toUpperCase(), margin, currentY, true);
            currentY += 6;
            addText(`${formData.nomeRepresentante} - Representante Legal`, margin, currentY);

            // Baixar PDF
            doc.save(`Contrato_Parceria_TKB_${formData.razaoSocial.replace(/\s+/g, '_')}.pdf`);

            toast.success("Contrato gerado com sucesso!");
            setStep(2);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar o contrato.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `contrato-parceria-${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `partners/${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Atualiza o status do request de parceria
            await supabase.from('partner_requests').update({ status: 'pending' }).eq('user_id', user.id).eq('request_type', 'assessor');

            toast.success("Contrato enviado com sucesso!");
            setStep(3);
            if (onComplete) onComplete();

        } catch (error) {
            console.error('Upload erro:', error);
            toast.error("Erro ao fazer upload do contrato assinado.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full bg-[#111111] border-white/[0.04]">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                    <FileSignature className="h-5 w-5 text-[#00D4FF]" />
                    Assinatura de Contrato
                </CardTitle>
                <CardDescription className="text-white/40">
                    Gere seu contrato personalizado, assine no Gov.br e envie de volta.
                </CardDescription>

                <div className="mt-6 mb-2">
                    <div className="flex justify-between text-xs text-white/50 mb-2 font-mono">
                        <span className={step >= 1 ? "text-[#00D4FF]" : ""}>1. Dados</span>
                        <span className={step >= 2 ? "text-[#00D4FF]" : ""}>2. Assinar</span>
                        <span className={step >= 3 ? "text-[#00D4FF]" : ""}>3. Concluído</span>
                    </div>
                    <Progress value={step === 1 ? 33 : step === 2 ? 66 : 100} className="h-1 bg-white/10" />
                </div>
            </CardHeader>

            <CardContent>
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/[0.04]">
                            <p className="text-sm text-white/60 mb-4">
                                Confirme os dados que irão constar no seu Contrato de Parceria:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-white/70">Razão Social / Nome Completo *</Label>
                                    <Input name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} className="bg-[#111111] border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">CNPJ / CPF *</Label>
                                    <Input name="cnpj" value={formData.cnpj} onChange={handleInputChange} className="bg-[#111111] border-white/10 text-white" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-white/70">Endereço Completo Sede *</Label>
                                    <Input name="endereco" value={formData.endereco} onChange={handleInputChange} placeholder="Rua, Número, Bairro, Cidade - UF" className="bg-[#111111] border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">Representante Legal *</Label>
                                    <Input name="nomeRepresentante" value={formData.nomeRepresentante} onChange={handleInputChange} className="bg-[#111111] border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">Nacionalidade</Label>
                                    <Input name="nacionalidade" value={formData.nacionalidade} onChange={handleInputChange} className="bg-[#111111] border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">Profissão</Label>
                                    <Input name="profissao" value={formData.profissao} onChange={handleInputChange} className="bg-[#111111] border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">RG Representante *</Label>
                                    <Input name="rg" value={formData.rg} onChange={handleInputChange} className="bg-[#111111] border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">CPF Representante *</Label>
                                    <Input name="cpf" value={formData.cpf} onChange={handleInputChange} className="bg-[#111111] border-white/10 text-white" />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={generatePDF}
                            disabled={isGenerating || !formData.razaoSocial || !formData.cnpj}
                            className="w-full bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white hover:opacity-90"
                        >
                            {isGenerating ? "Gerando Contrato..." : (
                                <>
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Gerar e Baixar Contrato
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-[#0A0A0A] p-6 rounded-xl border border-white/[0.04] space-y-4">
                            <CheckCircle2 className="w-12 h-12 text-[#00D4FF] mx-auto" />
                            <h3 className="text-lg font-medium text-white">Contrato Gerado com Sucesso!</h3>

                            <div className="text-sm text-white/60 space-y-2 text-left bg-white/[0.02] p-4 rounded-lg">
                                <p><strong>1.</strong> O contrato PDF foi baixado no seu dispositivo.</p>
                                <p><strong>2.</strong> Acesse o portal <strong>Gov.br</strong> para assinar digitalmente o documento.</p>
                                <p><strong>3.</strong> Após assinar, faça o upload do arquivo finalizado abaixo.</p>
                            </div>

                            <div className="pt-4 flex flex-col items-center">
                                <Label
                                    htmlFor="contract-upload"
                                    className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3 w-full border-2 border-dashed border-white/20 rounded-xl hover:border-[#00D4FF]/50 hover:bg-[#00D4FF]/5 transition-all"
                                >
                                    {isUploading ? "Enviando..." : (
                                        <>
                                            <Upload className="w-5 h-5 text-[#00D4FF]" />
                                            <span className="text-white">Anexar Contrato Assinado</span>
                                        </>
                                    )}
                                </Label>
                                <input
                                    id="contract-upload"
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        <Button variant="ghost" onClick={() => setStep(1)} className="text-white/50 hover:text-white">
                            Voltar e corrigir dados
                        </Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 text-center py-6 animate-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-[#00D4FF]/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                            <div className="absolute inset-0 bg-[#00D4FF]/20 rounded-full animate-ping opacity-20"></div>
                            <CheckCircle2 className="w-8 h-8 text-[#00D4FF]" />
                        </div>
                        <h3 className="text-xl font-medium text-white">Parceria Formalizada!</h3>
                        <p className="text-white/50 text-sm max-w-sm mx-auto">
                            Seu contrato assinado foi recebido com sucesso e será validado pelo nosso time de compliance.
                        </p>
                        <div className="pt-4">
                            <Button onClick={() => window.location.href = "/dashboard"} className="bg-white/10 hover:bg-white/20 text-white">
                                Ir para o Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
