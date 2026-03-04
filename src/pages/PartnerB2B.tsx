import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tkbLogo from "@/assets/tkb-logo.png";
import {
  ArrowLeft, Check, Upload, X, Loader2,
  Building2, FileText, ShieldCheck, Eye, ChevronRight,
} from "lucide-react";

const STEPS = [
  { id: 0, label: "Dados da Empresa", icon: Building2 },
  { id: 1, label: "Documentação KYC", icon: FileText },
  { id: 2, label: "Contrato de Parceria", icon: ShieldCheck },
];

const REQUIRED_DOCS = [
  { id: "contrato_social", label: "Contrato Social (PDF)", required: true },
  { id: "rg_cpf_socios", label: "RG/CPF Sócios (PDF)", required: true },
  { id: "comp_endereco", label: "Comprovante de Endereço", required: true },
  { id: "decl_pld", label: "Declaração PLD/FT Assinada", required: true },
];

const CONTRACT_TERMS = [
  "Comissão de 1% por operação realizada por clientes indicados",
  "Responsabilidade integral pela due diligence (KYC) de cada cliente",
  "Obrigatoriedade de coleta e armazenamento de documentação compliance",
  "Vigência de 12 meses com renovação automática",
  "Liquidação D+0 conforme termos operacionais da TKB Asset",
  "Operação sob regulação da Lei 14.478/2022",
];

