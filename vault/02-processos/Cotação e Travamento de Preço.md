---
title: Cotação e Travamento de Preço
tags: [processo, cotacao, lock, pricing]
---

# Cotação e Travamento de Preço

---

## Como Funciona

### Cotação
1. Cliente acessa `OtcQuote.tsx`
2. Informa valor em BRL
3. Edge Function `get-otc-quote` consulta preço OKX em tempo real
4. Aplica spread TKB
5. Retorna: USDT equivalente + taxa + prazo de validade

### Travamento (Lock)
1. Cliente confirma cotação
2. `lock-price` registra no banco com timestamp
3. Timer visível na UI (countdown)
4. Se expirar → cotação cancelada, cliente precisa solicitar nova

## Lógica de Spread

> [!note] Confidencial
> Spread varia por volume e perfil de cliente. Não documentar valores aqui — manter no sistema de configuração interno.

| Volume (USDT) | Spread Base |
|---|---|
| < 10k | Tabela A |
| 10k – 100k | Tabela B |
| > 100k | Negociado |

## Expiração e Timeout

- Tempo padrão de lock: **5 minutos**
- Configurável por perfil de cliente
- Pedidos expirados: status `EXPIRED` no banco

## Links

- [[05-knowledge/Supabase Edge Functions]]
- [[Fluxo OTC Completo]]

