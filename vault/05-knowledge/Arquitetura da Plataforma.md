---
title: Arquitetura da Plataforma
tags: [knowledge, tech, arquitetura]
---

# Arquitetura da Plataforma

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind + shadcn/ui |
| Backend | Supabase (PostgreSQL + Edge Functions em Deno) |
| Deploy | Vercel (auto-deploy via push na `main`) |
| Provedor | OKX API |
| Repositório | `egonjunior/tkb-asset-otc` |

## Diagrama Simplificado

```
Browser (React/Vite)
       ↓
  Vercel CDN
       ↓
Supabase (Auth + DB)
       ↓
Edge Functions (Deno)
       ↓
   OKX API
```

## Páginas Principais

| Rota | Arquivo | Função |
|---|---|---|
| `/quote` | `src/pages/OtcQuote.tsx` | Cotação de USDT |
| `/orders` | `src/pages/TradingOrderPage.tsx` | Gestão de pedidos |

## Edge Functions

| Função | Endpoint | Responsabilidade |
|---|---|---|
| `get-otc-quote` | `/functions/v1/get-otc-quote` | Buscar cotação USDT/BRL |
| `lock-price` | `/functions/v1/lock-price` | Travar cotação |
| `okx-operations` | `/functions/v1/okx-operations` | Operar com OKX |

## Banco de Dados

- **PostgreSQL** via Supabase
- Row Level Security (RLS) habilitado
- Auth integrado (Supabase Auth)

## Deploy

- Push na `main` → Vercel detecta → build automático → produção
- Branch `claude/*` → desenvolvimento e PRs

## Links

- [[05-knowledge/Supabase Edge Functions]]
- [[05-knowledge/Integração OKX]]
- [[04-estrategia/Roadmap da Plataforma]]

