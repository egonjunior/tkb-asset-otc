import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingDown } from "lucide-react";

export function SolucaoSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Title */}
          <div className="text-center space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              TKB ASSET
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-tkb-cyan to-primary bg-clip-text text-transparent">
              Asset Manager Cambial via Blockchain
            </h3>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Facilitamos operações cambiais internacionais para empresas que não podem esperar dias.
            </p>
          </div>

          {/* 4 Pilares */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "VELOCIDADE INSTITUCIONAL",
                items: [
                  "60-90 minutos porta-a-porta",
                  "PIX em BRL → USD na conta destino",
                  "Sem intermediários desnecessários"
                ]
              },
              {
                title: "ECONOMIA REAL",
                items: [
                  "1,8-2,5% tudo incluso",
                  "40-50% mais econômico que wire",
                  "Sem taxas ocultas ou surpresas"
                ]
              },
              {
                title: "COBERTURA GLOBAL",
                items: [
                  "50+ países atendidos",
                  "USD • EUR • CNY • GBP",
                  "Infraestrutura multi-provedor"
                ]
              },
              {
                title: "CONFORMIDADE INTEGRAL",
                items: [
                  "Lei 14.478/2022 (PSAV)",
                  "Parceiros regulados BACEN",
                  "100% auditável e declarável"
                ]
              }
            ].map((pilar, index) => (
              <Card 
                key={index}
                className="p-6 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              >
                <h4 className="text-lg font-bold text-primary mb-4 uppercase tracking-tight">
                  {pilar.title}
                </h4>
                <ul className="space-y-3">
                  {pilar.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* Quote */}
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-tkb-cyan/10 border-2 border-primary/30">
            <p className="text-2xl sm:text-3xl text-white text-center italic font-light leading-relaxed">
              "Não é 'cripto'. É infraestrutura financeira moderna.<br />
              <span className="font-semibold text-primary">Blockchain é o trilho. Você é o passageiro.</span>"
            </p>
          </Card>

          {/* Como Funciona */}
          <div className="space-y-8">
            <h3 className="text-3xl sm:text-4xl font-bold text-white text-center">
              COMO FUNCIONA NA PRÁTICA
            </h3>
            <p className="text-xl text-white/80 text-center">
              Processo simples e transparente
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "VOCÊ (BRASIL)",
                  items: ["Empresa brasileira", "PIX R$ 100.000", "Contrato + NF", "Due Diligence"]
                },
                {
                  step: "2",
                  title: "TKB ASSET",
                  items: ["BRL → USDT (blockchain)", "Liquidação Tron", "USDT → Moeda destino", "60-90 minutos"]
                },
                {
                  step: "3",
                  title: "DESTINO GLOBAL",
                  items: ["USD → Estados Unidos", "EUR → Europa", "CNY → China", "GBP → Reino Unido"]
                }
              ].map((step, index) => (
                <Card 
                  key={index}
                  className="p-6 bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden group"
                >
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                    {step.step}
                  </div>
                  <h4 className="text-xl font-bold text-primary mb-4 uppercase tracking-tight">
                    {step.title}
                  </h4>
                  <ul className="space-y-2 relative z-10">
                    {step.items.map((item, idx) => (
                      <li key={idx} className="text-white/80">• {item}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            {/* Timeline */}
            <Card className="p-8 bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                {["0min\nInício", "30min\nProcessando", "60min\nQuase lá", "90min\nConcluído"].map((time, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-neutral-900 font-bold mb-2">
                      {index + 1}
                    </div>
                    <div className="text-sm text-white/80 text-center whitespace-pre-line">{time}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Exemplo Real */}
            <Card className="p-8 bg-gradient-to-br from-primary/20 to-tkb-cyan/20 border-2 border-primary/50">
              <div className="space-y-4 text-center">
                <div className="text-sm text-primary uppercase tracking-wider font-bold">EXEMPLO REAL</div>
                <div className="space-y-2">
                  <p className="text-xl text-white">
                    <strong>Segunda-feira, 10h00:</strong> Cliente envia PIX R$ 100.000
                  </p>
                  <div className="text-4xl text-primary my-4">↓</div>
                  <p className="text-xl text-white">
                    <strong>Segunda-feira, 11h30:</strong> Fornecedor chinês recebe CNY
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
