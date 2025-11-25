import { Card, CardContent } from "@/components/ui/card";
import { Building2, TrendingUp, Globe2, CreditCard } from "lucide-react";

export function IdealParaSection() {
  const profiles = [
    {
      icon: Building2,
      title: "Importadoras & Exportadoras",
      description: "Empresas que precisam pagar fornecedores internacionais com agilidade e custos reduzidos.",
      bullets: [
        "Pagamento de fornecedores overseas",
        "Redução de 40-50% nos custos cambiais",
        "Velocidade crítica para aproveitar oportunidades"
      ]
    },
    {
      icon: Globe2,
      title: "Agências de Marketing & Ads",
      description: "Agências que gerenciam orçamentos de mídia internacional para múltiplos clientes.",
      bullets: [
        "Pagamento de plataformas (Google, Meta, TikTok)",
        "Operações recorrentes sem fricção",
        "Economia que aumenta margem operacional"
      ]
    },
    {
      icon: CreditCard,
      title: "Fintechs & Gateways de Pagamento",
      description: "Empresas que precisam liquidar operações internacionais em volume e alta frequência.",
      bullets: [
        "Infraestrutura escalável para alto volume",
        "Integração via API (quando disponível)",
        "Custo operacional otimizado"
      ]
    },
    {
      icon: TrendingUp,
      title: "Investidores & Family Offices",
      description: "Gestores de capital que precisam movimentar recursos entre jurisdições com segurança.",
      bullets: [
        "Diversificação internacional de portfólio",
        "Conformidade e rastreabilidade total",
        "Atendimento white-glove"
      ]
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Title */}
          <div className="text-center space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900">
              IDEAL PARA QUEM?
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Empresas que movimentam capital internacionalmente e não podem esperar dias nem perder dinheiro
            </p>
          </div>

          {/* Profiles Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {profiles.map((profile, index) => {
              const Icon = profile.icon;
              return (
                <Card 
                  key={index}
                  className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden"
                >
                  <CardContent className="p-8 space-y-6">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-tkb-cyan flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                          {profile.title}
                        </h3>
                        <p className="text-neutral-600">
                          {profile.description}
                        </p>
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-3 pt-4 border-t border-neutral-100">
                      {profile.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <span className="text-neutral-700 leading-relaxed">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Volume Requirement */}
          <Card className="p-8 bg-gradient-to-br from-neutral-900 to-neutral-800 border-0 text-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/20 border border-primary/30">
                <span className="text-primary font-bold">VOLUME MÍNIMO</span>
              </div>
              <div className="text-5xl sm:text-6xl font-bold text-white">
                R$ 100 mil/mês
              </div>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Operações estruturadas para empresas sérias que movimentam volume relevante
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
