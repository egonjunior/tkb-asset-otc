import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Zap, ArrowRight, LineChart, Lock, Clock, CheckCircle2, Instagram, Linkedin } from "lucide-react";
import tkbLogo from "@/assets/tkb-logo.png";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { TrustBadge } from "@/components/TrustBadge";
import { PremiumButton } from "@/components/PremiumButton";
const Landing = () => {
  const navigate = useNavigate();
  const {
    binancePrice,
    tkbPrice,
    isLoading
  } = useBinancePrice();
  const features = [{
    icon: Shield,
    title: "Segurança",
    description: "Transações 100% seguras com criptografia de ponta a ponta. Seu patrimônio protegido em cada operação.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    icon: TrendingUp,
    title: "Transparência",
    description: "Cotações em tempo real, transparentes e sem taxas ocultas.",
    color: "text-success",
    bgColor: "bg-success/10"
  }, {
    icon: Zap,
    title: "Agilidade",
    description: "Processamento rápido e eficiente. Receba seus USDT em até 30 minutos após confirmação do pagamento.",
    color: "text-warning",
    bgColor: "bg-warning/10"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] relative overflow-hidden">
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(195,100%,92%),transparent_50%),radial-gradient(ellipse_at_bottom_left,_hsl(220,60%,95%),transparent_50%)] opacity-40 pointer-events-none"></div>
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-noise pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black border-b border-neutral-800 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-brand text-white">TKB ASSET</h1>
                  <p className="text-xs text-neutral-300 font-inter uppercase tracking-wider">Mesa OTC</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex text-white hover:bg-neutral-800">
                  Login
                </Button>
                <PremiumButton onClick={() => navigate("/login")}>
                  Começar
                </PremiumButton>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="space-y-6 animate-fade-in">
            <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border border-gold/30 bg-gold/10 text-gold">
              Instituição OTC Brasileira
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1]">
              Segurança Institucional
              <br />
              <span className="text-primary">para Operações Digitais</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-inter leading-relaxed">
              Plataforma profissional de USDT com cotações em tempo real e transparência total
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{
            animationDelay: '150ms'
          }}>
            <PremiumButton onClick={() => navigate("/login")}>
              Acessar Plataforma
            </PremiumButton>
            <Button size="lg" variant="tkb" onClick={() => navigate("/cotacao")}>
              <LineChart className="mr-2 h-5 w-5" />
              Ver Cotações
            </Button>
          </div>

          {/* Live Price Cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto animate-fade-in" style={{
            animationDelay: '300ms'
          }}>
            <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.1)] transition-apple hover:-translate-y-1">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-2">Mercado</p>
                <p className="text-5xl font-playfair font-bold text-foreground">
                  {isLoading ? "..." : `R$ ${binancePrice?.toFixed(2)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-inter">Cotação Base</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-md border-primary/30 shadow-institutional hover:shadow-elevated transition-premium hover:-translate-y-1">
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-2">TKB Asset</p>
                <p className="text-5xl font-playfair font-bold text-primary">
                  {isLoading ? "..." : `R$ ${tkbPrice?.toFixed(3)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-inter">Cotação Institucional</p>
              </CardContent>
            </Card>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in" style={{
            animationDelay: '450ms'
          }}>
            <TrustBadge icon={Lock} label="Criptografia Bancária" />
            <TrustBadge icon={Clock} label="Liquidação em 24h" />
            <TrustBadge icon={CheckCircle2} label="Transparência Total" />
            <TrustBadge icon={Shield} label="100% Seguro" />
          </div>

          {/* Credibility Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="text-center animate-fade-in">
              <p className="text-4xl md:text-5xl font-playfair font-bold text-primary mb-2">
                +1.000
              </p>
              <p className="text-neutral-600 font-medium">Transações Realizadas</p>
            </div>
            <div className="text-center animate-fade-in" style={{
              animationDelay: '0.1s'
            }}>
              <p className="text-4xl md:text-5xl font-playfair font-bold text-primary mb-2">
                +R$ 50M
              </p>
              <p className="text-neutral-600 font-medium">Negociados</p>
            </div>
            <div className="text-center animate-fade-in" style={{
              animationDelay: '0.2s'
            }}>
              <p className="text-4xl md:text-5xl font-playfair font-bold text-primary mb-2">
                98%
              </p>
              <p className="text-neutral-600 font-medium">Concluídas em menos de 1h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-neutral-50 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                Diferenciais
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-playfair font-bold text-foreground">
                Por que escolher a TKB Asset?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
                Nossa plataforma oferece tudo que você precisa para operar com confiança no mercado OTC
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => <Card key={index} className="shadow-institutional hover:shadow-elevated transition-premium hover:-translate-y-2 animate-fade-in border-border bg-white" style={{
                animationDelay: `${index * 150}ms`
              }}>
                  <CardContent className="pt-10 pb-10 px-8 text-center space-y-5">
                    <div className={`h-20 w-20 rounded-2xl ${feature.bgColor} flex items-center justify-center mx-auto shadow-lg`}>
                      <feature.icon className={`h-10 w-10 ${feature.color}`} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-playfair font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground font-inter leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="max-w-4xl mx-auto shadow-elevated bg-gradient-to-br from-primary via-primary-hover to-primary border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <CardContent className="relative p-10 sm:p-16 text-center space-y-8">
            <div className="space-y-5">
              <h2 className="text-4xl sm:text-5xl font-playfair font-bold text-white">
                Pronto para começar?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto font-inter leading-relaxed">
                Acesse a plataforma agora e realize suas operações de USDT com segurança e transparência
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[220px] bg-white text-primary hover:bg-neutral-100 shadow-xl font-semibold" onClick={() => navigate("/login")}>
                Acessar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="min-w-[220px] border-2 border-white text-white hover:bg-white/10 font-semibold" onClick={() => navigate("/cotacao")}>
                <LineChart className="mr-2 h-5 w-5" />
                Ver Cotação
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10" />
              <span className="text-xl font-playfair font-bold">TKB ASSET</span>
            </div>
            
            {/* CNPJ */}
            <p className="text-neutral-400 text-sm">CNPJ: 45.933.866/0001-
93</p>
            
            {/* Social Media */}
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/tkb.assetoficial/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors" aria-label="Instagram TKB Asset">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/tkb-asset/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors" aria-label="LinkedIn TKB Asset">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
            
            {/* Copyright */}
            <p className="text-neutral-400 text-sm text-center mt-2">
              © 2025 TKB Asset. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>;
};
export default Landing;