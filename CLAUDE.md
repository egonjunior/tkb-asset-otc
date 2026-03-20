# TKB Asset OTC — Instruções para Claude

## Stack
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (PostgreSQL + Edge Functions em Deno)
- Deploy: Vercel (auto-deploy via push na `main`)
- Repositório: `egonjunior/tkb-asset-otc`

## Fluxo de Deploy

**Após cada commit e push, sempre criar um Pull Request no GitHub e enviar o link para o usuário.**

```bash
gh pr create --repo egonjunior/tkb-asset-otc \
  --base main \
  --head claude/<branch-name> \
  --title "<título>" \
  --body "<descrição>"
```

O usuário clica no link do PR → faz merge → Vercel sobe automaticamente.

## Branch padrão de desenvolvimento
Sempre desenvolver em `claude/setup-tkb-integration-w84cg` (ou branch informada no início da sessão).

---

## Contexto do Negócio — TKB Asset

**TKB Asset** é uma mesa OTC de USDT. O modelo de negócio:
- Cliente abre conta na plataforma
- Solicita cotação de USDT (BRL → USDT)
- Trava o preço por tempo limitado
- Envia comprovante de pagamento
- TKB verifica o pagamento, aprova a cotação e envia USDT ao cliente via provedor

### Fluxo atual (manual):
`abertura de conta` → `cotação` → `travamento de preço` → `envio de comprovante` → `verificação manual` → `aprovação manual` → `envio ao provedor` → `provedor envia USDT`

### Fluxo alvo (automatizado via API):
`cliente conecta via API` → `cotação automática` → `pagamento PIX/wire detectado automaticamente` → `aprovação automática` → `envio automático ao provedor` → `USDT liberado`

### Arquitetura da plataforma:
- `src/pages/OtcQuote.tsx` — tela de cotação
- `src/pages/TradingOrderPage.tsx` — gestão de pedidos
- `supabase/functions/get-otc-quote/` — preço do USDT
- `supabase/functions/lock-price/` — travamento de cotação
- `supabase/functions/okx-operations/` — integração com provedor OKX

---

## Estrutura de Squads (aios-core)

A TKB opera com 5 squads especializados. Cada squad tem seu próprio CLAUDE.md em `.claude/squads/`.

| Squad | Pasta | Foco |
|-------|-------|------|
| tkb-tech | `.claude/squads/tkb-tech/` | Plataforma OTC, fluxo API, integrações |
| tkb-legal | `.claude/squads/tkb-legal/` | Jurídico, regulação, contratos, compliance |
| tkb-commercial | `.claude/squads/tkb-commercial/` | Prospecção, outreach, CRM, vendas |
| tkb-marketing | `.claude/squads/tkb-marketing/` | Conteúdo, branding, Instagram, copy |
| tkb-strategy | `.claude/squads/tkb-strategy/` | Parcerias, expansão, inteligência de mercado |

### Como chamar um squad:
```
Leia .claude/squads/tkb-tech/CLAUDE.md e execute a tarefa: [descrição]
Leia .claude/squads/tkb-legal/CLAUDE.md e execute a tarefa: [descrição]
```

---

## Regras Globais

1. **Nunca inventar** — seguir sempre o spec da história/tarefa
2. **Cada squad tem autoridade exclusiva** — não misturar responsabilidades
3. **Sempre começar com uma história** — toda mudança parte de um requisito claro
4. **Qualidade não é opcional** — TypeScript estrito, sem `any`, testes nas funções críticas
5. **Imports absolutos** — usar `@/` para imports internos
