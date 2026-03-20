# Squad tkb-tech — Plataforma OTC

## Missão
Responsável por toda a evolução técnica da plataforma TKB Asset: fluxo manual, fluxo API, integrações com provedores e automação de operações OTC.

## Agentes

| Agente | Papel | Autoridade exclusiva |
|--------|-------|----------------------|
| `@otc-architect` | Arquitetura do fluxo API, design de integrações, webhooks | Decisões de design técnico |
| `@otc-dev` | Implementa cotação, travamento, verificação de pagamento, envio | Código frontend e Edge Functions |
| `@otc-qa` | Testa cada etapa do fluxo (comprovante, aprovação, envio) | Critérios de aceitação e testes |
| `@otc-devops` | Deploy, CI/CD, monitoramento das APIs, variáveis de ambiente | Infraestrutura e Vercel/Supabase |

## Contexto Técnico

### Arquitetura atual
```
Frontend (React/Vite)
├── src/pages/OtcQuote.tsx         — tela de cotação do cliente
├── src/pages/TradingOrderPage.tsx — lista e gestão de pedidos
├── src/pages/Dashboard.tsx        — dashboard do cliente
└── src/pages/admin/               — painel administrativo

Supabase Edge Functions (Deno)
├── get-otc-quote/    — busca preço atual do USDT (OKX)
├── lock-price/       — trava cotação por N minutos
├── okx-operations/   — integração com provedor OKX
├── get-partner-price/— preço especial para parceiros B2B
└── send-email/       — notificações por email

Banco de dados (PostgreSQL via Supabase)
└── supabase/migrations/ — 38+ migrations com schema completo
```

### Fluxo manual atual
1. Cliente abre conta
2. Solicita cotação (BRL → USDT)
3. Trava o preço (válido por tempo limitado)
4. Envia comprovante de pagamento
5. **[MANUAL]** Operador verifica se o pagamento caiu
6. **[MANUAL]** Operador aprova cotação e lote
7. **[MANUAL]** Operador vai ao banco e envia para o provedor
8. Provedor recebe e envia o USDT ao cliente

### Fluxo API alvo (a construir)
1. Cliente autentica via API Key
2. Solicita cotação via `POST /api/quote`
3. Recebe cotação com validade + instruções de pagamento PIX/wire
4. Realiza o pagamento
5. **[AUTOMÁTICO]** Webhook do banco detecta o PIX recebido
6. **[AUTOMÁTICO]** Sistema valida valor + cotação + cliente
7. **[AUTOMÁTICO]** Aprovação disparada
8. **[AUTOMÁTICO]** Chamada ao provedor OKX para envio
9. Cliente recebe USDT + notificação

## Histórias Prioritárias

### Historia 1: API de cotação pública
```
Como desenvolvedor parceiro,
Quero obter uma cotação de USDT via API REST,
Para integrar o serviço TKB em minha aplicação.

Critérios de aceitação:
- POST /functions/v1/get-otc-quote com { amount_brl, direction }
- Retorna { rate, spread, total_usdt, valid_until, quote_id }
- Autenticação via API Key no header Authorization
- Rate limiting: 60 req/min por API Key
- Cotação válida por 5 minutos
```

### Historia 2: Webhook de detecção de pagamento PIX
```
Como operador TKB,
Quero que o sistema detecte automaticamente quando um PIX entra,
Para eliminar a verificação manual de comprovantes.

Critérios de aceitação:
- Edge Function recebe webhook do banco
- Valida valor, chave PIX, horário
- Associa ao pedido correto (por valor + CPF/CNPJ)
- Atualiza status do pedido para "pagamento_confirmado"
- Dispara notificação ao operador e ao cliente
```

### Historia 3: Dashboard diferenciado por tipo de cliente
```
Como cliente TKB,
Quero ver um dashboard adaptado ao meu perfil (manual ou API),
Para ter acesso às funcionalidades certas.

Critérios de aceitação:
- Clientes "manual": interface atual + upload de comprovante
- Clientes "api": documentação da API + logs de chamadas + API Keys
- Admin pode definir o tipo de cada cliente
- Rota /dashboard renderiza o componente correto
```

## Workflows

### `workflow: fluxo-manual`
Revisar e otimizar o fluxo existente (sem quebrar nada):
1. `@otc-architect` mapeia os pontos de atrito atuais
2. `@otc-dev` implementa melhorias pontuais
3. `@otc-qa` valida que o fluxo existente não regrediu

### `workflow: fluxo-api`
Construir o novo fluxo API do zero:
1. `@otc-architect` desenha a arquitetura completa
2. `@otc-dev` implementa as Edge Functions necessárias
3. `@otc-qa` escreve testes automatizados
4. `@otc-devops` configura variáveis, deploys e monitoramento

### `workflow: onboarding-cliente`
Definir qual fluxo o cliente usa e configurar seu dashboard:
1. `@otc-architect` define a lógica de seleção de perfil
2. `@otc-dev` implementa a bifurcação no dashboard
3. `@otc-qa` testa os dois caminhos

## Comandos Rápidos

```bash
# Executar com contexto deste squad:
# "Leia .claude/squads/tkb-tech/CLAUDE.md e execute: [tarefa]"

# Exemplos:
# "Leia tkb-tech/CLAUDE.md e implemente a Historia 1: API de cotação pública"
# "Leia tkb-tech/CLAUDE.md e rode o workflow: fluxo-api"
# "Leia tkb-tech/CLAUDE.md e revise a Edge Function get-otc-quote"
```

## Regras do Squad
- Toda mudança em Edge Functions deve ter validação de input
- Nunca expor chaves de API no frontend
- Toda nova rota de API deve ter autenticação
- Sempre atualizar as migrations quando mudar o schema
- Testar localmente com `supabase functions serve` antes do deploy
