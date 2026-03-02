import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Loader2
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function OnboardingModal({ isOpen, onClose, userName }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [commercialDetails, setCommercialDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      icon: Sparkles,
      title: "Bem-vindo à TKB Asset!",
      description: "Sua conta foi criada. Para garantirmos a melhor taxa (Spread) nas suas operações OTC, precisamos de alguns detalhes sobre o seu perfil.",
      badge: "Passo 1 de 2",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: FileText,
      title: "Perfil Operacional",
      description: "Descreva brevemente qual será o seu volume esperado, se atua como B2B repassando liquidez, ou se veio de alguma indicação da nossa diretoria.",
      badge: "Passo 2 de 2",
      color: "text-tkb-cyan",
      bgColor: "bg-tkb-cyan/10",
      isForm: true
    }
  ];

  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
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

      // Set user pricing status to pending and save their story
      const { error } = await supabase
        .from('profiles')
        .update({
          commercial_details: commercialDetails,
          pricing_status: 'pending'
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Perfil enviado para análise da mesa!");
      localStorage.setItem("onboarding_completed", "true");
      onClose();
      // Force reload to update UI state
      window.location.reload();

    } catch (error: any) {
      console.error("Erro no onboarding:", error);
      toast.error("Erro ao salvar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Don't allow closing by clicking outside if they haven't submitted
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
        <div className="p-6 space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {currentStep === 0 ? `${step.title.replace("!", `, ${userName}!`)}` : step.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
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

          {/* Form Area */}
          {step.isForm && (
            <div className="space-y-3 pt-4 border-t border-border">
              <Label htmlFor="details" className="text-foreground font-semibold">Detalhes da sua Operação</Label>
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
            {currentStep === 0 ? (
              <Button
                onClick={handleNext}
                className="w-full bg-tkb-cyan hover:bg-tkb-cyan/90 text-black font-semibold"
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
