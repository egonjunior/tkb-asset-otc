---
title: TKB Tech
tags: [squad, tech]
aliases: [Squad Tech, tkb-tech]
squad: tkb-tech
---

# TKB Tech

> [!abstract] Missão do Squad
> Construir e manter a plataforma OTC — da cotação à entrega do USDT. Responsável por integrações, automação e infraestrutura.

---

## Responsabilidades

- Plataforma OTC (React + Vite + TypeScript)
- Edge Functions no Supabase (Deno)
- Integração com provedor [[05-knowledge/Integração OKX|OKX]]
- Automação do fluxo: PIX detection → aprovação automática
- Deploy via Vercel + CI/CD

## Arquivos-chave da Plataforma

| Arquivo | Função |
|---|---|
| `src/pages/OtcQuote.tsx` | Tela de cotação |
| `src/pages/TradingOrderPage.tsx` | Gestão de pedidos |
| `supabase/functions/get-otc-quote/` | Preço do USDT |
| `supabase/functions/lock-price/` | Travamento de cotação |
| `supabase/functions/okx-operations/` | Integração OKX |

## Roadmap Técnico

- [x] Cotação e travamento de preço
- [ ] Detecção automática de PIX
- [ ] Aprovação automática
- [ ] Envio automático ao provedor
- [ ] API pública para clientes conectarem via sistema

## Links

- [[02-processos/Fluxo OTC Completo]]
- [[05-knowledge/Arquitetura da Plataforma]]
- [[05-knowledge/Supabase Edge Functions]]
- [[05-knowledge/Integração OKX]]

