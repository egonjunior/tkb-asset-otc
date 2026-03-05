import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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
    const contractRef = useRef<HTMLDivElement>(null);

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

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            if (!contractRef.current) return;

            // Gera o canvas da div com mais resolução
            const canvas = await html2canvas(contractRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");

            // Cria o documento jsPDF (A4)
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Calcula a altura da imagem no PDF mantendo a proporção
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeightInMm = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeightInMm;
            let position = 0;

            // Adiciona a primeira página
            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightInMm);
            heightLeft -= pdfHeight;

            // Se for preciso, adiciona mais páginas
            while (heightLeft > 0) {
                position = heightLeft - imgHeightInMm;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightInMm);
                heightLeft -= pdfHeight;
            }

            const fileName = `Contrato_Parceria_TKB_${formData.razaoSocial.replace(/\s+/g, '_') || 'assinatura'}.pdf`;
            pdf.save(fileName);

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
            const filePath = `${user.id}/${fileName}`;

            // Tenta upload no bucket 'documents'
            let uploadError: any = null;
            let uploadedBucket = 'documents';

            const { error: err1 } = await supabase.storage
                .from('documents')
                .upload(filePath, file, { upsert: true });

            if (err1) {
                console.warn('Upload falhou no bucket documents, tentando partner-contracts:', err1.message);
                uploadedBucket = 'partner-contracts';
                const { error: err2 } = await supabase.storage
                    .from('partner-contracts')
                    .upload(filePath, file, { upsert: true });

                if (err2) {
                    console.error('Upload falhou em ambos os buckets:', err2.message);
                    throw new Error(`Erro no upload: ${err1.message}. Verifique se o bucket de armazenamento está configurado no Supabase.`);
                }
            }

            // Pega a URL do arquivo salvo
            const { data: { publicUrl } } = supabase.storage
                .from(uploadedBucket)
                .getPublicUrl(filePath);

            // Atualiza o status do request de parceria para 'pending' e salva URL do contrato
            const { error: updateError } = await supabase
                .from('partner_requests')
                .update({
                    status: 'pending',
                    notes: `Contrato assinado: ${publicUrl}`,
                })
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Erro ao atualizar partner_request:', updateError);
            }

            toast.success("Contrato enviado com sucesso!");
            setStep(3);
            if (onComplete) onComplete();

        } catch (error: any) {
            console.error('Upload erro:', error);
            toast.error(error.message || "Erro ao fazer upload do contrato assinado. Verifique as permissões do bucket no Supabase.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full bg-[#111111] border-white/[0.04]">

            {/* Template HTML Escondido para Geração do Contrato com html2canvas */}
            <div style={{ position: "absolute", top: "-20000px", left: "-20000px" }}>
                <div
                    ref={contractRef}
                    style={{
                        width: "800px",
                        padding: "60px 50px",
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontFamily: "Times New Roman, serif",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        textAlign: "justify"
                    }}
                >
                    <h2 style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "30px" }}>
                        CONTRATO DE PARCERIA COMERCIAL<br />
                        INTERMEDIAÇÃO DE OPERAÇÕES CAMBIAIS EM CRIPTOATIVOS
                    </h2>

                    <p style={{ marginBottom: "20px" }}>Pelo presente instrumento particular, de um lado:</p>

                    <p style={{ marginBottom: "10px" }}><strong>CONTRATADA:</strong></p>
                    <p style={{ marginBottom: "20px" }}>
                        <strong>TOKENIZACAO MANAGEMENT GESTAO DE NEGOCIOS, PATRIMONIO E INVESTIMENTOS LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº 45.933.866/0001-93, com sede na Rua Fidencio Ramos, nº 100, Vila Olímpia, São Paulo/SP, CEP 04.551-010, atuando sob o nome fantasia "TOKEN BUSINESS ASSETS", neste ato representada na forma de seu Contrato Social, doravante denominada simplesmente "CONTRATADA" ou "TKB ASSET";
                    </p>

                    <p style={{ marginBottom: "10px" }}><strong>CONTRATANTE:</strong></p>
                    <p style={{ marginBottom: "30px" }}>
                        <strong>{formData.razaoSocial.toUpperCase() || "[RAZÃO SOCIAL PARCEIRO]"}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº {formData.cnpj || "[CNPJ]"}, com sede na {formData.endereco || "[ENDEREÇO]"}, neste ato representada por {formData.nomeRepresentante.toUpperCase() || "[NOME REPRESENTANTE]"}, {formData.nacionalidade || "Brasileiro(a)"}, {formData.profissao || "Empresário(a)"}, portador do RG nº {formData.rg || "[RG]"} e CPF/MF nº {formData.cpf || "[CPF]"}, doravante denominada simplesmente "CONTRATANTE" ou "PARCEIRO";
                    </p>

                    <p style={{ marginBottom: "30px" }}>
                        As partes acima qualificadas têm, entre si, justo e contratado o presente <strong>CONTRATO DE PARCERIA COMERCIAL</strong>, que se regerá pelas cláusulas e condições seguintes, que reciprocamente outorgam e aceitam:
                    </p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA PRIMEIRA – DO OBJETO E NATUREZA DA PARCERIA</strong></p>
                    <p style={{ marginBottom: "10px" }}>1.1. O presente contrato tem por objeto estabelecer parceria comercial entre CONTRATADA e CONTRATANTE para intermediação de operações de conversão entre moeda fiduciária (Real - BRL) e criptoativos (USDT - Tether), junto a CLIENTES FINAIS apresentados pelo PARCEIRO.</p>
                    <p style={{ marginBottom: "10px" }}>1.2. A CONTRATADA prestará os seguintes serviços aos CLIENTES FINAIS intermediados pelo PARCEIRO:</p>
                    <ul style={{ paddingLeft: "40px", marginBottom: "10px", listStyleType: "disc" }}>
                        <li>Conversão BRL → USDT (compra de criptoativo);</li>
                        <li>Conversão USDT → BRL (venda de criptoativo);</li>
                        <li>Conversão USDT → USD/EUR/ARS (remessa internacional);</li>
                        <li>Custódia temporária de criptoativos durante processamento de operações;</li>
                        <li>Suporte técnico e operacional relacionado às conversões.</li>
                    </ul>
                    <p style={{ marginBottom: "10px" }}>1.3. O PARCEIRO atuará como representante comercial da CONTRATADA, apresentando CLIENTES FINAIS interessados nos serviços descritos no item 1.2, realizando a interface comercial e coletando documentação necessária para due diligence.</p>
                    <p style={{ marginBottom: "30px" }}>1.4. Fica expressamente estabelecido que a CONTRATADA não presta serviços diretamente aos CLIENTES FINAIS, mas sim ao PARCEIRO, que assume a responsabilidade pela relação comercial com seus clientes, nos termos deste contrato.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA SEGUNDA – DA REMUNERAÇÃO E COMISSIONAMENTO</strong></p>
                    <p style={{ marginBottom: "10px" }}>2.1. Como contraprestação pelos serviços de intermediação prestados pelo PARCEIRO, a CONTRATADA pagará comissionamento calculado sobre o volume financeiro das operações realizadas pelos CLIENTES FINAIS apresentados pelo PARCEIRO.</p>
                    <p style={{ marginBottom: "10px" }}>2.2. A CONTRATADA cobrará dos CLIENTES FINAIS uma taxa de 1% (um por cento) sobre o valor de cada operação, destinada exclusivamente à CONTRATADA para cobertura de custos operacionais, tecnológicos e margem de lucro.</p>
                    <p style={{ marginBottom: "10px" }}>2.3. O PARCEIRO terá autonomia comercial para negociar com seus CLIENTES FINAIS uma taxa adicional de intermediação, de acordo com sua estratégia comercial, sendo recomendável a faixa de 0,5% a 1,5% adicional, totalizando ao cliente final entre 1,5% e 2,5% sobre o valor da operação.</p>
                    <p style={{ marginBottom: "10px" }}>2.4. A título exemplificativo, considere-se uma operação de USD 100.000,00 (cem mil dólares americanos):</p>

                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px", textAlign: "center" }}>
                        <thead>
                            <tr>
                                <th style={{ border: "1px solid black", padding: "5px" }}>Descrição</th>
                                <th style={{ border: "1px solid black", padding: "5px" }}>Taxa</th>
                                <th style={{ border: "1px solid black", padding: "5px" }}>Valor (USD)</th>
                                <th style={{ border: "1px solid black", padding: "5px" }}>Destinatário</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "5px" }}>Taxa base operacional</td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>1,0%</td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>USD 1.000</td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>CONTRATADA (TKB Asset)</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "5px" }}>Taxa intermediação PARCEIRO</td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>1,0%</td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>USD 1.000</td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>PARCEIRO (comissionamento)</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "5px", fontWeight: "bold" }}>Taxa total ao CLIENTE FINAL</td>
                                <td style={{ border: "1px solid black", padding: "5px", fontWeight: "bold" }}>2,0%</td>
                                <td style={{ border: "1px solid black", padding: "5px", fontWeight: "bold" }}>USD 2.000</td>
                                <td style={{ border: "1px solid black", padding: "5px", fontWeight: "bold" }}>Total operação</td>
                            </tr>
                        </tbody>
                    </table>

                    <p style={{ marginBottom: "10px" }}>2.5. O PARCEIRO faturará mensalmente seus CLIENTES FINAIS pela taxa de intermediação negociada, em seu próprio nome, emitindo as competentes notas fiscais de prestação de serviços de intermediação comercial, conforme legislação tributária vigente.</p>
                    <p style={{ marginBottom: "10px" }}>2.6. A CONTRATADA repassará ao PARCEIRO, até o 5º (quinto) dia útil do mês subsequente, relatório detalhado contendo volume total operado, taxa retida, demonstrativo financeiro e comprovante de disponibilidade de saldo.</p>
                    <p style={{ marginBottom: "30px" }}>2.7. O PARCEIRO poderá solicitar saque do comissionamento acumulado a qualquer momento, mediante solicitação via plataforma digital da CONTRATADA, com liquidação em até 48 (quarenta e oito) horas úteis.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DO PARCEIRO</strong></p>
                    <p style={{ marginBottom: "10px" }}>3.1. Compete ao PARCEIRO, no exercício de suas atividades de intermediação:</p>
                    <p style={{ marginBottom: "10px" }}>a) Due Diligence Comercial: Realizar análise prévia de cada CLIENTE FINAL antes de cadastrá-lo na plataforma da CONTRATADA, verificando: (i) capacidade jurídica e financeira; (ii) idoneidade comercial; (iii) compatibilidade entre atividade empresarial declarada e volume de operações pretendido;</p>
                    <p style={{ marginBottom: "10px" }}>b) Coleta Documental: Obter e anexar na plataforma digital da CONTRATADA, em relação a cada CLIENTE FINAL, a seguinte documentação obrigatória: (i) Contrato Social ou Estatuto Social atualizado; (ii) Documento de identificação com foto de todos os sócios e administradores (RG/CNH); (iii) Comprovante de endereço da sede empresarial; (iv) Última Declaração de Imposto de Renda Pessoa Jurídica (DIRPJ) ou Declaração de Informações Socioeconômicas e Fiscais (DEFIS); (v) Declaração de origem lícita de recursos, assinada pelo representante legal;</p>
                    <p style={{ marginBottom: "10px" }}>c) Representação Comercial: Atuar como único ponto de contato entre a CONTRATADA e os CLIENTES FINAIS, responsabilizando-se pela comunicação, negociação de prazos, esclarecimento de dúvidas e resolução de eventuais reclamações;</p>
                    <p style={{ marginBottom: "10px" }}>d) Monitoramento Contínuo: Acompanhar a regularidade das operações de seus CLIENTES FINAIS, reportando à CONTRATADA, de forma imediata, qualquer (i) alteração no quadro societário; (ii) mudança de endereço ou atividade empresarial; (iii) envolvimento em investigações, processos judiciais ou administrativos; (iv) suspeita de irregularidade ou ilicitude nas operações;</p>
                    <p style={{ marginBottom: "10px" }}>e) Atualização Documental: Renovar anualmente toda documentação prevista na alínea "b" deste item, mantendo os cadastros atualizados na plataforma da CONTRATADA;</p>
                    <p style={{ marginBottom: "10px" }}>f) Conformidade Legal: Assegurar que todas as operações intermediadas estejam em conformidade com a legislação brasileira aplicável, incluindo mas não se limitando a: Lei nº 9.613/98 (Lavagem de Dinheiro), Lei nº 14.478/22 (Marco Legal dos Criptoativos), Instrução Normativa RFB nº 1.888/19 e regulamentação posterior (DECRIPTO), Resoluções do Conselho de Controle de Atividades Financeiras (COAF);</p>
                    <p style={{ marginBottom: "10px" }}>3.2. O PARCEIRO declara ter ciência de que a ausência, incompletude ou desatualização da documentação prevista no item 3.1 impedirá o cadastramento ou acarretará o bloqueio imediato das operações do CLIENTE FINAL correspondente, sem qualquer responsabilidade ou ônus à CONTRATADA.</p>
                    <p style={{ marginBottom: "30px" }}>3.3. O PARCEIRO compromete-se a fornecer à CONTRATADA, em até 48 (quarenta e oito) horas, toda e qualquer documentação adicional ou esclarecimento solicitado em relação a seus CLIENTES FINAIS, sob pena de suspensão imediata das operações e aplicação das penalidades previstas neste contrato.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA QUARTA – DAS OBRIGAÇÕES DA CONTRATADA</strong></p>
                    <p style={{ marginBottom: "10px" }}>4.1. Compete à CONTRATADA:</p>
                    <p style={{ marginBottom: "10px" }}>a) Disponibilizar ao PARCEIRO acesso à plataforma digital para cadastramento e gestão de CLIENTES FINAIS, com interface intuitiva e suporte técnico;</p>
                    <p style={{ marginBottom: "10px" }}>b) Processar as operações de conversão de criptoativos dos CLIENTES FINAIS com eficiência, transparência e dentro dos prazos estimados (90 minutos para operações padrão);</p>
                    <p style={{ marginBottom: "10px" }}>c) Realizar análise de conformidade (compliance) da documentação fornecida pelo PARCEIRO, aprovando ou rejeitando cadastros em até 48 (quarenta e oito) horas úteis;</p>
                    <p style={{ marginBottom: "10px" }}>d) Manter sistema de registro e auditoria de todas as operações, com rastreabilidade completa em blockchain, atendendo requisitos regulatórios aplicáveis;</p>
                    <p style={{ marginBottom: "10px" }}>e) Emitir relatório mensal detalhado ao PARCEIRO conforme item 2.6, com demonstrativo financeiro de comissionamento;</p>
                    <p style={{ marginBottom: "10px" }}>f) Manter sigilo e confidencialidade sobre as informações comerciais e cadastrais dos CLIENTES FINAIS apresentados pelo PARCEIRO, utilizando-as exclusivamente para cumprimento deste contrato e obrigações legais.</p>
                    <p style={{ marginBottom: "30px" }}>4.2. A CONTRATADA reserva-se o direito de recusar o cadastramento ou suspender operações de qualquer CLIENTE FINAL que, a seu exclusivo critério técnico, apresente (i) documentação insuficiente ou inconsistente; (ii) indícios de irregularidade ou ilicitude; (iii) incompatibilidade entre perfil declarado e operações solicitadas; (iv) envolvimento em listas restritivas nacionais ou internacionais.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA QUINTA – DA RESPONSABILIDADE E GESTÃO DE RISCOS</strong></p>
                    <p style={{ marginBottom: "10px" }}>5.1. O PARCEIRO declara e garante que todos os CLIENTES FINAIS por ele apresentados: (i) exercem atividades econômicas lícitas; (ii) possuem recursos de origem comprovadamente lícita; (iii) não estão envolvidos em atividades ilícitas, investigações criminais ou processos que possam comprometer a reputação ou expor a CONTRATADA a riscos legais ou regulatórios.</p>
                    <p style={{ marginBottom: "10px" }}>5.2. O PARCEIRO assume responsabilidade integral e exclusiva por quaisquer danos, prejuízos, multas, sanções administrativas, penalidades ou contingências de natureza civil, criminal, tributária ou regulatória que venham a ser impostas à CONTRATADA em decorrência de:</p>
                    <p style={{ marginBottom: "10px" }}>a) Falsidade, incompletude ou inconsistência nas informações e documentos fornecidos pelo PARCEIRO em relação a seus CLIENTES FINAIS;</p>
                    <p style={{ marginBottom: "10px" }}>b) Falha do PARCEIRO em realizar due diligence adequada, conforme obrigações previstas na Cláusula Terceira deste contrato;</p>
                    <p style={{ marginBottom: "10px" }}>c) Atividades ilícitas, fraudulentas ou contrárias à legislação praticadas pelos CLIENTES FINAIS apresentados pelo PARCEIRO;</p>
                    <p style={{ marginBottom: "10px" }}>d) Descumprimento pelo PARCEIRO de qualquer obrigação prevista neste contrato, na legislação aplicável ou em regulamentação de órgãos competentes (Receita Federal, Banco Central, COAF, CVM).</p>
                    <p style={{ marginBottom: "10px" }}>5.3. Na hipótese de a CONTRATADA ser demandada, autuada, multada ou sofrer qualquer prejuízo em decorrência das situações previstas no item 5.2, o PARCEIRO obriga-se a:</p>
                    <p style={{ marginBottom: "10px" }}>a) Reembolsar integralmente a CONTRATADA, em até 30 (trinta) dias contados da notificação, por todos os valores despendidos, incluindo mas não se limitando a: (i) multas e penalidades administrativas; (ii) honorários advocatícios; (iii) custas processuais; (iv) indenizações a terceiros; (v) custos de auditoria e compliance; (vi) danos à imagem e reputação;</p>
                    <p style={{ marginBottom: "10px" }}>b) Prestar toda colaboração necessária à defesa da CONTRATADA, incluindo fornecimento de documentos, informações e testemunho, se aplicável;</p>
                    <p style={{ marginBottom: "10px" }}>c) Assumir, se assim decidir a CONTRATADA, a condução da defesa administrativa ou judicial, arcando com todos os custos, sob supervisão e aprovação prévia da CONTRATADA.</p>
                    <p style={{ marginBottom: "10px" }}>5.4. Fica expressamente pactuado que a CONTRATADA possui responsabilidade subsidiária apenas nas hipóteses em que restar comprovado que (i) o PARCEIRO forneceu toda documentação exigida de forma completa, verdadeira e atualizada; (ii) o PARCEIRO cumpriu integralmente todas as obrigações previstas neste contrato; e (iii) a CONTRATADA possuía conhecimento inequívoco e documentado da irregularidade praticada pelo CLIENTE FINAL e, mesmo assim, optou por processar a operação.</p>
                    <p style={{ marginBottom: "30px" }}>5.5. O PARCEIRO declara ter pleno conhecimento das normas de Prevenção à Lavagem de Dinheiro e Financiamento ao Terrorismo (PLD/FT), comprometendo-se a observá-las rigorosamente na seleção e monitoramento de seus CLIENTES FINAIS, sob pena de responsabilização nos termos deste contrato e da legislação vigente.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA SEXTA – DO DIREITO DE AUDITORIA</strong></p>
                    <p style={{ marginBottom: "10px" }}>6.1. A CONTRATADA reserva-se o direito de realizar, a qualquer tempo e sem aviso prévio, auditoria sobre a documentação e procedimentos adotados pelo PARCEIRO em relação aos seus CLIENTES FINAIS.</p>
                    <p style={{ marginBottom: "10px" }}>6.2. Na hipótese de auditoria, o PARCEIRO compromete-se a disponibilizar, em até 24 (vinte e quatro) horas, todos os documentos, registros, comunicações e informações solicitadas pela CONTRATADA.</p>
                    <p style={{ marginBottom: "30px" }}>6.3. Caso a auditoria identifique descumprimento de obrigações contratuais ou legais pelo PARCEIRO, a CONTRATADA poderá, sem prejuízo de outras medidas cabíveis: (i) suspender imediatamente todas as operações dos CLIENTES FINAIS vinculados ao PARCEIRO; (ii) bloquear o comissionamento pendente; (iii) rescindir o contrato, conforme Cláusula Nona.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA SÉTIMA – DA VIGÊNCIA E RENOVAÇÃO</strong></p>
                    <p style={{ marginBottom: "10px" }}>7.1. O presente contrato entra em vigor na data de sua assinatura eletrônica via plataforma Gov.br e terá prazo de vigência de 12 (doze) meses.</p>
                    <p style={{ marginBottom: "30px" }}>7.2. O contrato será automaticamente renovado por períodos sucessivos de 12 (doze) meses, salvo manifestação contrária de qualquer das partes, comunicada por escrito com antecedência mínima de 30 (trinta) dias do término da vigência.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA OITAVA – DA CONFIDENCIALIDADE</strong></p>
                    <p style={{ marginBottom: "10px" }}>8.1. As partes comprometem-se a manter sigilo absoluto sobre todas as informações comerciais, financeiras, operacionais e cadastrais trocadas em decorrência deste contrato, utilizando-as exclusivamente para os fins aqui previstos.</p>
                    <p style={{ marginBottom: "10px" }}>8.2. A obrigação de confidencialidade permanecerá em vigor mesmo após o término deste contrato, pelo prazo de 5 (cinco) anos.</p>
                    <p style={{ marginBottom: "30px" }}>8.3. Excetuam-se do dever de confidencialidade as informações que devam ser compartilhadas com autoridades competentes (Receita Federal, Banco Central, COAF, Poder Judiciário) em cumprimento a obrigações legais ou ordens judiciais.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA NONA – DA RESCISÃO</strong></p>
                    <p style={{ marginBottom: "10px" }}>9.1. O presente contrato poderá ser rescindido, sem prejuízo de perdas e danos:</p>
                    <p style={{ marginBottom: "10px" }}>a) Por acordo entre as partes, a qualquer tempo;</p>
                    <p style={{ marginBottom: "10px" }}>b) Por qualquer das partes, mediante notificação prévia de 30 (trinta) dias, sem necessidade de justificativa;</p>
                    <p style={{ marginBottom: "10px" }}>c) Pela CONTRATADA, de forma imediata e sem aviso prévio, nas seguintes hipóteses: (i) descumprimento pelo PARCEIRO de qualquer obrigação prevista na Cláusula Terceira; (ii) fornecimento de informações falsas ou documentação fraudulenta; (iii) envolvimento do PARCEIRO ou de seus CLIENTES FINAIS em atividades ilícitas; (iv) investigação criminal, autuação fiscal ou sanção administrativa contra o PARCEIRO; (v) falência, recuperação judicial ou extinção do PARCEIRO.</p>
                    <p style={{ marginBottom: "10px" }}>9.2. Na hipótese de rescisão por culpa do PARCEIRO (alínea "c" do item 9.1), este perderá o direito ao comissionamento ainda não liquidado, sem prejuízo de responder por perdas e danos causados à CONTRATADA.</p>
                    <p style={{ marginBottom: "30px" }}>9.3. Em caso de rescisão por qualquer motivo, o PARCEIRO permanece responsável por todos os CLIENTES FINAIS por ele cadastrados até a data da rescisão, inclusive quanto a eventuais contingências futuras relacionadas a operações já realizadas.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA DÉCIMA – DAS PENALIDADES</strong></p>
                    <p style={{ marginBottom: "10px" }}>10.1. O descumprimento de quaisquer das obrigações previstas neste contrato sujeitará a parte infratora ao pagamento de multa de 10% (dez por cento) sobre o valor total das operações processadas nos últimos 12 (doze) meses, sem prejuízo da reparação de eventuais perdas e danos adicionais.</p>
                    <p style={{ marginBottom: "30px" }}>10.2. A multa prevista no item anterior não exclui a responsabilidade da parte infratora pelo pagamento de indenização por danos materiais e morais causados à parte inocente, apurados em liquidação de sentença, se necessário.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA DÉCIMA PRIMEIRA – DAS DISPOSIÇÕES GERAIS</strong></p>
                    <p style={{ marginBottom: "10px" }}>11.1. Este contrato representa a integralidade do acordo entre as partes, substituindo e cancelando quaisquer entendimentos, negociações ou acordos anteriores, verbais ou escritos.</p>
                    <p style={{ marginBottom: "10px" }}>11.2. Qualquer alteração, aditamento ou renúncia a direitos previstos neste contrato somente terá validade se formalizada por escrito e assinada por ambas as partes.</p>
                    <p style={{ marginBottom: "10px" }}>11.3. A tolerância de qualquer das partes quanto ao descumprimento de obrigações pela outra parte não constituirá novação ou renúncia de direitos, podendo ser exigido o cumprimento a qualquer tempo.</p>
                    <p style={{ marginBottom: "10px" }}>11.4. Caso qualquer cláusula ou disposição deste contrato seja considerada nula ou inexequível por autoridade competente, as demais cláusulas permanecerão em pleno vigor e efeito.</p>
                    <p style={{ marginBottom: "30px" }}>11.5. As partes declaram que este contrato foi negociado de forma equilibrada, tendo ambas ampla compreensão de seus termos e condições, bem como ciência das obrigações e responsabilidades assumidas.</p>

                    <p style={{ marginBottom: "10px" }}><strong>CLÁUSULA DÉCIMA SEGUNDA – DO FORO</strong></p>
                    <p style={{ marginBottom: "30px" }}>12.1. As partes elegem o Foro da Comarca de São Paulo, Estado de São Paulo, com expressa renúncia a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer questões oriundas deste contrato.</p>

                    <p style={{ marginBottom: "40px" }}>E, por estarem assim justas e contratadas, as partes assinam eletronicamente o presente instrumento, via plataforma Gov.br, em 2 (duas) vias de igual teor e forma.</p>

                    <p style={{ marginBottom: "60px", textAlign: "right" }}>São Paulo/SP, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginTop: "40px", textAlign: "center" }}>
                        <div style={{ width: "45%" }}>
                            <p style={{ borderTop: "1px solid black", paddingTop: "10px", margin: "0" }}>
                                <strong>TOKENIZACAO MANAGEMENT GESTAO DE NEGOCIOS<br />PATRIMONIO E INVESTIMENTOS LTDA</strong>
                            </p>
                            <p style={{ margin: "5px 0" }}>(TOKEN BUSINESS ASSETS)</p>
                            <p style={{ margin: "0" }}>Representante Legal</p>
                        </div>
                        <div style={{ width: "45%" }}>
                            <p style={{ borderTop: "1px solid black", paddingTop: "10px", margin: "0" }}>
                                <strong>{formData.razaoSocial.toUpperCase() || "[RAZÃO SOCIAL PARCEIRO]"}</strong>
                            </p>
                            <p style={{ margin: "5px 0" }}>{formData.nomeRepresentante.toUpperCase() || "[NOME DO REPRESENTANTE]"}</p>
                            <p style={{ margin: "0" }}>Representante Legal</p>
                        </div>
                    </div>

                    <div style={{ marginTop: "60px" }}>
                        <p style={{ marginBottom: "40px" }}><strong>TESTEMUNHAS:</strong></p>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
                            <div style={{ width: "45%" }}>
                                <p style={{ borderTop: "1px solid black", paddingTop: "10px", margin: "0" }}>Nome:</p>
                                <p style={{ margin: "5px 0" }}>CPF:</p>
                            </div>
                            <div style={{ width: "45%" }}>
                                <p style={{ borderTop: "1px solid black", paddingTop: "10px", margin: "0" }}>Nome:</p>
                                <p style={{ margin: "5px 0" }}>CPF:</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fim do Template HTML */}


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
                            {isGenerating ? "Processando e Gerando (Aguarde)..." : (
                                <>
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Gerar e Baixar Contrato Completo
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