export default function PartnerB2B() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cnpj: "",
    razaoSocial: "",
    endereco: "",
    origemRecursos: "",
    volumeEstimado: "",
  });

  // CNPJ validation state
  const [cnpjValidating, setCnpjValidating] = useState(false);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);
  const [cnpjInfo, setCnpjInfo] = useState<{ razaoSocial: string; situacao: string } | null>(null);

  // Docs state
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  // Contract state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showContract, setShowContract] = useState(false);

  // Count completed fields for step 1
  const step1Fields = [formData.name, formData.phone, formData.cnpj, formData.endereco, formData.origemRecursos, formData.volumeEstimado];
  const completedFields = step1Fields.filter(f => f.trim().length > 0).length;
  const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;

  const handleCNPJChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    // Format: XX.XXX.XXX/XXXX-XX
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + "." + cleaned.slice(2);
    if (cleaned.length > 5) formatted = formatted.slice(0, 6) + "." + cleaned.slice(5);
    if (cleaned.length > 8) formatted = formatted.slice(0, 10) + "/" + cleaned.slice(8);
    if (cleaned.length > 12) formatted = formatted.slice(0, 15) + "-" + cleaned.slice(12, 14);

    setFormData({ ...formData, cnpj: formatted });
    setCnpjValid(null);
    setCnpjInfo(null);

    if (cleaned.length === 14) {
      setCnpjValidating(true);
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1200));
      setCnpjValidating(false);
      setCnpjValid(true);
      const mockRazao = "Empresa Parceira Ltda";
      setCnpjInfo({ razaoSocial: mockRazao, situacao: "Ativa" });
      setFormData((prev) => ({ ...prev, razaoSocial: mockRazao }));
    }
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleDocUpload = (docId: string) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: true }));
  };

  const canAdvanceStep = () => {
    if (currentStep === 0) return completedFields >= 5;
    if (currentStep === 1) return uploadedCount >= 4;
    if (currentStep === 2) return acceptedTerms;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("partner_requests").insert({
        name: formData.razaoSocial || formData.name,
        phone: formData.phone,
        request_type: "b2b_otc",
        status: "pending",
        user_id: user?.id || null,
        notes: `Responsável: ${formData.name}\nCNPJ: ${formData.cnpj}\nEndereço: ${formData.endereco}\nOrigem Recursos: ${formData.origemRecursos}\nVolume Estimado: R$ ${formData.volumeEstimado}`,
        trading_volume_monthly: parseFloat(formData.volumeEstimado) || 0,
      });
      if (error) throw error;
      toast.success("Solicitação enviada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.04] bg-[#0D0D0D]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <img src={tkbLogo} alt="TKB" className="h-7 w-7" />
            <div>
              <h1 className="text-white text-sm font-bold">Parceria B2B</h1>
              <p className="text-white/20 text-[10px]">Portal de cadastro para mesas OTC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0 bg-[#0D0D0D] border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2.5">
                  <div className={`
                    flex items-center justify-center w-9 h-9 rounded-full border-2 text-xs font-semibold transition-all
                    ${currentStep > i
                      ? "bg-[#00D4FF] border-[#00D4FF] text-white"
                      : currentStep === i
                        ? "border-[#00D4FF] text-[#00D4FF] bg-[#00D4FF]/[0.06]"
                        : "border-white/[0.08] text-white/15"
                    }
                  `}>
                    {currentStep > i ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${currentStep >= i ? "text-white/60" : "text-white/15"
                    }`}>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-4 rounded-full transition-all ${currentStep > i ? "bg-[#00D4FF]" : "bg-white/[0.04]"
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* ═══════════════════ STEP 1: DADOS DA EMPRESA ═══════════════════ */}
          {currentStep === 0 && (
            <div className="space-y-5">
              {/* Progress mini */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/25 text-xs">Dados da Empresa</span>
                <span className="text-white/15 text-[10px] font-mono">{completedFields}/6 campos</span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] rounded-full transition-all duration-500"
                  style={{ width: `${(completedFields / 6) * 100}%` }}
                />
              </div>

              <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-5 space-y-4">
                {/* CNPJ */}
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">
                    CNPJ <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => handleCNPJChange(e.target.value)}
                      maxLength={18}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all font-mono"
                      placeholder="00.000.000/0001-00"
                    />
                    {cnpjValidating && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-[#00D4FF] animate-spin" />
                      </div>
                    )}
                  </div>
                  {cnpjValid && cnpjInfo && (
                    <div className="mt-2 p-3 bg-emerald-500/[0.05] border border-emerald-500/[0.1] rounded-lg">
                      <p className="text-emerald-400 text-xs font-medium">✓ {cnpjInfo.razaoSocial}</p>
                      <p className="text-white/20 text-[10px] mt-0.5">Situação: {cnpjInfo.situacao}</p>
                    </div>
                  )}
                </div>

                {/* Nome responsável */}
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">
                    Nome do Responsável <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all"
                    placeholder="Nome completo"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">
                    WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all"
                    placeholder="(41) 99999-9999"
                  />
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">
                    Endereço Completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all"
                    placeholder="Rua, número, cidade - UF"
                  />
                </div>

                {/* Origem recursos */}
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">
                    Origem dos Recursos <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.origemRecursos}
                    onChange={(e) => setFormData({ ...formData, origemRecursos: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 resize-none focus:border-[#00D4FF]/30 outline-none transition-all"
                    placeholder="Ex: Exportação de madeira para o exterior"
                  />
                </div>

                {/* Volume estimado */}
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">
                    Volume Mensal Estimado (R$) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.volumeEstimado}
                    onChange={(e) => setFormData({ ...formData, volumeEstimado: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all font-mono"
                    placeholder="500000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ STEP 2: DOCUMENTAÇÃO KYC ═══════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/25 text-xs">Documentação KYC</span>
                <span className="text-white/15 text-[10px] font-mono">{uploadedCount}/4 documentos</span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] rounded-full transition-all duration-500"
                  style={{ width: `${(uploadedCount / 4) * 100}%` }}
                />
              </div>

              {/* Checklist */}
              <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-5">
                <p className="text-white text-xs font-semibold mb-3">Documentos Obrigatórios</p>
                <div className="space-y-2 mb-5">
                  {REQUIRED_DOCS.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${uploadedDocs[doc.id]
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-white/10"
                        }`}>
                        {uploadedDocs[doc.id] && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-xs ${uploadedDocs[doc.id] ? "text-white/25 line-through" : "text-white/50"}`}>
                        {doc.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Upload areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REQUIRED_DOCS.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleDocUpload(doc.id)}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${uploadedDocs[doc.id]
                          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                          : "border-white/[0.06] hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/[0.02]"
                        }`}
                    >
                      {uploadedDocs[doc.id] ? (
                        <div className="flex flex-col items-center gap-1">
                          <Check className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400/70 text-[10px]">{doc.label}</span>
                          <span className="text-emerald-400 text-[10px] font-medium">Enviado ✓</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Upload className="w-5 h-5 text-white/15" />
                          <span className="text-white/25 text-[10px]">{doc.label}</span>
                          <span className="text-[#00D4FF]/40 text-[9px]">Clique ou arraste</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-white/10 text-[10px] mt-4 text-center">
                  Formatos aceitos: PDF, JPG, PNG • Máx 10MB por arquivo
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════ STEP 3: CONTRATO ═══════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="bg-[#111111] border border-white/[0.04] rounded-2xl overflow-hidden">
                {/* Contract header */}
                <div className="p-5 border-b border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white text-sm font-bold">Contrato de Parceria Comercial</h3>
                      <p className="text-white/20 text-[10px] mt-0.5">TKB Asset × {formData.razaoSocial || "Sua Empresa"}</p>
                    </div>
                    <button
                      onClick={() => setShowContract(!showContract)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] rounded-lg text-white/40 text-[10px] transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      {showContract ? "Minimizar" : "Ver Contrato Completo"}
                    </button>
                  </div>
                </div>

                {/* Contract preview */}
                {showContract && (
                  <div className="p-5 bg-black/20 border-b border-white/[0.04] max-h-60 overflow-y-auto">
                    <div className="prose prose-invert prose-xs max-w-none">
                      <p className="text-white/30 text-[11px] leading-relaxed">
                        <strong className="text-white/50">CONTRATO DE PARCERIA COMERCIAL</strong><br /><br />
                        Pelo presente instrumento, de um lado <strong className="text-white/50">TKB ASSET LTDA</strong>,
                        inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, doravante denominada <strong>"TKB"</strong>,
                        e de outro lado <strong className="text-[#00D4FF]/60">{formData.razaoSocial || "[Razão Social]"}</strong>,
                        inscrita no CNPJ sob nº <strong className="text-[#00D4FF]/60">{formData.cnpj || "[CNPJ]"}</strong>,
                        doravante denominada <strong>"PARCEIRO"</strong>, celebram o presente contrato de parceria comercial...<br /><br />
                        Este contrato estabelece os termos e condições para a intermediação de operações OTC
                        de compra e venda de stablecoins (USDT/Tether), em conformidade com a Lei 14.478/2022
                        e demais regulamentações aplicáveis ao mercado de ativos virtuais no Brasil.
                      </p>
                    </div>
                  </div>
                )}

                {/* Key terms */}
                <div className="p-5">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-3">
                    Principais Termos
                  </p>
                  <div className="space-y-2.5">
                    {CONTRACT_TERMS.map((term, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <ChevronRight className="w-3 h-3 text-[#00D4FF]/40 mt-0.5 shrink-0" />
                        <span className="text-white/40 text-xs leading-relaxed">{term}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary sidebar info */}
                <div className="p-5 bg-black/20 border-t border-white/[0.04]">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-white/15 text-[10px]">Parte 1</p>
                      <p className="text-white/40 font-medium">TKB Asset LTDA</p>
                    </div>
                    <div>
                      <p className="text-white/15 text-[10px]">Parte 2</p>
                      <p className="text-[#00D4FF]/50 font-medium">{formData.razaoSocial || "—"}</p>
                    </div>
                    <div>
                      <p className="text-white/15 text-[10px]">CNPJ Parceiro</p>
                      <p className="text-white/40 font-mono text-[11px]">{formData.cnpj || "—"}</p>
                    </div>
                    <div>
                      <p className="text-white/15 text-[10px]">Vigência</p>
                      <p className="text-white/40">12 meses (renovação auto)</p>
                    </div>
                  </div>
                </div>

                {/* Accept terms */}
                <div className="p-5 border-t border-white/[0.04]">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 text-[#00D4FF] focus:ring-[#00D4FF]/30 bg-transparent cursor-pointer"
                    />
                    <span className="text-white/40 text-xs leading-relaxed group-hover:text-white/50 transition-colors">
                      Li e aceito integralmente os termos do <strong className="text-white/60">Contrato de Parceria Comercial</strong> e
                      o <strong className="text-white/60">Termo de Responsabilidade KYC/PLD</strong>.
                      Declaro ciência de todas as obrigações e conformidade com a legislação vigente.
                    </span>
                  </label>
                </div>
              </div>

              {/* Gov.br Signature (placeholder) */}
              <div className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border border-green-500/[0.12] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/[0.1] rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-semibold">Assinatura Digital</h4>
                    <p className="text-white/20 text-[10px]">Em breve: integração Gov.br para assinatura digital</p>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full py-3 bg-gradient-to-r from-green-600/30 to-emerald-600/30 text-green-200/40 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-green-500/10"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Assinar com Gov.br (em breve)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 border-t border-white/[0.04] bg-[#0D0D0D]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={currentStep === 0 ? () => navigate("/dashboard") : handleBack}
            className="px-4 py-2 text-white/25 hover:text-white/50 text-sm transition-colors"
          >
            {currentStep === 0 ? "Cancelar" : "Voltar"}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white/10 text-[10px] font-mono mr-2">
              Passo {currentStep + 1} de 3
            </span>
            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                disabled={!canAdvanceStep()}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!acceptedTerms || isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Solicitação"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
