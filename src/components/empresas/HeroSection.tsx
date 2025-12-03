import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  const scrollToForm = () => {
    document.getElementById('cta-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="max-w-6xl mx-auto text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white/90 tracking-wide">ASSET MANAGER CAMBIAL VIA BLOCKCHAIN</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight animate-fade-in-up">
              Capital Global.
            </h1>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary via-tkb-cyan to-primary bg-clip-text text-transparent animate-fade-in-up animation-delay-200">
              Velocidade Institucional.
            </h2>
          </div>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
            Operações B2B em <span className="font-semibold text-primary">50+ países</span><br />
            BRL ↔ USDT ↔ USD • EUR • CNY • GBP
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 animate-fade-in-up animation-delay-400">
            {[
              { label: "Tempo médio", value: "60-90min" },
              { label: "Economia", value: "40-50%" },
              { label: "Disponível", value: "24/7" }
            ].map((stat, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-white/70 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in-up animation-delay-500">
            <Button 
              size="lg" 
              onClick={scrollToForm}
              className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-tkb-cyan hover:from-primary/90 hover:to-tkb-cyan/90 text-neutral-900 font-bold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full"
            >
              SOLICITAR PROPOSTA <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={scrollToForm}
              className="text-lg px-10 py-7 border-2 border-white/20 text-white hover:bg-white/10 rounded-full backdrop-blur-sm"
            >
              AGENDAR REUNIÃO
            </Button>
          </div>

          {/* Trust Footer */}
          <div className="pt-12 border-t border-white/10 animate-fade-in-up animation-delay-600">
            <p className="text-sm text-white/60">
              contato@tkbasset.com • tkbasset.com
            </p>
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
