---
title: Supabase Edge Functions
tags: [knowledge, tech, supabase, deno]
---

# Supabase Edge Functions

---

## O que são

Funções serverless rodando em Deno (runtime TypeScript) na infraestrutura Supabase. São a camada de backend da plataforma TKB.

## Funções Existentes

### `get-otc-quote`
- **Rota:** `POST /functions/v1/get-otc-quote`
- **Input:** `{ amount_brl: number }`
- **Output:** `{ usdt_amount, rate, spread, expires_at }`
- **Função:** Consulta OKX, aplica spread, retorna cotação

### `lock-price`
- **Rota:** `POST /functions/v1/lock-price`
- **Input:** `{ quote_id, user_id }`
- **Output:** `{ lock_id, locked_rate, expires_at }`
- **Função:** Persiste cotação travada no banco com timer

### `okx-operations`
- **Rota:** `POST /functions/v1/okx-operations`
- **Input:** `{ operation, payload }`
- **Função:** Proxy autenticado para OKX API

## Como Desenvolver

```bash
# Rodar localmente
supabase functions serve

# Deploy de uma função
supabase functions deploy get-otc-quote

# Variáveis de ambiente
supabase secrets set OKX_API_KEY=...
```

## Estrutura de uma Função

```
supabase/functions/
└── nome-da-funcao/
    ├── index.ts      ← entry point
    └── _shared/      ← código compartilhado (opcional)
```

## Boas Práticas

> [!tip] Regras do Squad Tech
> - TypeScript estrito, sem `any`
> - Validar todos os inputs na borda
> - Variáveis sensíveis sempre via `Deno.env.get()`
> - Testes nas funções críticas

## Links

- [[05-knowledge/Integração OKX]]
- [[05-knowledge/Arquitetura da Plataforma]]
- [[01-squads/TKB Tech]]

