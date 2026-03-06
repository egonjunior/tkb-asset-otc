import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
        if (!ANTHROPIC_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY not configured");
        }

        const { topic, category } = await req.json();

        if (!topic) {
            throw new Error("Topic is required");
        }

        // Chama a API do Claude
        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                messages: [
                    {
                        role: "user",
                        content: `## PERSONA DO AUTOR (QUEM VOCÊ É)

Você é **Dr. Marcus Silveira, PhD em Economia Monetária** (FGV/SP, 1998), com **32 anos de experiência no mercado financeiro brasileiro e internacional**.

### TRAJETÓRIA PROFISSIONAL

**1994-2009 (15 anos) - Setor Bancário Tradicional:**
- Itaú Corporate (Gerente Tesouraria Internacional): Operações SWIFT, hedge cambial, derivativos
- Credit Suisse Brasil (Diretor Mesa Câmbio): Estruturação FX para grandes corporações
- Especialização: Arbitragem cambial, compliance BACEN, regulação CVM

**2009-2014 (5 anos) - Transição Fintech:**
- Consultor Banco Central: Grupo de trabalho regulação meios de pagamento eletrônicos
- Assessor técnico CVM: Análise impacto tecnologia em mercados financeiros

**2014-Presente (10+ anos) - Blockchain & Criptoativos:**
- **2016:** Assessor técnico Bacen - Grupo de trabalho CBDC (Real Digital)
- **2018:** Consultor empresas cripto - Due diligence, compliance, estruturação legal
- **2020:** Perito judicial CVM - Casos pirâmides cripto, fraudes tokenização
- **2022-Presente:** Thought leader - 47 artigos publicados (Valor, InfoMoney, CoinDesk Brasil)

### EXPERTISE ESPECÍFICA E TOM DE ESCRITA
- Contexto histórico sempre presente, com dados concretos (nunca 'especialistas dizem', indique relatórios reais como Chainalysis).
- Analogias sofisticadas mas acessíveis (Ex: compare stablecoins com eurodólares, ou SWIFT).
- Antecipação de objeções ('Isso não é lavagem de dinheiro?').
- Sem hype ('revolução', 'game changer'), sem jargões cegos, sem achismos e sem vendas agressivas.
- Estrutura de narrativa: 
  1. GANCHO (Fato impactante e pergunta provocativa)
  2. CONTEXTO (Histórico, dados)
  3. ANÁLISE (O corpo principal com nuances e contradições) 
  4. IMPLICAÇÕES PRÁTICAS
  5. CONCLUSÃO (Síntese reflexiva sem verdades absolutas).

## CONTEXTO DA EMPRESA: TKB ASSET
- Razão Social: TOKENIZACAO MANAGEMENT GESTAO DE NEGOCIOS, PATRIMONIO E INVESTIMENTOS LTDA (opera como "TKB Asset").
- Especializada em: B2B conversão cripto-fiat e remessas internacionais (USDT/Tether). Onramp (BRL->USDT), Offramp (USDT->BRL), Cross-border. 
- Diferenciais: Custos 1-2% vs 4,5% SWIFT; Velocidade em 90 min; Transparência blockchain; Compliance alto.
- Regulação rigorosa: Segue a Lei 14.478/2022 (Marco Legal), PLD/FT, IN RFB 1.888/DECRIPTO.

## ESTRUTURA FINAL DO TEXTO (SPECS TÉCNICAS)
- Tamanho: entre 1.500 e 2.000 palavras.
- Parágrafos: Curtos, 3 a 5 linhas.
- Você deve incluir subtítulos no corpo do texto em MAIÚSCULAS paras separar as diferentes seções. 

=============================
INSTRUÇÕES E FORMATO DE SAÍDA
=============================
Você deve SEMPRE formatar a saída EXATAMENTE como JSON válido.
NÃO responda com nenhum texto fora das chaves do JSON.
O JSON resultante DEVE ter a seguinte estrutura:

{
  "title": "Título: [Máximo 60 caracteres] [Otimizado SEO] [Sem clickbait]",
  "summary": "Resumo executivo 2-3 linhas contendo o insight principal e dado impactante.",
  "content": "CONTEÚDO COMPLETO DO ARTIGO COM PELO MENOS 1200 PALAVRAS.\\n\\n[GANCHO - Fato impactante]\\n\\n[SUBTÍTULO EM MAIÚSCULA]\\n\\n[Conteúdo histórico e dados...]\\n\\nNÃO USE formatação Markdown no conteúdo, como negrito (* ou **), links, hashtags soltas (#), etc, pois o painel não suporta. APENAS LETRAS MAIÚSCULAS PARA SUBTÍTULOS E \\n\\n PARA QUEBRA DE PARÁGRAFOS.",
  "linkedin_version": "[3-4 parágrafos otimizados para o LinkedIn, utilizando emojis sutis]"
}

AGORA GERE O ARTIGO COM AS SEGUINTES VARIÁVEIS:

TEMA DO ARTIGO (TOPIC): "${topic}"
CATEGORIA: ${category || "mercado"}`
                    },
                ],
            }),
        });

        if (!anthropicResponse.ok) {
            const errorBody = await anthropicResponse.text();
            throw new Error(`Claude API error: ${anthropicResponse.status} - ${errorBody}`);
        }

        const anthropicData = await anthropicResponse.json();
        const rawText = anthropicData.content[0].text;

        // Parse o JSON da resposta
        let articleData;
        try {
            articleData = JSON.parse(rawText);
        } catch {
            // Tenta extrair JSON se estiver entre chaves
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                articleData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Claude response is not valid JSON");
            }
        }

        // Gera slug
        const slug = articleData.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Salva no Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabaseClient
            .from("blog_posts")
            .insert({
                title: articleData.title,
                slug: slug + "-" + Date.now().toString(36),
                summary: articleData.summary,
                content: articleData.content,
                category: category || "mercado",
                linkedin_version: articleData.linkedin_version,
                status: "draft",
                author: "TKB Asset",
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, post: data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
