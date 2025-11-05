import { HeroSection } from "@/components/empresas/HeroSection";
import { ProblemaSection } from "@/components/empresas/ProblemaSection";
import { SolucaoSection } from "@/components/empresas/SolucaoSection";
import { ComparativoTable } from "@/components/empresas/ComparativoTable";
import { TimelineSection } from "@/components/empresas/TimelineSection";
import { ICPCards } from "@/components/empresas/ICPCards";
import { ProvaSocialSection } from "@/components/empresas/ProvaSocialSection";
import { CTAForm } from "@/components/empresas/CTAForm";
import { useEffect } from "react";

export default function Empresas() {
  useEffect(() => {
    document.title = "TKB Asset Empresas - Conversão BRL→USDT até 85% mais barato";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Mesa OTC profissional. Reduza até 85% dos custos em remessas internacionais. Volume mínimo R$ 100k/mês. Compliance PLD/FT completo.');
    }
  }, []);

  return (
    <main className="empresas-landing">
      <HeroSection />
      <ProblemaSection />
      <SolucaoSection />
      <ComparativoTable />
      <TimelineSection />
      <ICPCards />
      <ProvaSocialSection />
      <CTAForm />
    </main>
  );
}
