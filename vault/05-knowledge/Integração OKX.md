---
title: Integração OKX
tags: [knowledge, tech, okx, provedor]
---

# Integração OKX

---

## O que é

OKX é a exchange que atua como provedor de liquidez USDT da TKB. A plataforma usa a API OKX para:
- Consultar preço de mercado USDT/BRL
- Executar saques (envio de USDT ao cliente)

## Edge Function

`supabase/functions/okx-operations/` — toda comunicação com OKX passa aqui.

## Operações Suportadas

| Operação | Método OKX API |
|---|---|
| Consultar preço spot | `GET /api/v5/market/ticker` |
| Consultar saldo | `GET /api/v5/asset/balances` |
| Solicitar retirada | `POST /api/v5/asset/withdrawal` |
| Verificar status | `GET /api/v5/asset/deposit-withdraw-status` |

## Configuração

> [!warning] Segurança
> API Key, Secret e Passphrase armazenados como variáveis de ambiente no Supabase. **Nunca** colocar no código.

```
OKX_API_KEY=...
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...
```

## Redes de Saque

| Rede | Chain | Confirmações |
|---|---|---|
| TRC-20 | TRON | 1 (rápido) |
| ERC-20 | Ethereum | 12 (~5 min) |
| BEP-20 | BSC | 15 (~1 min) |

## Limites e Rate Limits

- Rate limit OKX: 6 req/s por endpoint
- Mínimo de saque USDT: verificar documentação OKX atual

## Links

- [[02-processos/Envio ao Provedor OKX]]
- [[05-knowledge/Arquitetura da Plataforma]]

