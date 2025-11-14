import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, TrendingUp, ArrowRight, LineChart, Lock, Clock, CheckCircle2, Instagram, Linkedin, UserPlus, FileCheck, Handshake } from "lucide-react";
import tkbLogo from "@/assets/tkb-logo.png";
import { useBinancePrice } from "@/hooks/useBinancePrice";
const Landing = () => {
  const navigate = useNavigate();
  const {
    binancePrice,
    tkbPrice,
    isLoading
  } = useBinancePrice();
  return <div className="min-h-screen bg-background">
      {/* Header Premium */}
      <header className="bg-gradient-to-r from-primary-dark via-primary to-primary-dark border-b border-white/10 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10 drop-shadow-lg" />
              <div>
                <h1 className="text-xl font-institutional font-bold text-white drop-shadow-md">TKB ASSET</h1>
                <p className="text-xs text-white/70 font-inter uppercase tracking-[0.15em]">Mesa OTC Institucional</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex text-white hover:bg-white/20 transition-all duration-300">
                Login
              </Button>
              <Button onClick={() => navigate("/register")} className="bg-white text-primary hover:bg-white/90 font-institutional font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Criar Conta
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Premium */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden gradient-premium-blue">
        {/* Background com múltiplas camadas */}
        <div className="absolute inset-0">
          {/* Grid sutil */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg className="w-full h-full">
              <defs>
                <pattern id="premium-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#premium-grid)" className="text-white" />
            </svg>
          </div>
          {/* Gradiente radial para profundidade */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.15),transparent_50%)]"></div>
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-xl">
                <Shield className="h-4 w-4 text-white" />
                <span className="font-institutional text-sm text-white font-medium uppercase tracking-[0.2em]">Mesa OTC Institucional</span>
                <Lock className="h-4 w-4 text-white" />
              </div>
            </div>

            <h2 className="text-center font-financial-serif text-5xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] mb-8 animate-fade-in animation-delay-200 drop-shadow-2xl">
              Excelência em<br />
              <span className="relative inline-block">
                <span className="relative z-10 text-white">Operações OTC</span>
                <div className="absolute bottom-0 left-0 w-full h-1 shimmer-border opacity-70"></div>
              </span>
            </h2>

            <p className="text-center font-institutional text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto mb-12 animate-fade-in animation-delay-400 leading-relaxed">
              Plataforma institucional de USDT com padrões de segurança e transparência do mercado financeiro global
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in animation-delay-600">
              <button onClick={() => navigate("/register")} className="group px-8 py-4 bg-white text-primary hover:bg-white/90 font-institutional font-semibold rounded-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105">
                <span className="flex items-center gap-2 justify-center">
                  Abrir Conta
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button onClick={() => navigate("/cotacao")} className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-institutional font-semibold rounded-lg border border-white/30 hover:bg-white/20 shadow-xl transition-all duration-300">
                Ver Cotações ao Vivo
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in animation-delay-800">
              {[{
              value: "R$ 50M+",
              label: "Volume Transacionado",
              icon: LineChart
            }, {
              value: "1.000+",
              label: "Operações Concluídas",
              icon: CheckCircle2
            }, {
              value: "18 min",
              label: "Tempo Médio",
              icon: Clock
            }, {
              value: "100%",
              label: "Compliance PLD/FT",
              icon: Shield
            }].map((metric, index) => <div key={index} className="text-center p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105">
                  <metric.icon className="h-8 w-8 text-white mx-auto mb-3 drop-shadow-lg" />
                  <div className="font-financial-serif text-3xl font-bold text-white mb-1 drop-shadow-md">{metric.value}</div>
                  <div className="font-institutional text-sm text-white/80 uppercase tracking-wider">{metric.label}</div>
                </div>)}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>


      {/* Institutional Credibility Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-dots-pattern opacity-30"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="font-institutional text-sm text-primary uppercase tracking-[0.2em] mb-4 block font-semibold">Padrão Institucional</span>
              <h2 className="font-financial-serif text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
                Segurança e Conformidade<br /><span className="text-primary">em Cada Operação</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[{
              icon: Shield,
              title: "Compliance Total PLD/FT",
              description: "Operações 100% regulamentadas conforme normativas COAF e Banco Central",
              badge: "Auditado"
            }, {
              icon: Lock,
              title: "Custódia Institucional",
              description: "Ativos protegidos com infraestrutura de nível bancário e multi-assinatura",
              badge: "Certificado"
            }, {
              icon: FileCheck,
              title: "KYC Rigoroso",
              description: "Processo de validação completo seguindo padrões internacionais FATF",
              badge: "Verificado"
            }].map((item, index) => <div key={index} className="group p-8 bg-white rounded-xl border-2 border-neutral-200 hover:border-primary hover:shadow-2xl transition-all duration-500 shadow-md">
                  <div className="mb-6 relative inline-block">
                    <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg">
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded-full shadow-md">{item.badge}</span>
                  </div>
                  <h3 className="font-institutional text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                  <p className="font-inter text-neutral-600 leading-relaxed">{item.description}</p>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Live Pricing Section */}
      <section id="live-pricing" className="py-16 bg-gradient-to-b from-white to-neutral-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full mb-4">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                <span className="font-institutional text-sm text-success uppercase tracking-wider">Cotações em Tempo Real</span>
              </div>
              <h2 className="font-financial-serif text-4xl font-bold text-neutral-900">Preços Transparentes</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group p-8 bg-white rounded-2xl border-2 border-neutral-200 hover:border-primary transition-all duration-500 hover:shadow-2xl shadow-md">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="font-institutional text-sm text-neutral-600 uppercase tracking-wider">Referência de Mercado</span>
                    <h3 className="font-financial-serif text-2xl font-bold text-neutral-900 mt-1">Binance / OKX</h3>
                  </div>
                  <TrendingUp className="h-6 w-6 text-neutral-400 group-hover:text-primary transition-colors" />
                </div>
                {isLoading ? <div className="h-20 bg-neutral-100 rounded-lg animate-pulse"></div> : <>
                    <div className="font-financial-serif text-5xl font-bold text-neutral-900 mb-2">R$ {binancePrice?.toFixed(4)}</div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-inter text-sm">Atualizado agora</span>
                    </div>
                  </>}
              </div>
              <div className="relative group p-8 bg-gradient-to-br from-primary via-primary-hover to-primary-dark rounded-2xl shadow-2xl hover:shadow-primary/30 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 shimmer-border opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-institutional text-sm text-white uppercase tracking-wider font-semibold">Mesa OTC TKB Asset</span>
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">Exclusivo</Badge>
                      </div>
                      <h3 className="font-financial-serif text-2xl font-bold text-white">Nosso Preço</h3>
                    </div>
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  {isLoading ? <div className="h-20 bg-white/10 rounded-lg animate-pulse"></div> : <>
                      <div className="font-financial-serif text-5xl font-bold text-white mb-2 drop-shadow-lg">R$ {tkbPrice?.toFixed(4)}</div>
                      <div className="flex items-center gap-4 text-white/90">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-inter text-sm">Cotação instantânea</span>
                        </div>
                        
                      </div>
                    </>}
                </div>
              </div>
            </div>
      <div className="mt-8 p-6 bg-primary/5 border-2 border-primary/20 rounded-xl shadow-md">
        <div className="flex items-center gap-3 text-neutral-900">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="font-inter text-sm"><strong className="font-semibold">Spread transparente de apenas 1%</strong> — Enquanto bancos tradicionais cobram 5-7% em operações internacionais, nossa mesa OTC oferece cotações institucionais competitivas.</p>
        </div>
      </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="max-w-4xl mx-auto shadow-elevated bg-gradient-to-br from-primary via-primary-hover to-primary-dark border-none overflow-hidden relative">
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
      <footer className="bg-neutral-900 text-white py-12 border-t-2 border-primary/20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10 drop-shadow-lg" />
              <span className="text-xl font-playfair font-bold">TKB ASSET</span>
            </div>
            
            {/* CNPJ */}
            <p className="text-neutral-400 text-sm">CNPJ: 45.933.866/0001-93</p>
            
            {/* Social Media */}
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/tkb.assetoficial/" target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-all duration-300" aria-label="Instagram TKB Asset">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/tkb-asset/" target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-all duration-300" aria-label="LinkedIn TKB Asset">
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
    </div>;
};
export default Landing;