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
        if (!openAIApiKey) {
            throw new Error('Anthropic API key not configured.');
        }

        // System prompt based on TKB Asset's identity
        const systemPrompt = `Você é um Analista de Marketing Sênior e Especialista em Conteúdo da **TKB Asset** (uma mesa OTC institucional de criptoativos focada em B2B e grandes volumes).

Sua missão é criar conteúdo para redes sociais com a seguinte identidade (Tom de Voz):
- **Profissional e Institucional:** Focado em investidores de alta renda, tesourarias de empresas, family offices e parceiros B2B.
- **Autoridade e Dados:** Sempre embase afirmações em tendências macroeconômicas, decisões do Banco Central, dados on-chain ou regulamentação (Ex: CVM, Drex, MiCA).
- **Sem Hype, Sem Vendas Agressivas:** Nunca use termos como "revolução", "fique rico", "game changer", emojis em excesso ou exclamações exageradas.
- **Sofisticado, porém Direto:** Use analogias de mercado tradicionais (ex: comparar stablecoins ao sistema SWIFT).
- **Veracidade:** Não invente estatísticas.

### REGRA DE FORMATO DE ACORDO COM A PLATAFORMA SOLICITADA
Lembre-se, o resultado DEVE ser um JSON válido onde a chave \`content\` muda de acordo com a \`platform\` solicitada. O sistema consumirá APENAS o JSON. Sem texto markdown antes ou depois.

- Se platform = 'linkedin_post' -> JSON content será UMA STRING (com \n).
- Se platform = 'instagram_carousel' -> JSON content será UM ARRAY DE OBJETOS ({ "slideNumber": 1, "title": "...", "body": "...", "type": "cover|content|cta" }) limitando a até 5-6 slides.
- Se platform = 'instagram_post' -> JSON content será UMA STRING (O texto da imagem visual e uma legenda abaixo).
- Se platform = 'twitter_thread' -> JSON content será UM ARRAY DE STRINGS (os tweets).
`;

        // Prompt user request
        const userPrompt = `Por favor, crie um conteúdo para a plataforma **${platform}** sobre o seguinte tópico:
"${topic}"

O formato exigido é JSON válido como descrito abaixo baseado na plataforma escolhida:
Se for 'linkedin_post':
\`\`\`json
{
  "content": "Texto do post... \\n\\n Segundo parágrafo..."
}
\`\`\`

Se for 'instagram_carousel':
\`\`\`json
{
  "content": [
    { "slideNumber": 1, "title": "TÍTULO IMPACTANTE", "body": "Subtítulo curto", "type": "cover" },
    { "slideNumber": 2, "title": "O PROBLEMA", "body": "Explicação em poucas palavras.", "type": "content" },
    { "slideNumber": 3, "title": "A SOLUÇÃO TKB", "body": "Fale com a mesa", "type": "cta" }
  ]
}
\`\`\`

Se for 'instagram_post':
\`\`\`json
{
  "content": {
    "imageText": "FRASE CURTA DE IMPACTO PARA A IMAGEM",
    "caption": "Legenda profunda do post para ir embaixo da imagem..."
  }
}
\`\`\`

Retorne APENAS o JSON.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': openAIApiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229', // Using Claude Opus for high-quality institutional text
                max_tokens: 2000,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Claude API error: ${data.error?.message || JSON.stringify(data)}`);
        }

        const aiResponseText = data.content?.[0]?.text;

        // Parse the JSON blocks out of the AI response (in case it includes markdown ticks)
        let parsedJson;
        try {
            const jsonMatch = aiResponseText.match(/```json\n([\s\S]*?)\n```/);
            const jsonString = jsonMatch ? jsonMatch[1] : aiResponseText;
            parsedJson = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON directly. Raw response:", aiResponseText);
            throw new Error("A IA não retornou um formato JSON válido.");
        }

        return new Response(JSON.stringify(parsedJson), {
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
