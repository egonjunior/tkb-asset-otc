import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Wallet, Settings, Target } from "lucide-react";

export function TimelineSection() {
  const passos = [
    {
      numero: 1,
      titulo: "ONBOARDING",
      icon: FileText,
      itens: [
        "Envio de documentos",
        "Assinatura de contrato + PLD/FT",
        "Validação KYC/CDD"
      ],
      badge: "24-48 horas",
      badgeColor: "bg-blue-500"
    },
    {
      numero: 2,
      titulo: "COTAÇÃO EM TEMPO REAL",
      icon: TrendingUp,
      itens: [
        "Acesse plataforma",
        "Informe valor (BRL)",
        "Cotação USDT em tempo real"
      ],
      badge: "Trava: 15 min",
      badgeColor: "bg-purple-500"
    },
    {
      numero: 3,
      titulo: "TRANSFERÊNCIA BRL",
      icon: Wallet,
      itens: [
        "PIX ou TED para TKB Asset",
        "Upload comprovante"
      ],
      badge: "Confirmação: 2-5 min",
      badgeColor: "bg-cyan-500"
    },
    {
      numero: 4,
      titulo: "PROCESSAMENTO",
      icon: Settings,
      itens: [
        "Validação comprovante",
        "Conversão BRL → USDT"
      ],
      badge: "10-15 min",
      badgeColor: "bg-orange-500"
    },
    {
      numero: 5,
      titulo: "RECEBIMENTO USDT",
      icon: Target,
      itens: [
        "USDT enviado (TRC-20/ERC-20)",
        "Hash por email",
        "Rastreamento blockchain"
      ],
      badge: "Total: 20-30 min",
      badgeColor: "bg-green-500"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Title */}
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-[hsl(220,25%,15%)]">
            COMO FUNCIONA NA PRÁTICA
          </h2>

          {/* Timeline */}
          <div className="relative">
            {/* Linha conectora - desktop */}
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-[hsl(186,100%,50%)] to-[hsl(142,71%,45%)]"></div>

            {/* Passos */}
            <div className="space-y-8">
              {passos.map((passo, index) => (
                <div 
                  key={index} 
                  className="relative flex gap-6 animate-fade-in-left"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Número circular */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[hsl(186,100%,50%)] flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">{passo.numero}</span>
                    </div>
                  </div>

                  {/* Card do passo */}
                  <Card className="flex-1 p-6 hover:shadow-xl transition-all duration-300 hover:border-[hsl(186,100%,50%)] border-2 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <passo.icon className="h-8 w-8 text-[hsl(186,100%,50%)] group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold text-[hsl(220,25%,15%)]">{passo.titulo}</h3>
                      </div>
                      <Badge className={`${passo.badgeColor} text-white`}>
                        {passo.badge}
                      </Badge>
                    </div>

                    <ul className="space-y-2">
                      {passo.itens.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-[hsl(215,16%,47%)]">
                          <span className="text-[hsl(186,100%,50%)] mt-1">
                            {itemIndex === passo.itens.length - 1 ? "└─" : "├─"}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Box Final */}
          <Card className="p-6 bg-gradient-to-r from-[hsl(186,100%,50%)] to-[hsl(142,71%,45%)] text-white">
            <div className="flex items-center gap-4">
              <div className="text-4xl">⚡</div>
              <div>
                <h3 className="text-xl font-bold mb-1">PRÓXIMAS OPERAÇÕES</h3>
                <p className="text-white/95">
                  Ainda mais rápidas (Pula direto pro Passo 2)
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
