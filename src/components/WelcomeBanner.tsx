import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, TrendingUp, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WelcomeBannerProps {
  userName: string;
  onDismiss?: () => void;
}

export function WelcomeBanner({ userName, onDismiss }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem("welcome-banner-dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("welcome-banner-dismissed", "true");
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-tkb-cyan/5 to-primary/5 border-primary/20 mb-8 animate-fade-in">
      <div className="absolute top-0 right-0 w-64 h-64 bg-tkb-cyan/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
      
      <div className="relative p-6 md:p-8">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-foreground">
                Olá, {userName}! 👋
              </h3>
              <p className="text-sm text-muted-foreground">Bem-vindo à TKB Asset</p>
            </div>
          </div>

          <p className="text-base text-foreground/80 mb-6">
            Siga estes passos para realizar sua primeira operação:
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 border border-border/50">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">Confira a cotação</p>
                <p className="text-xs text-muted-foreground">Monitore o preço atual do USDT</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 border border-border/50">
              <div className="h-8 w-8 rounded-lg bg-tkb-cyan/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-tkb-cyan">2</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">Solicite operação</p>
                <p className="text-xs text-muted-foreground">Crie sua ordem quando achar melhor</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 border border-border/50">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-success">3</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">Acompanhe o status</p>
                <p className="text-xs text-muted-foreground">Veja o progresso em tempo real</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              size="lg" 
              variant="premium" 
              className="gap-2"
              onClick={() => navigate("/order/new")}
            >
              <CheckCircle2 className="h-5 w-5" />
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate("/documents")}
            >
              <FileText className="h-5 w-5" />
              Enviar Documentos
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
