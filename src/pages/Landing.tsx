import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, TrendingUp, Zap, ArrowRight, LineChart } from "lucide-react";
import tkbLogo from "@/assets/tkb-logo.png";
import { useBinancePrice } from "@/hooks/useBinancePrice";

const Landing = () => {
  const navigate = useNavigate();
  const { binancePrice, tkbPrice, isLoading } = useBinancePrice();

  const features = [
    {
      icon: Shield,
      title: "Segurança",
      description: "Transações 100% seguras com criptografia de ponta a ponta. Seu patrimônio protegido em cada operação.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      title: "Transparência",
      description: "Cotações em tempo real direto da Binance. Spread fixo de +0,9% sem taxas ocultas.",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Zap,
      title: "Agilidade",
      description: "Processamento rápido e eficiente. Receba seus USDT em minutos após confirmação do pagamento.",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10" />
              <span className="text-xl font-bold text-white">TKB Asset</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/login")}>
                Começar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              A forma mais{" "}
              <span className="text-primary">segura e ágil</span>
              <br />
              de comprar USDT
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma OTC profissional para empresas. Cotação em tempo real com spread fixo de +0,9% sobre Binance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button size="lg" className="min-w-[200px]" onClick={() => navigate("/login")}>
              Acessar Plataforma
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="min-w-[200px]"
              onClick={() => navigate("/cotacao")}
            >
              <LineChart className="mr-2 h-5 w-5" />
              Ver Cotação Atual
            </Button>
          </div>

          {/* Live Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">
                  {isLoading ? "..." : `R$ ${binancePrice?.toFixed(2)}`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Binance (agora)</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-success">
                  {isLoading ? "..." : `R$ ${tkbPrice?.toFixed(3)}`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">TKB Asset</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">+0,9%</p>
                <p className="text-sm text-muted-foreground mt-1">Spread fixo</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Por que escolher a TKB Asset?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Nossa plataforma oferece tudo que você precisa para operar com confiança no mercado OTC
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in border-border/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className={`h-16 w-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mx-auto`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto shadow-2xl bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Pronto para começar?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Acesse a plataforma agora e realize suas operações de USDT com segurança e transparência
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[200px]" onClick={() => navigate("/login")}>
                Acessar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="min-w-[200px]"
                onClick={() => navigate("/cotacao")}
              >
                <LineChart className="mr-2 h-5 w-5" />
                Ver Cotação
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={tkbLogo} alt="TKB Asset" className="h-8 w-8" />
            <span className="text-lg font-bold text-white">TKB Asset</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 TKB Asset. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
