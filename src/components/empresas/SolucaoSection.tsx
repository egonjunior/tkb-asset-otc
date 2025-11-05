import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingDown } from "lucide-react";

export function SolucaoSection() {
  const beneficios = [
    "Spread competitivo (até 60% menor que mercado)",
    "Entrega expressa (20-30 minutos)",
    "Sem limite de volume por operação",
    "Compliance PLD/FT rigoroso",
    "Plataforma digital proprietária",
    "Atendimento profissional direto"
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-[hsl(186,100%,95%)] to-[hsl(186,100%,98%)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Title */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-[hsl(220,60%,8%)]">
              SOLUÇÃO: MESA OTC PROFISSIONAL
            </h2>
            <p className="text-xl text-[hsl(215,16%,47%)] max-w-3xl mx-auto">
              A TKB Asset é uma mesa OTC especializada em conversões BRL → USDT para empresas.
            </p>
          </div>

          {/* Lista de Benefícios */}
          <div className="grid sm:grid-cols-2 gap-4">
            {beneficios.map((beneficio, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-white/50 hover:bg-white transition-all duration-200"
              >
                <CheckCircle2 className="h-6 w-6 text-[hsl(142,71%,45%)] flex-shrink-0" />
                <span className="text-[hsl(220,25%,15%)]">{beneficio}</span>
              </div>
            ))}
          </div>

          {/* Card Via TKB Asset */}
          <Card className="relative p-8 bg-gradient-to-br from-[hsl(142,71%,45%)] to-[hsl(142,71%,35%)] border-4 border-[hsl(142,71%,45%)] shadow-2xl overflow-hidden">
            <Badge className="absolute top-4 right-4 bg-white text-[hsl(142,71%,45%)] text-sm font-bold px-4 py-1">
              RECOMENDADO
            </Badge>
            
            <h3 className="text-2xl font-bold text-white mb-6">Via TKB Asset</h3>
            
            <div className="space-y-3 text-white/95 mb-6">
              <p>Spread: 1% = <strong className="text-white text-xl">R$ 20.000</strong></p>
              <p>Prazo: <strong className="text-white text-xl">30 minutos</strong></p>
              <p>Burocracia: <strong className="text-white text-xl">Mínima (após onboarding)</strong></p>
            </div>
            
            <div className="pt-6 border-t border-white/30">
              <p className="text-3xl sm:text-4xl font-bold text-white font-mono">
                R$ 20.000 + 30 minutos
              </p>
            </div>
          </Card>

          {/* Economia */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border-2 border-[hsl(142,71%,45%)]">
              <div className="flex items-start gap-3 mb-3">
                <TrendingDown className="h-6 w-6 text-[hsl(142,71%,45%)]" />
                <h3 className="text-lg font-bold text-[hsl(220,25%,15%)]">vs SWIFT</h3>
              </div>
              <p className="text-4xl font-bold text-[hsl(142,71%,45%)] font-mono">
                R$ 122.000
              </p>
              <p className="text-[hsl(215,16%,47%)] mt-2">85% mais barato</p>
            </Card>

            <Card className="p-6 bg-white border-2 border-[hsl(142,71%,45%)]">
              <div className="flex items-start gap-3 mb-3">
                <TrendingDown className="h-6 w-6 text-[hsl(142,71%,45%)]" />
                <h3 className="text-lg font-bold text-[hsl(220,25%,15%)]">vs Exchange</h3>
              </div>
              <p className="text-4xl font-bold text-[hsl(142,71%,45%)] font-mono">
                R$ 30.500
              </p>
              <p className="text-[hsl(215,16%,47%)] mt-2">60% mais barato</p>
            </Card>
          </div>

          {/* Economia Anual */}
          <Card className="p-8 bg-gradient-to-br from-[hsl(142,71%,45%)] to-[hsl(142,71%,35%)] text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Economia Anual (12 operações/ano)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur">
                <p className="text-white/90 mb-2">vs SWIFT</p>
                <p className="text-4xl font-bold font-mono animate-count-up">
                  R$ 1.464.000/ano
                </p>
              </div>
              <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur">
                <p className="text-white/90 mb-2">vs Exchange</p>
                <p className="text-4xl font-bold font-mono animate-count-up">
                  R$ 366.000/ano
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
