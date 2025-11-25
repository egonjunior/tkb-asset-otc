import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export function ProblemaSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Title */}
          <div className="text-center space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900">
              O CUSTO REAL DO WIRE TRANSFER
            </h2>
            <p className="text-2xl text-neutral-600 max-w-3xl mx-auto">
              Você paga muito mais do que imagina
            </p>
            <div className="inline-block mt-8">
              <div className="text-6xl sm:text-7xl font-bold text-primary">5-7 dias</div>
              <p className="text-lg text-neutral-600 mt-2">é quanto seu capital fica "viajando" entre países</p>
            </div>
          </div>

          {/* Breakdown de Custos */}
          <Card className="p-8 sm:p-12 bg-white shadow-xl border-0">
            <h3 className="text-3xl font-bold text-neutral-900 mb-8 uppercase tracking-tight">
              Breakdown de Custos Ocultos:
            </h3>
            
            <div className="space-y-6">
              {[
                { label: "Spread cambial real", sublabel: "Não apenas o \"1,5%\" do extrato", value: "1,5-2,5%" },
                { label: "Tarifa wire out", sublabel: "Seu banco cobra para enviar", value: "R$ 150-200" },
                { label: "Correspondente bancário", sublabel: "Banco intermediário cobra taxa", value: "0,3-0,5%" },
                { label: "SWIFT", sublabel: "Rede de mensagens interbancária", value: "US$ 30-50" },
                { label: "IOF", sublabel: "Imposto obrigatório sobre operação", value: "0,38%" },
                { label: "Tarifa wire in", sublabel: "Banco destino cobra para receber", value: "US$ 15-30" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-5 rounded-xl hover:bg-neutral-50 transition-all duration-200 border border-neutral-100"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-neutral-900 text-lg">{item.label}</div>
                    <div className="text-sm text-neutral-500 mt-1">{item.sublabel}</div>
                  </div>
                  <div className="text-2xl font-bold text-primary ml-4">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t-2 border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-neutral-500 uppercase tracking-wider mb-2">Custo Total Real</div>
                  <div className="text-5xl font-bold text-destructive">3-5%</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Exemplo Real */}
          <Card className="p-8 sm:p-12 bg-gradient-to-br from-destructive/5 to-destructive/10 border-2 border-destructive/20">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-neutral-900">
                Em R$ 1 milhão/ano de remessas:
              </h3>
              <div className="text-5xl sm:text-6xl font-bold text-destructive">
                Você perde R$ 30-50 mil sem perceber
              </div>
              <div className="pt-6 border-t border-destructive/20">
                <div className="text-3xl font-bold text-neutral-900 uppercase tracking-tight">
                  E AINDA ESPERA 5-7 DIAS
                </div>
                <p className="text-xl text-neutral-600 mt-4 italic">
                  Fornecedor não espera. Oportunidade não espera. Mercado não espera.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
