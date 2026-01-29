import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ArrowRight, ArrowLeft, Check, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type OperationType = "brl_to_usdt" | "usdt_to_brl" | "usdt_to_usd_remessa";

interface BrazilianBankDetails {
  type: "brazilian";
  bank_name: string;
  agency: string;
  account: string;
  account_type: "corrente" | "poupanca";
  holder_name: string;
  holder_document: string;
}

interface InternationalBankDetails {
  type: "international";
  bank_name: string;
  bank_address: string;
  swift_code: string;
  account_number: string;
  routing_number: string;
  beneficiary_name: string;
  beneficiary_address: string;
}

type BankDetails = BrazilianBankDetails | InternationalBankDetails | null;

interface OperationalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OPERATION_LABELS: Record<OperationType, { label: string; depositCurrency: string; purchaseCurrency: string }> = {
  brl_to_usdt: { label: "BRL para USDT", depositCurrency: "BRL", purchaseCurrency: "USDT" },
  usdt_to_brl: { label: "USDT para BRL", depositCurrency: "USDT", purchaseCurrency: "BRL" },
  usdt_to_usd_remessa: { label: "USDT para USD (Remessa Internacional)", depositCurrency: "USDT", purchaseCurrency: "USD" },
};

export function OperationalNoteModal({ isOpen, onClose, onSuccess }: OperationalNoteModalProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [operationType, setOperationType] = useState<OperationType | "">("");
  const [depositedAmount, setDepositedAmount] = useState("");
  const [purchasedAmount, setPurchasedAmount] = useState("");
  const [operationDate, setOperationDate] = useState<Date>();
  const [bankDetails, setBankDetails] = useState<BankDetails>(null);
  
  // Brazilian bank details state
  const [brBankName, setBrBankName] = useState("");
  const [brAgency, setBrAgency] = useState("");
  const [brAccount, setBrAccount] = useState("");
  const [brAccountType, setBrAccountType] = useState<"corrente" | "poupanca">("corrente");
  const [brHolderName, setBrHolderName] = useState("");
  const [brHolderDocument, setBrHolderDocument] = useState("");
  
  // International bank details state
  const [intBankName, setIntBankName] = useState("");
  const [intBankAddress, setIntBankAddress] = useState("");
  const [intSwiftCode, setIntSwiftCode] = useState("");
  const [intAccountNumber, setIntAccountNumber] = useState("");
  const [intRoutingNumber, setIntRoutingNumber] = useState("");
  const [intBeneficiaryName, setIntBeneficiaryName] = useState("");
  const [intBeneficiaryAddress, setIntBeneficiaryAddress] = useState("");

  const requiresBankDetails = operationType === "usdt_to_brl" || operationType === "usdt_to_usd_remessa";
  const totalSteps = requiresBankDetails ? 5 : 4;

  const resetForm = () => {
    setStep(1);
    setOperationType("");
    setDepositedAmount("");
    setPurchasedAmount("");
    setOperationDate(undefined);
    setBankDetails(null);
    setBrBankName("");
    setBrAgency("");
    setBrAccount("");
    setBrAccountType("corrente");
    setBrHolderName("");
    setBrHolderDocument("");
    setIntBankName("");
    setIntBankAddress("");
    setIntSwiftCode("");
    setIntAccountNumber("");
    setIntRoutingNumber("");
    setIntBeneficiaryName("");
    setIntBeneficiaryAddress("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canProceedStep1 = operationType !== "";
  const canProceedStep2 = depositedAmount !== "" && purchasedAmount !== "";
  const canProceedStep3 = operationDate !== undefined;
  
  const canProceedStep4Bank = () => {
    if (operationType === "usdt_to_brl") {
      return brBankName && brAgency && brAccount && brHolderName && brHolderDocument;
    }
    if (operationType === "usdt_to_usd_remessa") {
      return intBankName && intBankAddress && intSwiftCode && intAccountNumber && intRoutingNumber && intBeneficiaryName && intBeneficiaryAddress;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 3 && !requiresBankDetails) {
      // Skip bank details step
      setStep(5);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 5 && !requiresBankDetails) {
      setStep(3);
    } else {
      setStep(step - 1);
    }
  };

  const prepareBankDetails = (): BankDetails => {
    if (operationType === "usdt_to_brl") {
      return {
        type: "brazilian",
        bank_name: brBankName,
        agency: brAgency,
        account: brAccount,
        account_type: brAccountType,
        holder_name: brHolderName,
        holder_document: brHolderDocument,
      };
    }
    if (operationType === "usdt_to_usd_remessa") {
      return {
        type: "international",
        bank_name: intBankName,
        bank_address: intBankAddress,
        swift_code: intSwiftCode,
        account_number: intAccountNumber,
        routing_number: intRoutingNumber,
        beneficiary_name: intBeneficiaryName,
        beneficiary_address: intBeneficiaryAddress,
      };
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!operationType || !operationDate) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const bankData = prepareBankDetails();
      const opConfig = OPERATION_LABELS[operationType];

      const { error } = await supabase.from("operational_notes").insert([{
        user_id: user.id,
        operation_type: operationType,
        deposited_amount: parseFloat(depositedAmount.replace(/\./g, "").replace(",", ".")),
        purchased_amount: parseFloat(purchasedAmount.replace(/\./g, "").replace(",", ".")),
        currency_deposited: opConfig.depositCurrency,
        currency_purchased: opConfig.purchaseCurrency,
        operation_date: format(operationDate, "yyyy-MM-dd"),
        bank_details: bankData as any,
        status: "pending" as const,
      }]);

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Sua nota operacional foi enviada para aprovação.",
      });
      
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting operational note:", error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    // Remove tudo exceto números e vírgula
    const cleanValue = value.replace(/[^\d,]/g, "");
    return cleanValue;
  };

  const opConfig = operationType ? OPERATION_LABELS[operationType] : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Solicitar Nota Operacional
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da operação para gerar um comprovante oficial
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-8 rounded-full transition-colors",
                i + 1 <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Operation Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo de Negociação</h3>
            <RadioGroup
              value={operationType}
              onValueChange={(value) => setOperationType(value as OperationType)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="brl_to_usdt" id="brl_to_usdt" />
                <Label htmlFor="brl_to_usdt" className="flex-1 cursor-pointer">
                  <span className="font-medium">BRL para USDT</span>
                  <p className="text-sm text-muted-foreground">Compra de USDT com Reais</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="usdt_to_brl" id="usdt_to_brl" />
                <Label htmlFor="usdt_to_brl" className="flex-1 cursor-pointer">
                  <span className="font-medium">USDT para BRL</span>
                  <p className="text-sm text-muted-foreground">Venda de USDT para Reais</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="usdt_to_usd_remessa" id="usdt_to_usd_remessa" />
                <Label htmlFor="usdt_to_usd_remessa" className="flex-1 cursor-pointer">
                  <span className="font-medium">USDT para USD (Remessa Internacional)</span>
                  <p className="text-sm text-muted-foreground">Conversão para dólar americano via remessa</p>
                </Label>
              </div>
            </RadioGroup>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={!canProceedStep1}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Values */}
        {step === 2 && opConfig && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Valores Negociados</h3>
            <Badge variant="outline">{opConfig.label}</Badge>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposited">Valor Depositado ({opConfig.depositCurrency})</Label>
                <Input
                  id="deposited"
                  placeholder={`Ex: 50.000,00`}
                  value={depositedAmount}
                  onChange={(e) => setDepositedAmount(formatCurrencyInput(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchased">Valor Adquirido ({opConfig.purchaseCurrency})</Label>
                <Input
                  id="purchased"
                  placeholder={`Ex: 9.259,26`}
                  value={purchasedAmount}
                  onChange={(e) => setPurchasedAmount(formatCurrencyInput(e.target.value))}
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handleNext} disabled={!canProceedStep2}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Date */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data da Operação</h3>
            <p className="text-sm text-muted-foreground">
              Selecione a data em que a operação foi realizada
            </p>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !operationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {operationDate ? format(operationDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={operationDate}
                  onSelect={setOperationDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handleNext} disabled={!canProceedStep3}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Bank Details (conditional) */}
        {step === 4 && requiresBankDetails && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {operationType === "usdt_to_brl" ? "Dados da Conta Recebedora" : "Dados da Conta Internacional"}
            </h3>
            
            {operationType === "usdt_to_brl" && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      placeholder="Ex: Bradesco"
                      value={brBankName}
                      onChange={(e) => setBrBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Conta</Label>
                    <Select value={brAccountType} onValueChange={(v) => setBrAccountType(v as "corrente" | "poupanca")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input
                      placeholder="Ex: 1234"
                      value={brAgency}
                      onChange={(e) => setBrAgency(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input
                      placeholder="Ex: 12345-6"
                      value={brAccount}
                      onChange={(e) => setBrAccount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nome do Titular</Label>
                  <Input
                    placeholder="Nome completo"
                    value={brHolderName}
                    onChange={(e) => setBrHolderName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ do Titular</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={brHolderDocument}
                    onChange={(e) => setBrHolderDocument(e.target.value)}
                  />
                </div>
              </div>
            )}

            {operationType === "usdt_to_usd_remessa" && (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome do Banco</Label>
                  <Input
                    placeholder="Ex: Bank of America"
                    value={intBankName}
                    onChange={(e) => setIntBankName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço do Banco</Label>
                  <Input
                    placeholder="Ex: 123 Main St, New York, NY 10001, USA"
                    value={intBankAddress}
                    onChange={(e) => setIntBankAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SWIFT/BIC Code</Label>
                    <Input
                      placeholder="Ex: BOFAUS3N"
                      value={intSwiftCode}
                      onChange={(e) => setIntSwiftCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      placeholder="Ex: 123456789"
                      value={intAccountNumber}
                      onChange={(e) => setIntAccountNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Routing Number / Wire Number</Label>
                  <Input
                    placeholder="Ex: 026009593"
                    value={intRoutingNumber}
                    onChange={(e) => setIntRoutingNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Beneficiário</Label>
                  <Input
                    placeholder="Nome completo do beneficiário"
                    value={intBeneficiaryName}
                    onChange={(e) => setIntBeneficiaryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço do Beneficiário</Label>
                  <Input
                    placeholder="Endereço completo"
                    value={intBeneficiaryAddress}
                    onChange={(e) => setIntBeneficiaryAddress(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => setStep(5)} disabled={!canProceedStep4Bank()}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && opConfig && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              Confirmar Dados
            </h3>
            
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo de Operação</p>
                    <p className="font-medium">{opConfig.label}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data da Operação</p>
                    <p className="font-medium">{operationDate ? format(operationDate, "dd/MM/yyyy") : "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Depositado</p>
                    <p className="font-medium">{depositedAmount} {opConfig.depositCurrency}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Adquirido</p>
                    <p className="font-medium">{purchasedAmount} {opConfig.purchaseCurrency}</p>
                  </div>
                </div>

                {operationType === "usdt_to_brl" && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="font-medium text-sm">Conta Recebedora</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Banco: {brBankName} | Agência: {brAgency} | Conta: {brAccount}</p>
                      <p>Titular: {brHolderName} ({brHolderDocument})</p>
                    </div>
                  </div>
                )}

                {operationType === "usdt_to_usd_remessa" && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="font-medium text-sm">Conta Internacional</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Bank: {intBankName}</p>
                      <p>SWIFT: {intSwiftCode} | Account: {intAccountNumber}</p>
                      <p>Beneficiary: {intBeneficiaryName}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="font-medium text-sm">Seus Dados</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Nome: {profile?.full_name || "N/A"}</p>
                    <p>{profile?.document_type}: {profile?.document_number || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para Aprovação
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
