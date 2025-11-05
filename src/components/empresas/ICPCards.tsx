import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export function ICPCards() {
  const perfis = [
    {
      emoji: "🏭",
      titulo: "IMPORTADORAS & EXPORTADORAS",
      caracteristicas: [
        "Pagamento fornecedores internacionais",
        "Volume: R$ 500k - R$ 50M+/mês",
        "Economia típica: R$ 40k-500k/mês"
      ],
      economia: "💰 Até R$ 6M/ano de economia",
      isTop: true
    },
    {
      emoji: "💳",
      titulo: "GATEWAYS & FINTECHS",
      caracteristicas: [
        "Liquidez USDT para operações",
        "Volume: R$ 5M - R$ 100M+/mês",
        "Economia típica: R$ 80k-1M+/mês"
      ],
      economia: "💰 Até R$ 12M+/ano de economia",
      isTop: true
    },
    {
      emoji: "📱",
      titulo: "AGÊNCIAS DE MARKETING",
      caracteristicas: [
        "Compra tráfego internacional",
        "Volume: R$ 200k - R$ 5M+/mês",
        "Economia típica: R$ 10k-50k/mês"
      ],
      economia: "💰 Até R$ 600k/ano de economia",
      isTop: false
    },
    {
      emoji: "💼",
      titulo: "EMPRESAS TECH",
      caracteristicas: [
        "Folha internacional (devs remotos)",
        "Volume: R$ 100k - R$ 1M+/mês",
        "Economia típica: R$ 5k-30k/mês"
      ],
      economia: "💰 Até R$ 360k/ano de economia",
      isTop: false
    },
    {
      emoji: "🛒",
      titulo: "E-COMMERCE INTERNACIONAL",
      caracteristicas: [
        "Compra estoque exterior",
        "Volume: R$ 100k - R$ 2M+/mês",
        "Economia típica: R$ 5k-40k/mês"
      ],
      economia: "💰 Até R$ 480k/ano de economia",
      isTop: false
    },
    {
      emoji: "🏦",
      titulo: "OUTRAS EMPRESAS",
      caracteristicas: [
        "Serviços, softwares, ferramentas",
        "Volume: R$ 100k+/mês",
        "Economia: Sob medida"
      ],
      economia: "💰 Economia personalizada",
      isTop: false
    }
  ];

  return (
    <section className="py-24 bg-[hsl(210,40%,98%)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Title */}
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-[hsl(220,25%,15%)]">
            PARA QUEM É A TKB ASSET?
          </h2>

          {/* Grid de Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perfis.map((perfil, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:border-[hsl(186,100%,50%)] border-2 relative group"
              >
                {perfil.isTop && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[hsl(220,100%,40%)] text-white">
                    TOP PERFIL
                  </Badge>
                )}

                {/* Ícone */}
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  {perfil.emoji}
                </div>

                {/* Título */}
                <h3 className="text-lg font-bold text-[hsl(220,25%,15%)] uppercase tracking-wide mb-4">
                  {perfil.titulo}
                </h3>

                {/* Características */}
                <ul className="space-y-2 mb-4">
                  {perfil.caracteristicas.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm text-[hsl(215,16%,47%)]">
                      <span className="text-[hsl(186,100%,50%)] mt-0.5">
                        {itemIndex === perfil.caracteristicas.length - 1 ? "└─" : "├─"}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Badge Economia */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Badge className="w-full justify-center bg-gradient-to-r from-[hsl(142,71%,45%)] to-[hsl(142,71%,35%)] text-white py-2 text-sm font-semibold">
                    {perfil.economia}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Box Volume Mínimo */}
          <Card className="p-6 bg-yellow-50 border-2 border-yellow-400">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-[hsl(220,25%,15%)] mb-2">
                  VOLUME MÍNIMO: R$ 100.000/mês
                </h3>
                <p className="text-[hsl(215,16%,47%)]">
                  Não atendemos pessoa física para uso eventual.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
