import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  const scrollToForm = () => {
    document.getElementById('cta-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(220,60%,8%)] via-[hsl(220,80%,12%)] to-[hsl(220,100%,40%)]">
      {/* Hexagonal pattern background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
              <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" className="text-primary"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight animate-fade-in-up">
            SUA EMPRESA PAGA 5-7% EM<br />
            REMESSAS INTERNACIONAIS?
          </h1>

          {/* Subheadline */}
          <p className="text-2xl sm:text-3xl lg:text-4xl text-[hsl(186,100%,50%)] font-semibold animate-fade-in-up animation-delay-200">
            Nós fazemos por 1% em 30 minutos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-400">
            <Button 
              size="lg" 
              onClick={scrollToForm}
              className="text-lg px-8 py-6 bg-gradient-to-r from-[hsl(186,100%,50%)] to-[hsl(186,100%,40%)] hover:from-[hsl(186,100%,45%)] hover:to-[hsl(186,100%,35%)] text-[hsl(220,60%,8%)] font-bold shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-subtle"
            >
              SIMULAR ECONOMIA <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={scrollToForm}
              className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10"
            >
              AGENDAR REUNIÃO
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-12 border-t border-white/20">
            {[
              { icon: CheckCircle2, text: "R$ 50M+ transacionados" },
              { icon: CheckCircle2, text: "+1.000 operações executadas" },
              { icon: CheckCircle2, text: "Compliance PLD/FT completo" },
              { icon: CheckCircle2, text: "Tempo médio: 18 minutos" }
            ].map((badge, index) => (
              <div 
                key={index} 
                className="flex items-center justify-center gap-2 text-white/90 animate-fade-in-up"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <badge.icon className="h-5 w-5 text-[hsl(142,71%,45%)]" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
