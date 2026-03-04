import { useState } from "react";
import { X, Check, Upload, Building2, FileText, Sliders } from "lucide-react";

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const steps = [
    { id: 0, label: "Dados da Empresa", icon: Building2 },
    { id: 1, label: "Documentação", icon: FileText },
    { id: 2, label: "Configuração Comercial", icon: Sliders },
];

const requiredDocs = [
    { id: "contrato", name: "Contrato Social (PDF)", uploaded: false },
    { id: "rg_cpf", name: "RG/CPF Sócios (PDF)", uploaded: false },
    { id: "endereco", name: "Comprovante de Endereço", uploaded: false },
    { id: "pld", name: "Declaração PLD/FT Assinada", uploaded: false },
];

export function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [margin, setMargin] = useState(1.5);
    const [docs, setDocs] = useState(requiredDocs);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < 2) setCurrentStep(currentStep + 1);
        else {
            // Submit
            onSuccess();
            setCurrentStep(0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const simulateDrop = (docId: string) => {
        setDocs((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, uploaded: true } : d))
        );
    };

    // Mock TKB price
    const tkbBasePrice = 5.3358;
    const markupValue = tkbBasePrice * (margin / 100);
    const clientPrice = tkbBasePrice + markupValue;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-[#0D0D0D] rounded-2xl border border-white/[0.06] shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="shrink-0 border-b border-white/[0.04] p-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-base font-bold">Adicionar Novo Cliente</h3>
                        <p className="text-white/25 text-xs mt-0.5">Preencha os dados e anexe documentação</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors">
                        <X className="w-4 h-4 text-white/30" />
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="shrink-0 px-5 py-4 border-b border-white/[0.04]">
                    <div className="flex items-center justify-center gap-0">
                        {steps.map((step, i) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-semibold transition-all
                  ${currentStep > i
                                        ? "bg-[#00D4FF] border-[#00D4FF] text-white"
                                        : currentStep === i
                                            ? "border-[#00D4FF] text-[#00D4FF]"
                                            : "border-white/10 text-white/20"
                                    }
                `}>
                                    {currentStep > i ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`w-16 sm:w-24 h-0.5 mx-1.5 transition-all ${currentStep > i ? "bg-[#00D4FF]" : "bg-white/[0.06]"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-white/25 text-[11px] mt-2">{steps[currentStep].label}</p>
                </div>

                {/* Content (scrollable) */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* Step 1: Dados Empresa */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1.5">
                                        CNPJ <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all"
                                        placeholder="00.000.000/0001-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1.5">
                                        Razão Social <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 opacity-50"
                                        placeholder="Auto-preenche após CNPJ"
                                        disabled
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-1.5">
                                    Origem dos Recursos <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 resize-none focus:border-[#00D4FF]/30 outline-none transition-all"
                                    placeholder="Ex: Exportação de madeira, importação de insumos..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-1.5">
                                    Finalidade da Operação <span className="text-red-400">*</span>
                                </label>
                                <select className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm focus:border-[#00D4FF]/30 outline-none appearance-none">
                                    <option value="">Selecione...</option>
                                    <option>Pagamento fornecedores exterior</option>
                                    <option>Recebimento exportação</option>
                                    <option>Importação mercadoria</option>
                                    <option>Outra (especificar)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1.5">Contato Principal</label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all"
                                        placeholder="Nome do contato"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1.5">WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/15 focus:border-[#00D4FF]/30 outline-none transition-all"
                                        placeholder="(XX) XXXXX-XXXX"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Documentação */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            {/* Checklist */}
                            <div className="bg-black/30 border border-white/[0.04] rounded-xl p-4">
                                <p className="text-white text-xs font-medium mb-3">Documentos Obrigatórios</p>
                                <div className="space-y-2">
                                    {docs.map((doc) => (
                                        <div key={doc.id} className="flex items-center gap-2.5">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${doc.uploaded
                                                    ? "bg-emerald-500 border-emerald-500"
                                                    : "border-white/15"
                                                }`}>
                                                {doc.uploaded && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <span className={`text-xs ${doc.uploaded ? "text-white/30 line-through" : "text-white/60"}`}>
                                                {doc.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upload areas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {docs.map((doc) => (
                                    <div key={doc.id}>
                                        <label className="block text-[10px] font-medium text-white/30 mb-1.5 uppercase tracking-wider">
                                            {doc.name}
                                        </label>
                                        <div
                                            onClick={() => simulateDrop(doc.id)}
                                            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${doc.uploaded
                                                    ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                                                    : "border-white/[0.06] hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/[0.02]"
                                                }`}
                                        >
                                            {doc.uploaded ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-emerald-400 text-xs">Enviado ✓</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-white/15 mx-auto mb-1.5" />
                                                    <p className="text-[11px] text-white/25">Clique ou arraste</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Configuração Comercial */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            {/* Margin Slider */}
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-3">
                                    Margem para este Cliente (%)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3.0"
                                        step="0.1"
                                        value={margin}
                                        onChange={(e) => setMargin(parseFloat(e.target.value))}
                                        className="flex-1 accent-[#00D4FF] h-1.5"
                                    />
                                    <div className="px-4 py-2 bg-[#00D4FF]/[0.08] border border-[#00D4FF]/[0.15] rounded-lg">
                                        <span className="text-[#00D4FF] font-bold text-lg">{margin.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price Simulation */}
                            <div className="bg-black/30 border border-white/[0.04] rounded-xl p-5">
                                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-4 font-semibold">
                                    Simulação (volume USD 100.000)
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-[10px] text-white/20 mb-0.5">TKB recebe</p>
                                        <p className="text-white font-semibold text-sm">1,0% = USD 1.000</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/20 mb-0.5">Você recebe</p>
                                        <p className="text-[#00D4FF] font-semibold text-sm">
                                            {(margin - 1.0).toFixed(1)}% = USD {((margin - 1.0) * 1000).toFixed(0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/20 mb-0.5">Cliente paga</p>
                                        <p className="text-white font-semibold text-sm">
                                            {margin.toFixed(1)}% = USD {(margin * 1000).toFixed(0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Live Price Preview */}
                            <div className="bg-black/30 border border-white/[0.04] rounded-xl p-5">
                                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-4 font-semibold">
                                    Preço ao Vivo
                                </p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/40">Preço Base TKB:</span>
                                        <span className="text-white font-medium font-mono">R$ {tkbBasePrice.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-[#00D4FF]">
                                        <span>Seu Markup (+{margin.toFixed(1)}%):</span>
                                        <span className="font-bold font-mono">+ R$ {markupValue.toFixed(4)}</span>
                                    </div>
                                    <div className="h-px bg-white/[0.06]" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-semibold text-sm">O cliente vai ver:</span>
                                        <span className="text-xl font-bold text-white font-mono">R$ {clientPrice.toFixed(4)}</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/[0.04] text-center">
                                    <p className="text-[10px] text-white/20">Seu Lucro Bruto por USDT</p>
                                    <p className="text-emerald-400 font-bold text-base mt-0.5 font-mono">R$ {markupValue.toFixed(4)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="shrink-0 border-t border-white/[0.04] p-5 flex justify-between">
                    <button
                        onClick={currentStep === 0 ? onClose : handleBack}
                        className="px-5 py-2.5 text-white/30 hover:text-white/60 text-sm transition-colors"
                    >
                        {currentStep === 0 ? "Cancelar" : "Voltar"}
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/20 transition-all"
                    >
                        {currentStep === 2 ? "Adicionar Cliente" : "Continuar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
