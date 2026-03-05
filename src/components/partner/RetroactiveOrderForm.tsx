import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowDownUp, Coins, FileClock, History, Upload, Users } from "lucide-react";

interface RetroactiveOrderFormProps {
    onSubmit: (data: { quoteClientId: string; brlAmount: number; usdtAmount: number; executedAt: string; proofFile?: File }) => void;
    isSubmitting?: boolean;
    quoteClients?: any[];
}

const RetroactiveOrderForm = ({
    onSubmit,
    isSubmitting = false,
    quoteClients = [],
}: RetroactiveOrderFormProps) => {
    const [selectedClientId, setSelectedClientId] = useState<string>("none");
    const [brlAmount, setBrlAmount] = useState("");
    const [brlAmountFormatted, setBrlAmountFormatted] = useState("");
    const [usdtAmount, setUsdtAmount] = useState("");
    const [executedAt, setExecutedAt] = useState("");
    const [proofFile, setProofFile] = useState<File | undefined>();

    const formatBRL = (value: string): string => {
        const numericValue = value.replace(/\D/g, "");
        if (!numericValue) return "";
        const number = parseFloat(numericValue) / 100;
        return number.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const unformatBRL = (value: string): number => {
        const cleaned = value.replace(/\./g, "").replace(",", ".");
        return parseFloat(cleaned) || 0;
    };

    const handleBRLChange = (value: string) => {
        const formatted = formatBRL(value);
        setBrlAmountFormatted(formatted);
        const numericValue = unformatBRL(formatted);
        setBrlAmount(numericValue.toString());
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleSubmitOrder = (e: React.FormEvent) => {
        e.preventDefault();

        if (!brlAmount || !usdtAmount || !executedAt) return;

        onSubmit({
            quoteClientId: selectedClientId,
            brlAmount: parseFloat(brlAmount),
            usdtAmount: parseFloat(usdtAmount.replace(",", ".")),
            executedAt: new Date(executedAt).toISOString(),
            proofFile,
        });
    };

    const isFormValid = brlAmount && usdtAmount && executedAt;

    return (
        <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                    <History className="h-5 w-5" />
                    Lançar Operação Finalizada
                </CardTitle>
                <CardDescription>
                    Registre as operações concluídas externamente (ex: WhatsApp) para controle de volume, relatórios e comissionamento.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="client" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Cliente da Operação *
                        </Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhum (Operação própria)</SelectItem>
                                {quoteClients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.client_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="brlRetro">Valor Enviado Pelo Cliente (BRL) *</Label>
                            <Input
                                id="brlRetro"
                                type="text"
                                placeholder="Ex: 50.000,00"
                                value={brlAmountFormatted}
                                onChange={(e) => handleBRLChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="usdtRetro">Quantidade Recebida (USDT) *</Label>
                            <Input
                                id="usdtRetro"
                                type="number"
                                step="0.01"
                                placeholder="Ex: 10000.50"
                                value={usdtAmount}
                                onChange={(e) => setUsdtAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="bg-muted rounded-full p-2">
                            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cotação Realizada Estimada:</span>
                            <span className="font-medium text-primary">
                                {brlAmount && usdtAmount
                                    ? `R$ ${(parseFloat(brlAmount) / parseFloat(usdtAmount.replace(",", "."))).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
                                    : "--"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="executedAt" className="flex items-center gap-2">
                            <FileClock className="h-4 w-4" />
                            Data e Hora da Execução *
                        </Label>
                        <Input
                            id="executedAt"
                            type="datetime-local"
                            value={executedAt}
                            onChange={(e) => setExecutedAt(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Comprovante PIX (Opcional)
                        </Label>
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 border-primary/20 hover:border-primary/50 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Clique para anexar</span> ou arraste o arquivo
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {proofFile ? proofFile.name : "PNG, JPG, PDF (Max. 5MB)"}
                                    </p>
                                </div>
                                <input
                                    id="dropzone-file"
                                    type="file"
                                    className="hidden"
                                    accept=".png,.jpg,.jpeg,.pdf"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!isFormValid || isSubmitting}
                        size="lg"
                    >
                        {isSubmitting ? "Lançando..." : "✅ Salvar Operação Retroativa"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default RetroactiveOrderForm;
