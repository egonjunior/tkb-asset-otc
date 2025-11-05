import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export function ProblemaSection() {
  const problemas = [
    "Taxas bancárias SWIFT: 5-7%",
    "Spread alto em exchanges: 2-3%",
    "IOF: 1.1%",
    "Demora: 3-5 dias úteis",
    "Burocracia: Formulários, aprovações, ligações"
  ];

  return (
    <section className="py-24 bg-[hsl(210,40%,98%)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Title */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-[hsl(220,25%,15%)]">
              QUANTO SUA EMPRESA ESTÁ PERDENDO?
            </h2>
            <p className="text-xl text-[hsl(215,16%,47%)] max-w-3xl mx-auto">
              Importadoras, gateways de pagamento, fintechs e agências gastam milhares de reais <strong>TODO MÊS</strong> em:
            </p>
          </div>

          {/* Lista de Problemas */}
          <div className="space-y-3">
            {problemas.map((problema, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-white transition-all duration-200"
              >
                <X className="h-6 w-6 text-[hsl(348,83%,60%)] flex-shrink-0" />
                <span className="text-lg text-[hsl(220,25%,15%)]">{problema}</span>
              </div>
            ))}
          </div>

          {/* Cenário Real - Comparação */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {/* Via SWIFT */}
            <Card className="p-6 bg-red-50 border-2 border-red-200">
              <h3 className="text-xl font-bold text-[hsl(220,25%,15%)] mb-4">Via SWIFT (Banco)</h3>
              <div className="space-y-2 text-[hsl(215,16%,47%)]">
                <p className="text-lg font-semibold text-[hsl(220,25%,15%)]">Transação: R$ 2.000.000</p>
                <p>Taxa: 5-6% = <strong className="text-[hsl(348,83%,60%)]">R$ 120.000</strong></p>
                <p>IOF: 1.1% = <strong className="text-[hsl(348,83%,60%)]">R$ 22.000</strong></p>
                <p>Prazo: <strong>4 dias úteis</strong></p>
              </div>
              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-2xl font-bold text-[hsl(348,83%,60%)]">
                  R$ 142.000 + 4 dias
                </p>
              </div>
            </Card>

            {/* Via Exchange */}
            <Card className="p-6 bg-orange-50 border-2 border-orange-200">
              <h3 className="text-xl font-bold text-[hsl(220,25%,15%)] mb-4">Via Exchange</h3>
              <div className="space-y-2 text-[hsl(215,16%,47%)]">
                <p className="text-lg font-semibold text-[hsl(220,25%,15%)]">Transação: R$ 2.000.000</p>
                <p>Spread: 2.5% = <strong className="text-orange-600">R$ 50.000</strong></p>
                <p>Taxa de saque: <strong className="text-orange-600">R$ 500</strong></p>
                <p>Prazo: <strong>2-4 horas</strong></p>
              </div>
              <div className="mt-4 pt-4 border-t border-orange-200">
                <p className="text-2xl font-bold text-orange-600">
                  R$ 50.500
                </p>
              </div>
            </Card>
          </div>

          {/* Custo Anualizado */}
          <Card className="p-8 border-2 border-[hsl(348,83%,60%)] bg-gradient-to-br from-red-50 to-orange-50">
            <h3 className="text-2xl font-bold text-[hsl(220,25%,15%)] mb-6 text-center">
              Custo Anualizado (12 operações/ano)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-[hsl(215,16%,47%)] mb-2">SWIFT</p>
                <p className="text-4xl font-bold text-[hsl(348,83%,60%)] font-mono">
                  R$ 1.704.000/ano
                </p>
              </div>
              <div className="text-center">
                <p className="text-[hsl(215,16%,47%)] mb-2">Exchange</p>
                <p className="text-4xl font-bold text-orange-600 font-mono">
                  R$ 606.000/ano
                </p>
              </div>
            </div>
          </Card>

          {/* Frase Final */}
          <p className="text-2xl sm:text-3xl font-semibold text-center text-[hsl(348,83%,60%)]">
            Esse dinheiro poderia estar no seu caixa.
          </p>
        </div>
      </div>
    </section>
  );
}
