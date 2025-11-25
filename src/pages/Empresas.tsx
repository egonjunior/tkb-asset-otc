import { HeroSection } from "@/components/empresas/HeroSection";
import { ProblemaSection } from "@/components/empresas/ProblemaSection";
import { SolucaoSection } from "@/components/empresas/SolucaoSection";
import { IdealParaSection } from "@/components/empresas/IdealParaSection";
import { ProvaSocialSection } from "@/components/empresas/ProvaSocialSection";
import { CTAForm } from "@/components/empresas/CTAForm";
import { useEffect } from "react";

export default function Empresas() {
  useEffect(() => {
    document.title = "TKB Asset - Capital Global. Velocidade Institucional.";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Asset Manager Cambial via Blockchain. Operações B2B em 50+ países. 60-90min tempo médio, 40-50% economia. Lei 14.478/2022 - 100% conforme.');
    }
  }, []);

  return (
    <main className="empresas-landing">
      <HeroSection />
      <ProblemaSection />
      <SolucaoSection />
      <IdealParaSection />
      <ProvaSocialSection />
      <CTAForm />
    </main>
  );
}
