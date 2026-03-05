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
                        content: `Você é o redator-chefe do blog da TKB Asset, uma empresa brasileira de operações OTC (over-the-counter) de criptoativos, especializada em conversões BRL↔USDT, remessas internacionais e custódia de criptoativos.

Escreva um artigo completo para o blog sobre o seguinte tema:
"${topic}"

Categoria: ${category || "mercado"}

IMPORTANTE: Responda em formato JSON válido com esta estrutura exata:
{
  "title": "Título chamativo e profissional do artigo",
  "summary": "Resumo de 2-3 linhas para preview do artigo",
  "content": "Conteúdo completo do artigo com pelo menos 800 palavras. Use parágrafos separados por \\n\\n. Inclua subtítulos em MAIÚSCULA. O tom deve ser profissional mas acessível, como um analista de mercado explicando para um empresário. Mencione dados reais quando possível.",
  "linkedin_version": "Versão curta de 3-4 parágrafos otimizada para LinkedIn com emojis e hashtags relevantes. Inclua CTA para o site da TKB Asset."
}

Regras:
- O conteúdo deve ser original, informativo e relevante para o mercado brasileiro
- Mencione regulações brasileiras quando pertinente (Marco Legal dos Criptoativos, Banco Central, COAF)
- Use dados e exemplos práticos
- O tom é institucional e confiável, como uma corretora de câmbio sólida
- NÃO inclua markdown no conteúdo (sem # ou ** ou [])
- Responda APENAS o JSON, sem texto antes ou depois`,
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
