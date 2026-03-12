import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Building2, Landmark, MapPin, DollarSign, Clock, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BankAccount {
    id: string;
    bankName: string;
    routingNumber: string;
    accountNumber: string;
    postalCode: string;
    city: string;
    address: string;
}

interface BankWireOrderFormProps {
    binancePrice: number | null;
    isLoading: boolean;
    onSubmit: (data: any) => void;
    isSubmitting?: boolean;
}

const BankWireOrderForm = ({
    binancePrice,
    isLoading,
    onSubmit,
    isSubmitting = false
}: BankWireOrderFormProps) => {
    const [step, setStep] = useState<"account" | "order" | "confirm">("account");
    const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");

    // New account fields
    const [newAccount, setNewAccount] = useState({
        bankName: "",
        routingNumber: "",
        accountNumber: "",
        postalCode: "",
        city: "",
        address: ""
    });

    // Order fields
    const [usdAmount, setUsdAmount] = useState("");
    const [markup] = useState(0.012); // 1.2%

    // Calculation
    const finalPrice = binancePrice ? binancePrice * (1 + markup) : null;
    const totalBrl = finalPrice && usdAmount ? finalPrice * parseFloat(usdAmount) : 0;

    // Load mock/saved accounts from localStorage for preview
    useEffect(() => {
        const saved = localStorage.getItem("tkb_bank_accounts");
        if (saved) {
            setSavedAccounts(JSON.parse(saved));
        }
    }, []);

    const handleSaveAccount = (e: React.FormEvent) => {
        e.preventDefault();
        const id = crypto.randomUUID();
        const accountWithId = { ...newAccount, id };
        const updated = [...savedAccounts, accountWithId];
        setSavedAccounts(updated);
        localStorage.setItem("tkb_bank_accounts", JSON.stringify(updated));
        setSelectedAccountId(id);
        toast({
            title: "Conta cadastrada!",
            description: "Sua conta bancária foi salva para futuras operações."
        });
        setStep("order");
    };

    const handleConfirmOrder = () => {
        const selectedAccount = savedAccounts.find(a => a.id === selectedAccountId);
        onSubmit({
            type: "bank_wire",
            usdAmount: parseFloat(usdAmount),
            brlTotal: totalBrl,
            lockedPrice: finalPrice,
            account: selectedAccount,
            lockedAt: new Date().toISOString()
        });
    };

    const formatBRL = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Card className="premium-card bg-[#06080E]/40 backdrop-blur-2xl border-white/[0.08] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A853]/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-[#D4A853]/8 transition-premium" />

            <CardHeader className="relative z-10 border-b border-white/[0.04] pb-8 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-[#D4A853]">
                        <Landmark className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-brand tracking-tighter text-white">Remessa Internacional USD</CardTitle>
                        <p className="text-white/30 text-[10px] uppercase font-mono tracking-[0.2em] mt-1">
                            Liquidado via Wire EUA · Processamento Prioritário
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 space-y-10">
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-12 px-2 max-w-xl mx-auto">
                    {[
                        { id: "account", icon: Building2, label: "Destinatário" },
                        { id: "order", icon: DollarSign, label: "Volume" },
                        { id: "confirm", icon: CheckCircle2, label: "Verificação" }
                    ].map((s, idx, arr) => {
                        const active = step === s.id;
                        const completed = (step === "order" && s.id === "account") || (step === "confirm" && (s.id === "account" || s.id === "order"));

                        return (
                            <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-3 relative">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-premium relative z-10 ${active ? "bg-[#D4A853] border-[#D4A853] text-[#06080E] shadow-[0_0_20px_rgba(212,168,83,0.3)]" :
                                            completed ? "bg-[#D4A853]/20 border-[#D4A853]/40 text-[#D4A853]" :
                                                "bg-white/[0.02] border-white/[0.06] text-white/20"
                                        }`}>
                                        <s.icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-[9px] uppercase font-mono font-bold tracking-[0.2em] absolute -bottom-6 whitespace-nowrap ${active ? "text-[#D4A853]" : "text-white/20"}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className="flex-1 h-px bg-white/[0.05] mx-4 relative top-[-10px]">
                                        <div className={`h-full bg-[#D4A853]/40 transition-all duration-700 ${completed ? 'w-full' : 'w-0'}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {step === "account" && (
                    <div className="animate-in fade-in slide-in-from-right-6 duration-500">
                        {savedAccounts.length > 0 && (
                            <div className="mb-10 space-y-4">
                                <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Contas Registradas</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {savedAccounts.map((acc) => (
                                        <div
                                            key={acc.id}
                                            onClick={() => setSelectedAccountId(acc.id)}
                                            className={`p-5 rounded-2xl border transition-premium cursor-pointer relative overflow-hidden group/card ${selectedAccountId === acc.id
                                                    ? "bg-[#D4A853]/10 border-[#D4A853]/40"
                                                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`font-brand uppercase tracking-wider text-sm ${selectedAccountId === acc.id ? "text-[#D4A853]" : "text-white/80"}`}>
                                                    {acc.bankName}
                                                </span>
                                                {selectedAccountId === acc.id && <CheckCircle2 className="h-4 w-4 text-[#D4A853]" />}
                                            </div>
                                            <p className="text-[11px] font-mono text-white/40 group-hover/card:text-white/60 transition-colors">
                                                Acct Index: ···{acc.accountNumber.slice(-4)}
                                            </p>
                                            <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mt-1">Wire Routing: {acc.routingNumber}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        onClick={() => { setSelectedAccountId(""); localStorage.removeItem("tkb_bank_accounts"); setSavedAccounts([]); }}
                                        className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20 hover:text-red-500/40 transition-colors"
                                    >
                                        Limpar Cache de Aplicativo
                                    </button>

                                    {selectedAccountId && (
                                        <Button
                                            className="px-8 h-12 bg-[#D4A853] hover:bg-[#D4A853]/90 text-[#06080E] rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(212,168,83,0.2)]"
                                            onClick={() => setStep("order")}
                                        >
                                            Prosseguir para Volume <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="relative my-10">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.03]" /></div>
                                    <div className="relative flex justify-center text-[9px] uppercase tracking-[0.4em] font-mono text-white/10"><span className="bg-[#06080E] px-4">Nova Entidade Bancária</span></div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveAccount} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {[
                                    { id: "bankName", label: "Instituição Financeira", placeholder: "Ex: J.P. Morgan Chase", value: newAccount.bankName, key: "bankName" },
                                    { id: "routing", label: "Routing Number (Wire)", placeholder: "9 Dígitos Numéricos", value: newAccount.routingNumber, key: "routingNumber" },
                                    { id: "account", label: "Nº da Conta Corrente", placeholder: "International USD Account", value: newAccount.accountNumber, key: "accountNumber" },
                                    { id: "postal", label: "ZIP Code / Cód. Postal", placeholder: "00000", value: newAccount.postalCode, key: "postalCode" },
                                    { id: "city", label: "Cidade / Estado", placeholder: "City, State", value: newAccount.city, key: "city" },
                                    { id: "address", label: "Endereço Físico", placeholder: "Registered Billing Address", value: newAccount.address, key: "address" }
                                ].map((field) => (
                                    <div key={field.id} className="space-y-3">
                                        <Label htmlFor={field.id} className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">{field.label}</Label>
                                        <Input
                                            id={field.id}
                                            value={field.value}
                                            onChange={e => setNewAccount({ ...newAccount, [(field.key)]: e.target.value })}
                                            placeholder={field.placeholder}
                                            className="h-12 bg-white/[0.02] border-white/[0.06] text-white/80 rounded-xl px-4 focus:border-[#D4A853]/40 transition-premium placeholder:text-white/10"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button type="submit" className="w-full h-14 border border-[#D4A853]/40 bg-transparent hover:bg-[#D4A853]/10 text-[#D4A853] rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-apple">
                                Registrar Entidade e Continuar
                            </Button>
                        </form>
                    </div>
                )}

                {step === "order" && (
                    <div className="animate-in fade-in slide-in-from-right-6 duration-500 space-y-10">
                        <div className="space-y-4 max-w-md mx-auto">
                            <Label htmlFor="usdAmount" className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block text-center">Montante de Liquidação (USD)</Label>
                            <div className="relative group/input">
                                <Input
                                    id="usdAmount"
                                    type="number"
                                    value={usdAmount}
                                    onChange={e => setUsdAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="text-center text-4xl font-brand tracking-tighter h-20 bg-white/[0.02] border-white/[0.1] text-white rounded-3xl focus:border-[#D4A853] transition-premium"
                                    required
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-brand text-xl text-[#D4A853]">USD</div>
                            </div>
                        </div>

                        {usdAmount && binancePrice && (
                            <div className="bg-[#D4A853]/[0.05] border border-[#D4A853]/20 rounded-[2rem] p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
                                <div className="grid grid-cols-2 gap-y-4">
                                    <div className="space-y-1">
                                        <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest">Mark-to-Market (Binance)</p>
                                        <p className="text-white/60 font-mono text-xs">{formatBRL(binancePrice)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest">Prêmio TKB (1.2%)</p>
                                        <p className="text-[#D4A853] font-mono text-xs">+{formatBRL(binancePrice * markup)}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/[0.05]" />
                                <div className="flex justify-between items-center">
                                    <span className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em]">Cotação Institucional</span>
                                    <span className="text-3xl font-brand text-[#D4A853] tracking-tighter">{formatBRL(finalPrice || 0)}</span>
                                </div>
                                <div className="bg-gradient-to-r from-[#D4A853] to-[#B8860B] rounded-2xl p-6 shadow-[0_10px_30px_rgba(212,168,83,0.3)]">
                                    <div className="text-[10px] uppercase font-mono font-black tracking-[0.3em] text-[#06080E]/60 mb-1">Contrapartida Estimada em BRL</div>
                                    <div className="text-4xl font-brand text-[#06080E] tracking-tighter leading-none">{formatBRL(totalBrl)}</div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="ghost" className="flex-1 h-12 rounded-xl text-white/30 hover:text-white" onClick={() => setStep("account")}>Corrigir Destino</Button>
                            <Button
                                className="flex-[2] h-12 bg-[#D4A853] hover:bg-[#D4A853]/90 text-[#06080E] rounded-xl font-bold uppercase tracking-widest text-xs"
                                disabled={!usdAmount}
                                onClick={() => setStep("confirm")}
                            >
                                Revisar Memorando de Ordem
                            </Button>
                        </div>
                    </div>
                )}

                {step === "confirm" && (
                    <div className="animate-in fade-in slide-in-from-right-6 duration-500 space-y-8">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex gap-4 text-red-400">
                            <AlertCircle className="h-6 w-6 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-brand uppercase tracking-widest text-xs">Verificação de Conformidade</p>
                                <p className="text-[11px] leading-relaxed opacity-80 uppercase tracking-widest">Certifique-se da exatidão dos dados bancários. Erros no routing ou conta podem causar atrasos irreversíveis na liquidação internacional.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-8 space-y-6">
                                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00D4FF]/60 mb-2">Resumo Financeiro</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-white/20 text-[10px] font-mono uppercase">Montante Bruto</span>
                                        <span className="text-white font-brand text-2xl tracking-tighter">{parseFloat(usdAmount).toLocaleString()} USD</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-white/20 text-[10px] font-mono uppercase">Liquidação BRL</span>
                                        <span className="text-[#D4A853] font-brand text-2xl tracking-tighter">{formatBRL(totalBrl)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-8">
                                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D4A853]/60 mb-6">Conta Destino EUA</p>
                                <div className="space-y-2">
                                    <p className="font-brand text-lg text-white uppercase tracking-wider leading-none mb-4">{savedAccounts.find(a => a.id === selectedAccountId)?.bankName}</p>
                                    <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-white/40 uppercase tracking-widest">
                                        <p>Account: {savedAccounts.find(a => a.id === selectedAccountId)?.accountNumber}</p>
                                        <p>Routing Wire: {savedAccounts.find(a => a.id === selectedAccountId)?.routingNumber}</p>
                                        <p className="mt-4 leading-relaxed max-w-[200px]">
                                            {savedAccounts.find(a => a.id === selectedAccountId)?.address}, {savedAccounts.find(a => a.id === selectedAccountId)?.city}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-white/30 hover:text-white" onClick={() => setStep("order")}>Voltar</Button>
                            <Button
                                className="flex-[2] h-14 bg-[#D4A853] hover:bg-[#D4A853]/90 text-[#06080E] rounded-2xl font-bold uppercase tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(212,168,83,0.3)] transition-apple"
                                onClick={handleConfirmOrder}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Autenticando..." : "✅ Confirmar e Ir para Transação"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BankWireOrderForm;
