import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Instagram, 
  Linkedin,
  Mail,
  MessageCircle,
  Calendar
} from "lucide-react";
import tkbLogo from "@/assets/tkb-logo.png";
import { ProductCard } from "@/components/empresas/ProductCard";
import { PillarCard } from "@/components/empresas/PillarCard";
import { SectorCard } from "@/components/empresas/SectorCard";
import { MetricCard } from "@/components/empresas/MetricCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Landing = () => {
  const navigate = useNavigate();

  const scrollToForm = () => {
    const element = document.getElementById('cta-final');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Corporativo */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10" />
              <div>
                <h1 className="text-lg font-display text-white">TKB Asset</h1>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">
                  Asset Manager Cambial via Blockchain
                </p>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-8 text-sm">
              <a href="#solucoes" className="text-neutral-300 hover:text-white transition-colors">
                Soluções
              </a>
              <a href="#setores" className="text-neutral-300 hover:text-white transition-colors">
                Setores
              </a>
              <a href="#sobre" className="text-neutral-300 hover:text-white transition-colors">
                Sobre
              </a>
              <a href="#contato" className="text-neutral-300 hover:text-white transition-colors">
                Contato
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")} 
                className="hidden sm:inline-flex text-white hover:bg-neutral-800"
              >
                Login
              </Button>
              <Button 
                variant="tkb"
                onClick={scrollToForm}
              >
                Falar com especialista
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/cambio_mundial.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/85 via-neutral-900/75 to-neutral-900/80" />

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--tkb-cyan)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--tkb-cyan)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="container mx-auto px-6 py-24 lg:py-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="animate-fade-in">
              <Badge className="bg-neutral-800 text-neutral-200 border-neutral-700 px-4 py-2 text-xs">
                Lei 14.478/2022 • CNPJ: 45.933.866/0001-93
              </Badge>
            </div>

            {/* Título */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] animate-fade-in-up">
              Gestão financeira internacional onde{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tkb-cyan to-primary">
                velocidade define resultado
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Estruturamos e executamos operações cambiais via blockchain com segurança, compliance e entrega em horas. Não dias.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-400">
              <Button 
                size="lg" 
                variant="tkb"
                onClick={() => navigate("/register")}
                className="min-w-[240px] shadow-xl"
              >
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={scrollToForm}
                className="min-w-[240px] border-neutral-600 text-white hover:bg-neutral-800"
              >
                Falar com especialista
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Proposta de Valor */}
      <section className="py-24 bg-white" id="sobre">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-16">
            {/* Header */}
            <div className="text-center space-y-6 max-w-4xl mx-auto animate-fade-in">
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                Asset Manager Cambial ao lado do seu negócio
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Combinamos infraestrutura tecnológica, conformidade regulatória e atendimento direto para que sua empresa tenha total controle em cada movimentação. Do planejamento à liquidação, garantimos execução, transparência e segurança em todas as etapas.
              </p>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-primary/5 to-white border-primary/20 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in">
                <CardContent className="p-8 space-y-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <div className="text-2xl">⚙️</div>
                  </div>
                  <h3 className="text-2xl font-display text-foreground">
                    Execução sob medida
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cada operação estruturada para seu caso específico
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-white border-success/20 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in animation-delay-200">
                <CardContent className="p-8 space-y-4">
                  <div className="h-14 w-14 rounded-xl bg-success/10 flex items-center justify-center">
                    <div className="text-2xl">🛡️</div>
                  </div>
                  <h3 className="text-2xl font-display text-foreground">
                    Conformidade integral
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Lei 14.478/2022 e parceiros regulados pelo Banco Central
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-tkb-cyan/5 to-white border-tkb-cyan/20 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in animation-delay-400">
                <CardContent className="p-8 space-y-4">
                  <div className="h-14 w-14 rounded-xl bg-tkb-cyan/10 flex items-center justify-center">
                    <div className="text-2xl">📊</div>
                  </div>
                  <h3 className="text-2xl font-display text-foreground">
                    Acompanhamento em tempo real
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Você sabe onde está seu capital a cada minuto
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Frase de impacto */}
            <div className="text-center animate-fade-in animation-delay-600">
              <p className="text-xl font-display text-foreground italic">
                "Disponíveis para operações críticas quando timing define margem"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Números & Credibilidade */}
      <section className="py-24 bg-gradient-to-br from-neutral-50 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Grid de Métricas */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                number="R$ 50M+"
                label="Movimentados nos últimos 12 meses"
                delay="0ms"
                countUp
              />
              <MetricCard 
                number="60-90 min"
                label="Tempo médio de execução porta-a-porta"
                delay="100ms"
              />
              <MetricCard 
                number="30-40%"
                label="Economia média vs mercado tradicional"
                delay="200ms"
              />
              <MetricCard 
                number="24/7"
                label="Disponibilidade operacional"
                delay="300ms"
              />
            </div>

            {/* Frase */}
            <div className="text-center animate-fade-in animation-delay-400">
              <p className="text-lg text-muted-foreground font-medium">
                Infraestrutura preparada para operar quando mercado não espera
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Produtos e Soluções */}
      <section className="py-24 bg-white" id="solucoes">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                Produtos e Soluções
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Soluções cambiais sob medida para cada necessidade do seu negócio
              </p>
            </div>

            {/* Grid de Produtos */}
            <div className="grid lg:grid-cols-2 gap-8">
              <ProductCard 
                icon="💱"
                title="Conversão BRL ↔ USDT"
                description="Liquidez em dólar digital para operações que exigem velocidade e previsibilidade. Spread 30% mais baixo que mercado e execução até 50% mais rápida."
                idealFor={[
                  "Reposição de capital de giro",
                  "Arbitragem de mercado",
                  "Hedge operacional"
                ]}
                execution="30-60 minutos"
                advantage="30% mais econômico"
                badge="DESTAQUE"
              />

              <ProductCard 
                icon="🌐"
                title="Remessa Internacional Express"
                description="BRL direto para USD, EUR, CNY e outras moedas na conta bancária do beneficiário. Economize pelo menos 40% comparado a soluções tradicionais."
                idealFor={[
                  "Pagamento a fornecedores internacionais",
                  "Importação com prazo crítico",
                  "Aquisição de insumos"
                ]}
                execution="1-2 horas porta-a-porta"
                advantage="Economia mínima de 40%"
              />

              <ProductCard 
                icon="🔄"
                title="Corredor Bidirecional"
                description="Entrada e saída de capital internacional com a mesma estrutura de compliance e velocidade. Opere nos dois sentidos sem fricção."
                idealFor={[
                  "Empresas com operação global",
                  "Trades de commodities",
                  "Recebimento de capital estrangeiro"
                ]}
                execution="Sob demanda"
                advantage="Consulte nosso time"
              />

              <ProductCard 
                icon="🔌"
                title="Integração via API"
                description="Automação completa para empresas que processam alto volume de transações internacionais. Conecte seu sistema ao nosso via API REST."
                idealFor={[
                  "Fintechs e gateways de pagamento",
                  "Plataformas de pagamento",
                  "Marketplaces internacionais"
                ]}
                execution="Q1 2025"
                advantage="Automação total"
                badge="EM BREVE"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Por que TKB Asset (5 Pilares) */}
      <section className="py-24 bg-gradient-to-br from-neutral-50 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                Por que TKB Asset?
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Na TKB, transformamos complexidade financeira em execução simples e auditável. Nosso compromisso é entregar velocidade, conformidade e previsibilidade ao seu negócio.
              </p>
            </div>

            {/* Grid 5 Pilares */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <PillarCard 
                icon="🛡️"
                title="Conformidade Estruturada"
                description="Operamos sob Lei 14.478/2022 em parceria com instituições reguladas pelo Banco Central. Toda operação é auditável, declarável e estruturada para passar por compliance interno da sua empresa. Documentação completa: contrato, nota fiscal, comprovantes de transação."
                delay="0ms"
              />

              <PillarCard 
                icon="⚡"
                title="Execução Quando Importa"
                description="Fornecedor não espera 5 dias. Oportunidade de arbitragem não espera 5 dias. Seu negócio não espera 5 dias. Processamos BRL para USD em 60 a 90 minutos. Não prometemos o que não entregamos."
                delay="100ms"
              />

              <PillarCard 
                icon="💎"
                title="Precificação Competitiva"
                description="Economia real e mensurável em cada operação. Conversões até 30% mais baratas que mercado. Remessas internacionais 40% mais econômicas que Wise e bancos tradicionais. Sem taxas escondidas. Sem surpresas no extrato."
                delay="200ms"
              />

              <PillarCard 
                icon="👤"
                title="Atendimento Direto"
                description="Você fala com quem decide. Sem abrir ticket. Sem esperar fila. Sem passar por três níveis de aprovação. Fundador disponível via WhatsApp para operações críticas."
                delay="300ms"
              />

              <PillarCard 
                icon="🔁"
                title="Infraestrutura Redundante"
                description="Operamos com múltiplos provedores de liquidez tier-1 e bancos correspondentes. Se um canal apresenta problema, ativamos alternativa em minutos. Seu capital não fica travado esperando análise de risco bancária."
                delay="400ms"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Setores que Atendemos */}
      <section className="py-24 bg-white" id="setores">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                Construído para negócios que não podem esperar
              </h2>
            </div>

            {/* Grid 3x2 Setores */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SectorCard 
                icon="🌾"
                title="Trading de Commodities"
                description="Soja, milho, carne, café - mercado spot exige liquidação imediata"
                delay="0ms"
              />
              <SectorCard 
                icon="🏭"
                title="Importação Industrial"
                description="Máquinas, insumos, componentes - produção não para esperando wire"
                delay="100ms"
              />
              <SectorCard 
                icon="⚡"
                title="Energia & Combustíveis"
                description="Mercado 24/7 onde minutos definem spread"
                delay="200ms"
              />
              <SectorCard 
                icon="💊"
                title="Farmacêutico & Healthcare"
                description="Importação de princípios ativos e insumos críticos"
                delay="300ms"
              />
              <SectorCard 
                icon="🚢"
                title="Logística Internacional"
                description="Frete, armazenagem, desembaraço - custos que vencem todo dia"
                delay="400ms"
              />
              <SectorCard 
                icon="💻"
                title="Tecnologia & SaaS"
                description="Folha internacional, fornecedores cloud, serviços em USD/EUR"
                delay="500ms"
              />
            </div>

            {/* Frase de fechamento */}
            <div className="text-center animate-fade-in animation-delay-600">
              <p className="text-xl font-display text-foreground italic">
                Se seu negócio opera em janelas de oportunidade medidas em horas, não dias, nós entendemos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-br from-neutral-50 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                Perguntas Frequentes
              </h2>
            </div>

            {/* Accordion */}
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white border border-border rounded-lg px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline">
                  Como a TKB Asset reduz o tempo de remessa de dias para horas?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  Utilizamos infraestrutura blockchain para liquidação internacional, eliminando intermediários do sistema bancário tradicional como correspondentes, SWIFT e múltiplas aprovações. O capital transita por rails digitais que operam 24/7, não apenas horário comercial bancário. Resultado: BRL para USD em 60 a 90 minutos porta-a-porta.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white border border-border rounded-lg px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline">
                  A operação é legal e declarável?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  Sim. Operamos sob Lei 14.478/2022 que regulamenta prestadores de serviços de ativos virtuais no Brasil. Trabalhamos em parceria com instituições reguladas pelo Banco Central para conversão final em moeda fiduciária. Toda operação gera contrato formal, nota fiscal, comprovante de transação blockchain e comprovante bancário de destino. Seu departamento fiscal e compliance conseguem auditar 100% do fluxo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white border border-border rounded-lg px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline">
                  Qual a economia real comparada ao mercado tradicional?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  Conversões BRL para USDT são até 30% mais econômicas que mercado. Remessas internacionais BRL para USD economizam no mínimo 40% versus soluções como Wise e bancos tradicionais. Exemplo prático: Wise cobra taxa de câmbio mais IOF mais tarifas, totalizando 3 a 4%. TKB Asset opera com média de 1,8% tudo incluso. Você sabe exatamente quanto vai pagar antes de confirmar a operação. Não cobramos taxa de abertura de conta, mensalidade ou taxas surpresa.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white border border-border rounded-lg px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline">
                  Existe limite mínimo ou máximo por operação?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <strong>Mínimo:</strong> R$ 50.000 por operação. <strong>Máximo:</strong> Consulte - processamos operações de múltiplos milhões com estrutura adequada. Para volumes recorrentes acima de R$ 5 milhões por mês, oferecemos condições diferenciadas e atendimento prioritário.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white border border-border rounded-lg px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline">
                  Como funciona o processo de onboarding?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  Primeiro contato via WhatsApp ou site. Qualificação para entender sua necessidade. KYC e Due Diligence com documentos da empresa e sócios. Aprovação de compliance em 24 a 48 horas. Primeira operação teste. Operações recorrentes com processo otimizado. Primeira operação leva 2 a 3 dias para aprovar cadastro. Operações seguintes acontecem em minutos: cotação, confirmação e execução.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-white border border-border rounded-lg px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline">
                  Vocês oferecem proteção contra volatilidade cambial?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  Para operações programadas, trabalhamos com trava de taxa. Você fecha câmbio hoje para liquidar em D+2, D+5 e assim por diante. Para operações spot imediatas, a taxa é a do momento da execução. Recomendamos execução em horários de menor volatilidade, entre 10h e 16h horário de Brasília. Para estruturas mais complexas como hedge e forward, consulte nosso time.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-white border border-border rounded-lg px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline">
                  E se houver algum problema técnico durante a operação?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  Operamos com infraestrutura redundante: múltiplos provedores de liquidez tier-1, bancos correspondentes alternativos e canais blockchain com fallback. Se um canal apresenta indisponibilidade, ativamos rota alternativa sem impacto no prazo prometido. Você é notificado em tempo real de cada etapa via WhatsApp.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-white" id="cta-final">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-none shadow-2xl">
              <CardContent className="p-12 sm:p-16 text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-5xl font-display font-bold text-white">
                    Pronto para operar onde velocidade define resultado?
                  </h2>
                  <p className="text-lg text-neutral-300">
                    Fale diretamente com nosso time comercial
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="tkb"
                    className="min-w-[220px] shadow-xl"
                    onClick={() => window.open('https://wa.me/5541984219668', '_blank')}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp Direto
                  </Button>
                  <Button 
                    size="lg" 
                    className="min-w-[220px] bg-white text-neutral-900 hover:bg-neutral-100"
                    onClick={() => window.location.href = 'mailto:gestao@tkbasset.com'}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Agendar Conversa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 border-t border-neutral-800" id="contato">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Logo & Tagline */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-3">
                <img src={tkbLogo} alt="TKB Asset" className="h-12 w-12" />
                <div>
                  <h3 className="text-xl font-display">TKB Asset</h3>
                  <p className="text-sm text-neutral-400">Asset Manager Cambial via Blockchain</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-800" />

            {/* Info Grid */}
            <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
              {/* Legal */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Informações Legais
                </h4>
                <p className="text-sm text-neutral-300">
                  CNPJ: 45.933.866/0001-93
                </p>
                <p className="text-sm text-neutral-300">
                  Operamos sob Lei 14.478/2022
                </p>
              </div>

              {/* Contato */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Contato
                </h4>
                <a 
                  href="mailto:gestao@tkbasset.com" 
                  className="flex items-center justify-center md:justify-start gap-2 text-sm text-neutral-300 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  gestao@tkbasset.com
                </a>
                <a 
                  href="https://wa.me/5541984219668" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start gap-2 text-sm text-neutral-300 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  +55 41 984219668
                </a>
              </div>

              {/* Social */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Redes Sociais
                </h4>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <a 
                    href="https://instagram.com/tkbasset" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-tkb-cyan transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/tkbasset" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-tkb-cyan transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-800" />

            {/* Copyright */}
            <div className="text-center text-sm text-neutral-400">
              © {new Date().getFullYear()} TKB Asset. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
