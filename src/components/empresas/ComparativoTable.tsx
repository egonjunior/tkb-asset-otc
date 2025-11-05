import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X } from "lucide-react";

export function ComparativoTable() {
  return (
    <section className="py-24 bg-[hsl(210,40%,98%)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Title */}
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-[hsl(220,25%,15%)]">
            COMPARATIVO COMPLETO
          </h2>

          {/* Tabela Comparativa - Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead className="bg-[hsl(220,60%,8%)] text-white">
                <tr>
                  <th className="p-4 text-left">Critério</th>
                  <th className="p-4 text-center">SWIFT/Banco</th>
                  <th className="p-4 text-center">OTC Comum</th>
                  <th className="p-4 text-center bg-[hsl(186,100%,95%)] text-[hsl(220,60%,8%)] relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[hsl(142,71%,45%)]">
                      RECOMENDADO
                    </Badge>
                    <span className="mt-2 block">TKB Asset</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { criterio: "SPREAD/TAXA", swift: "5-7%", otc: "2-3%", tkb: "~1%", swiftIcon: "x", otcIcon: "neutral", tkbIcon: "check" },
                  { criterio: "PRAZO", swift: "3-5 dias", otc: "2-4 horas", tkb: "20-30min", swiftIcon: "x", otcIcon: "neutral", tkbIcon: "check" },
                  { criterio: "LIMITE VOLUME", swift: "Ilimitado", otc: "Varia", tkb: "Ilimitado", swiftIcon: "neutral", otcIcon: "neutral", tkbIcon: "check" },
                  { criterio: "BUROCRACIA", swift: "Alta", otc: "Baixa", tkb: "Mínima*", swiftIcon: "x", otcIcon: "neutral", tkbIcon: "check" },
                  { criterio: "COMPLIANCE", swift: "Bancário", otc: "Variável", tkb: "PLD/FT Completo", swiftIcon: "neutral", otcIcon: "neutral", tkbIcon: "check" },
                  { criterio: "ATENDIMENTO", swift: "Agência", otc: "WhatsApp", tkb: "Dedicado", swiftIcon: "x", otcIcon: "neutral", tkbIcon: "check" },
                  { criterio: "RASTREAMENTO", swift: "Limitado", otc: "Manual", tkb: "Blockchain + Email", swiftIcon: "x", otcIcon: "neutral", tkbIcon: "check" },
                  { criterio: "CONTRATO", swift: "Complexo", otc: "Simples", tkb: "Blindado Jurid.", swiftIcon: "x", otcIcon: "neutral", tkbIcon: "check" }
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-[hsl(220,25%,15%)]">{row.criterio}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {row.swiftIcon === "x" && <X className="h-5 w-5 text-[hsl(348,83%,60%)]" />}
                        <span>{row.swift}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">{row.otc}</td>
                    <td className="p-4 text-center bg-[hsl(186,100%,98%)]">
                      <div className="flex items-center justify-center gap-2">
                        {row.tkbIcon === "check" && <CheckCircle2 className="h-5 w-5 text-[hsl(142,71%,45%)]" />}
                        <span className="font-semibold">{row.tkb}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile - Cards */}
          <div className="lg:hidden space-y-4">
            {[
              { criterio: "SPREAD/TAXA", swift: "5-7%", otc: "2-3%", tkb: "~1%" },
              { criterio: "PRAZO", swift: "3-5 dias", otc: "2-4 horas", tkb: "20-30min" },
              { criterio: "BUROCRACIA", swift: "Alta", otc: "Baixa", tkb: "Mínima*" }
            ].map((row, index) => (
              <Card key={index} className="p-4">
                <h3 className="font-bold text-[hsl(220,25%,15%)] mb-3">{row.criterio}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(215,16%,47%)]">SWIFT:</span>
                    <span className="text-[hsl(348,83%,60%)]">{row.swift}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(215,16%,47%)]">OTC Comum:</span>
                    <span>{row.otc}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold bg-[hsl(186,100%,98%)] p-2 rounded">
                    <span className="text-[hsl(220,25%,15%)]">TKB Asset:</span>
                    <span className="text-[hsl(142,71%,45%)]">{row.tkb} ✓</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Simulação Real */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-red-50 border-2 border-red-200">
              <p className="text-sm text-[hsl(215,16%,47%)] mb-2">SWIFT</p>
              <p className="text-3xl font-bold text-[hsl(348,83%,60%)] font-mono">R$ 60.000</p>
              <p className="text-sm text-[hsl(215,16%,47%)] mt-1">6% + 4 dias</p>
            </Card>
            <Card className="p-6 bg-orange-50 border-2 border-orange-200">
              <p className="text-sm text-[hsl(215,16%,47%)] mb-2">OTC Comum</p>
              <p className="text-3xl font-bold text-orange-600 font-mono">R$ 25.000</p>
              <p className="text-sm text-[hsl(215,16%,47%)] mt-1">2.5% + 3 horas</p>
            </Card>
            <Card className="p-6 bg-[hsl(142,71%,95%)] border-2 border-[hsl(142,71%,45%)]">
              <p className="text-sm text-[hsl(215,16%,47%)] mb-2">TKB Asset</p>
              <p className="text-3xl font-bold text-[hsl(142,71%,45%)] font-mono">R$ 10.000</p>
              <p className="text-sm text-[hsl(215,16%,47%)] mt-1">1% + 25 min ✓</p>
            </Card>
          </div>

          {/* Box Economia Final */}
          <Card className="p-8 bg-gradient-to-br from-[hsl(142,71%,45%)] to-[hsl(142,71%,35%)] text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Multiplicado por 12 operações/ano
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur">
                <p className="text-white/90 mb-2">SWIFT</p>
                <p className="text-2xl font-bold font-mono">R$ 720.000/ano</p>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur">
                <p className="text-white/90 mb-2">OTC Comum</p>
                <p className="text-2xl font-bold font-mono">R$ 300.000/ano</p>
              </div>
              <div className="text-center p-4 bg-white/20 rounded-lg backdrop-blur border-2 border-white">
                <p className="text-white mb-2">TKB Asset</p>
                <p className="text-3xl font-bold font-mono">R$ 120.000/ano</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
