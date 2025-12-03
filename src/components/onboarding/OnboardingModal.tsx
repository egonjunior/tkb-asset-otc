import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Sparkles
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const steps = [
  {
    icon: Sparkles,
    title: "Bem-vindo à TKB Asset!",
    description: "Sua conta foi criada com sucesso. Vamos mostrar como funciona a plataforma em 3 passos rápidos.",
    badge: "Passo 1 de 3",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: FileText,
    title: "Complete seu cadastro",
    description: "Para operar, precisamos validar alguns documentos. É rápido e garante a segurança das suas transações.",
    badge: "Passo 2 de 3",
    color: "text-tkb-cyan",
    bgColor: "bg-tkb-cyan/10",
    action: {
      label: "Ir para Documentos",
      path: "/documents"
    }
  },
  {
    icon: TrendingUp,
    title: "Pronto para operar!",
    description: "Após a aprovação dos documentos, você pode solicitar operações de compra/venda de USDT com as melhores taxas do mercado.",
    badge: "Passo 3 de 3",
    color: "text-success",
    bgColor: "bg-success/10",
    features: [
      "Cotações em tempo real",
      "Spread 30% menor que mercado",
      "Liquidação em até 60 minutos"
    ]
  }
];

export function OnboardingModal({ isOpen, onClose, userName }: OnboardingModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      localStorage.setItem("onboarding_completed", "true");
      onClose();
    }
  };

  const handleAction = () => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
    if (step.action?.path) {
      navigate(step.action.path);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
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

          {/* Features list for last step */}
          {step.features && (
            <div className="space-y-3">
              {step.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? "w-8 bg-primary" 
                    : index < currentStep 
                      ? "w-2 bg-primary/50" 
                      : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {step.action ? (
              <>
                <Button 
                  onClick={handleAction} 
                  className="w-full" 
                  size="lg"
                >
                  {step.action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleNext} 
                  className="w-full text-muted-foreground"
                >
                  Fazer isso depois
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleNext} 
                  className="w-full" 
                  size="lg"
                >
                  {currentStep === steps.length - 1 ? "Começar a usar" : "Próximo"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {currentStep === 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={handleSkip} 
                    className="w-full text-muted-foreground"
                  >
                    Pular introdução
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
