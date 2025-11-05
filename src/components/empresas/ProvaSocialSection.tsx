import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ProvaSocialSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const metricas = [
    { numero: "50M+", label: "Transacionados em 2024", prefix: "R$ " },
    { numero: "1.000+", label: "Operações Executadas", prefix: "" },
    { numero: "18", label: "Tempo Médio (PIX → USDT)", suffix: "min" },
    { numero: "94", label: "Retenção (6 meses)", suffix: "%" }
  ];

  const cases = [
    {
      badge: "CASE REAL",
      icon: "💳",
      titulo: "GATEWAY DE PAGAMENTO",
      localizacao: "São Paulo",
      dados: [
        "Volume: R$ 8M/mês",
        "Spread anterior: 2.5% (R$ 200k/mês)",
        "Spread TKB: 1% (R$ 80k/mês)"
      ],
      economia: "ECONOMIA: R$ 120k/mês = R$ 1.44M/ano"
    },
    {
      badge: "CASE REAL",
      icon: "🏭",
      titulo: "IMPORTADORA ELETRÔNICOS",
      localizacao: "Santa Catarina",
      dados: [
        "Volume: R$ 2M/mês",
        "Método anterior: SWIFT (6% + 4 dias)",
        "Método atual: TKB (1% + 30min)"
      ],
      economia: "ECONOMIA: R$ 100k/mês = R$ 1.2M/ano"
    },
    {
      badge: "CASE REAL",
      icon: "📱",
      titulo: "AGÊNCIA PERFORMANCE",
      localizacao: "Rio de Janeiro",
      dados: [
        "Volume: R$ 500k/mês",
        "Método anterior: Cartão corp. (7%)",
        "Método atual: TKB (1%)"
      ],
      economia: "ECONOMIA: R$ 30k/mês = R$ 360k/ano"
    }
  ];

  const compliance = [
    "Lei 9.613/98 (PLD)",
    "Lei 14.478/2022 (Marco Legal Cripto)",
    "Política PLD/FT rigorosa",
    "KYC/CDD obrigatório todos clientes",
    "Contratos blindados juridicamente",
    "Parceria fornecedores institucionais globais",
    "Não custodiamos ativos (zero risco custódia)"
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-br from-[hsl(220,60%,8%)] via-[hsl(220,80%,12%)] to-[hsl(220,100%,40%)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Title */}
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-white">
            NÚMEROS QUE COMPROVAM
          </h2>

          {/* Grid Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metricas.map((metrica, index) => (
              <div key={index} className="text-center">
                <p className="text-5xl lg:text-6xl font-bold text-[hsl(186,100%,50%)] font-mono mb-2">
                  {inView && (
                    <>
                      {metrica.prefix}
                      {metrica.numero}
                      {metrica.suffix}
                    </>
                  )}
                </p>
                <p className="text-sm text-white/80 uppercase tracking-wide">
                  {metrica.label}
                </p>
              </div>
            ))}
          </div>

          {/* Cases Reais */}
          <div className="grid md:grid-cols-3 gap-6">
            {cases.map((caseItem, index) => (
              <Card 
                key={index}
                className="p-6 bg-white/5 backdrop-blur-lg border border-[hsl(186,100%,50%)]/20 hover:bg-white/10 hover:border-[hsl(186,100%,50%)]/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{caseItem.icon}</div>
                  <Badge className="bg-[hsl(186,100%,50%)] text-[hsl(220,60%,8%)]">
                    {caseItem.badge}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{caseItem.titulo}</h3>
                <p className="text-sm text-white/70 mb-4">{caseItem.localizacao}</p>

                <ul className="space-y-2 mb-6">
                  {caseItem.dados.map((dado, dadoIndex) => (
                    <li key={dadoIndex} className="text-sm text-white/90 flex items-start gap-2">
                      <span className="text-[hsl(186,100%,50%)] mt-0.5">├─</span>
                      <span>{dado}</span>
                    </li>
                  ))}
                </ul>

                <div className="p-4 bg-gradient-to-r from-[hsl(142,71%,45%)] to-[hsl(142,71%,35%)] rounded-lg">
                  <p className="text-white font-bold text-center">
                    {caseItem.economia}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Compliance & Segurança */}
          <Card className="p-8 bg-white/5 backdrop-blur-lg border border-[hsl(186,100%,50%)]/20">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-[hsl(186,100%,50%)]" />
              <h3 className="text-2xl font-bold text-white">Compliance & Segurança</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {compliance.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(142,71%,45%)] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/20 flex items-center gap-3 text-white/80">
              <Lock className="h-5 w-5" />
              <p className="text-sm">
                Operamos dentro de todos os marcos regulatórios brasileiros para serviços de conversão de ativos digitais
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
