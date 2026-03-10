import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { topic, platform } = await req.json();

        if (!topic || !platform) {
            throw new Error('Topic and platform are required.');
        }

        const openAIApiKey = Deno.env.get('ANTHROPIC_API_KEY');
        const dalleApiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAIApiKey) {
            throw new Error('Anthropic API key not configured.');
        }

        // System prompt based on TKB Asset's identity
        const systemPrompt = `Você é um Diretor Executivo de Marketing Institucional e Head de Conteúdo na **TKB Asset** (uma boutique de investimentos OTC cripto, focada em institucionais, B2B e grandes volumes).

Sua missão é criar um conteúdo magistral para as redes sociais seguindo o "Padrão Ouro" da TKB Asset:
- **Tom de Voz:** Extremamente profissional, incisivo, sofisticado. Comunique como gestor de fundo para family offices, tesourarias e ultra-high net worth individuals.
- **Estruturação:** Frases curtas, de impacto, dados mercadológicos irrepreensíveis (cite teses como flight-to-quality, macroeconomia americana, tokenização RWA, CBDCs, ou tendências institucionais).
- **Abordagem Visual:** A TKB Asset tem um visual dark, minimalista e futurista ("midnight blue, gold accents, neon cyan, bloom effects, institutional finance, sharp graphics, dark glassmorphism").
- **Proibido:** "Fique rico rápido", emoticons exagerados (🚫🚀🔥), linguagem varejista, promessas infundadas.

### REGRA DE FORMATO DO JSON
Gere um plano de design visual de fundo (Obrigatório em INGLÊS no \`image_prompt\` para usar no DALL-E 3) e o \`content\` do post:

- \`image_prompt\`: Um prompt em INGLÊS hiper-detalhado (Máx 400 letras) instruindo um renderizador de imagem fotorrealista/abstrato a criar o background perfeito. DEVE incluir: "abstract premium dark background, cyan and gold glowing accents, institutional finance concept, glassmorphism, depth of field, 8k resolution, elegant, no text, clean".
- \`content\`: O texto do post (depende da plataforma):

Se 'linkedin_post' -> JSON com \`content\` (a copy longa com espaçamentos).
Se 'instagram_carousel' -> JSON com \`content\` (ARRAY DE OBJETOS: { "slideNumber": 1, "title": "CATCHY", "body": "Explicação institucional em até 3 linhas", "type": "cover|content|cta" }) limitando a 5 slides totais.
Se 'instagram_post' -> JSON com \`content\` ({ "imageText": "FRASE MATADORA PARA A ARTE (MAX 5-7 PALAVRAS)", "caption": "A legenda profunda..." })

RETORNE APENAS JSON VÁLIDO ENVOLVENDO AS DUAS CHAVES (\`image_prompt\`, \`content\`). SEM COMENTÁRIOS E SEM MARKDOWN.`;

        // Prompt user request
        const userPrompt = `Crie o conteúdo impecável para a plataforma **${platform}** sobre: "${topic}"

Exemplo JSON Esperado rigorosamente:
{
  "image_prompt": "Abstract dark neon blue...",
  "content": ...
}`;

        // 1. Chamar Claude 3 para Copy + Image Prompt
        console.log(`[generate-social-content] Calling Anthropic for platform ${platform}`);
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': openAIApiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
            }),
        });

        const claudeData = await claudeResponse.json();

        if (!claudeResponse.ok) {
            throw new Error(`Claude API error: ${claudeData.error?.message || JSON.stringify(claudeData)}`);
        }

        const aiResponseText = claudeData.content?.[0]?.text;

        // Extrair e Validar o JSON do Claude
        let parsedJson;
        try {
            const jsonMatch = aiResponseText.match(/\`\`\`json\n([\\s\\S]*?)\n\`\`\`/);
            const jsonString = jsonMatch ? jsonMatch[1] : aiResponseText;
            parsedJson = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON directly. Raw response:", aiResponseText);
            throw new Error("A IA Claude não retornou um formato JSON válido.");
        }

        let imageUrl = null;
        let finalResponse = { ...parsedJson, imageUrl };

        // 2. Chamar DALL-E 3 para gerar Imagem
        if (dalleApiKey && parsedJson.image_prompt) {
            console.log(`[generate-social-content] Generated image prompt: ${parsedJson.image_prompt}`);
            console.log(`[generate-social-content] Calling OpenAI DALL-E 3`);

            try {
                const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${dalleApiKey}`
                    },
                    body: JSON.stringify({
                        model: "dall-e-3",
                        prompt: parsedJson.image_prompt,
                        n: 1,
                        size: "1024x1024",
                        quality: "standard"
                    })
                });

                const dalleData = await dalleResponse.json();

                if (dalleResponse.ok && dalleData.data && dalleData.data.length > 0) {
                    imageUrl = dalleData.data[0].url;
                    finalResponse.imageUrl = imageUrl;
                    console.log(`[generate-social-content] Successfully generated Image URL`);
                } else {
                    console.error(`[generate-social-content] DALL-E API Error: ${JSON.stringify(dalleData)}`);
                }
            } catch (dalleErr) {
                console.error(`[generate-social-content] Failed running DALL-E fetch:`, dalleErr);
            }
        } else {
            if (!dalleApiKey) console.log("[generate-social-content] Skipping DALL-E 3, missing OPENAI_API_KEY.");
        }

        return new Response(JSON.stringify(finalResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generated in social edge function:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
