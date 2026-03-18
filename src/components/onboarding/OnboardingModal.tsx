import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Loader2,
  Shield,
  Download,
  ExternalLink,
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onComplete?: () => Promise<void>;
}

export function OnboardingModal({ isOpen, onClose, userName, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [commercialDetails, setCommercialDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Documents acceptance state
  const [acceptedKYC, setAcceptedKYC] = useState(false);
  const [acceptedPLD, setAcceptedPLD] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const allDocsAccepted = acceptedKYC && acceptedPLD && acceptedTerms;

  const steps = [
    {
      icon: Sparkles,
      title: "Bem-vindo à TKB Asset!",
      description: "Sua conta foi criada com sucesso. Antes de começar, precisamos que você leia e aceite nossos documentos institucionais.",
      badge: "Passo 1 de 3",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Shield,
      title: "Documentos Institucionais",
      description: "Leia e aceite os documentos abaixo para continuar. Eles regulamentam o uso da plataforma e nossas políticas de compliance.",
      badge: "Passo 2 de 3",
      color: "text-tkb-cyan",
      bgColor: "bg-tkb-cyan/10",
      isDocs: true,
    },
    {
      icon: FileText,
      title: "Perfil Operacional",
      description: "Descreva brevemente qual será o seu volume esperado, se atua como B2B repassando liquidez, ou se veio de alguma indicação da nossa diretoria.",
      badge: "Passo 3 de 3",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      isForm: true,
    },
  ];

  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = async () => {
    if (currentStep === 1) {
      // Save documents_accepted_at to Supabase
      if (!allDocsAccepted) {
        toast.error("Por favor, aceite todos os documentos para continuar.");
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({
            documents_accepted_at: new Date().toISOString(),
            documents_version: "2026-03",
          }).eq("id", user.id);
        }
      } catch (err: any) {
        console.error("Erro ao salvar aceite de documentos:", err);
        toast.error("Erro ao salvar aceite de documentos: " + (err.message || "Tente novamente"));
      }
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (!commercialDetails.trim()) {
      toast.error("Por favor, descreva seu perfil operacional para prosseguirmos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { error } = await supabase
        .from("profiles")
        .update({
          commercial_details: commercialDetails,
          pricing_status: "pending",
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil enviado para análise da mesa!");
      localStorage.setItem("onboarding_completed", "true");
      onClose();
      // Refresh profile data in context instead of reloading the whole page
      if (onComplete) await onComplete();
    } catch (error: any) {
      console.error("Erro no onboarding:", error);
      toast.error("Erro ao salvar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && localStorage.getItem("onboarding_completed") === "true") {
        onClose();
      }
    }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl [&>button]:hidden">
        {/* Header with gradient */}
        <div className={`${step.bgColor} p-8 text-center space-y-4`}>
          <Badge variant="secondary" className="bg-white/80 text-foreground">
            {step.badge}
          </Badge>
          <div className={`h-20 w-20 rounded-2xl ${step.bgColor} border-2 border-white/50 flex items-center justify-center mx-auto shadow-lg`}>
            <Icon className={`h-10 w-10 ${step.color}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {currentStep === 0 ? step.title.replace("!", `, ${userName}!`) : step.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {step.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                  }`}
              />
            ))}
          </div>

          {/* ── Documents Step ── */}
          {step.isDocs && (
            <div className="space-y-3 pt-2 border-t border-border">
              {/* KYC */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Política KYC</p>
                    <p className="text-xs text-muted-foreground">Conheça seu Cliente — Know Your Customer</p>
                  </div>
                  <a
                    href="/documents/politica-kyc.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ler
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="kyc"
                    checked={acceptedKYC}
                    onCheckedChange={(v) => setAcceptedKYC(!!v)}
                  />
                  <Label htmlFor="kyc" className="text-xs text-muted-foreground cursor-pointer">
                    Li e aceito a Política KYC da TKB Asset
                  </Label>
                </div>
              </div>

              {/* PLD */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Política PLD/FT</p>
                    <p className="text-xs text-muted-foreground">Prevenção à Lavagem de Dinheiro e Financiamento ao Terrorismo</p>
                  </div>
                  <a
                    href="/documents/politica-pld.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ler
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pld"
                    checked={acceptedPLD}
                    onCheckedChange={(v) => setAcceptedPLD(!!v)}
                  />
                  <Label htmlFor="pld" className="text-xs text-muted-foreground cursor-pointer">
                    Li e aceito a Política PLD/FT da TKB Asset
                  </Label>
                </div>
              </div>

              {/* Terms */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Termos de Uso</p>
                    <p className="text-xs text-muted-foreground">Condições gerais de uso da plataforma</p>
                  </div>
                  <a
                    href="/documents/termos-de-uso.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ler
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(v) => setAcceptedTerms(!!v)}
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                    Li e aceito os Termos de Uso da TKB Asset
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* ── Form Step ── */}
          {step.isForm && (
            <div className="space-y-3 pt-2 border-t border-border">
              <Label htmlFor="details" className="text-foreground font-semibold">
                Detalhes da sua Operação
              </Label>
              <Textarea
                id="details"
                placeholder="Exemplo: Faremos cerca de 100k USDT por semana. Sou parceiro do Eduardo..."
                className="min-h-[120px] resize-none"
                value={commercialDetails}
                onChange={(e) => setCommercialDetails(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={step.isDocs && !allDocsAccepted}
                className="w-full bg-tkb-cyan hover:bg-tkb-cyan/90 text-black font-semibold disabled:opacity-40"
                size="lg"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-tkb-cyan hover:bg-tkb-cyan/90 text-black font-semibold"
                size="lg"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Enviar para a Mesa TKB
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
