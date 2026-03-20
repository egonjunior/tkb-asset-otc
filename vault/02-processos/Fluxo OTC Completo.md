---
title: Fluxo OTC Completo
tags: [processo, otc, fluxo]
aliases: [Fluxo Principal]
---

# Fluxo OTC Completo

> [!info] Versão Atual
> **Fase:** Manual → Semi-automatizado. Lock e cotação automáticos. Aprovação ainda manual.

---

## Fluxo Atual (Manual)

```
1. Abertura de Conta
       ↓
2. Solicitação de Cotação
       ↓
3. Travamento de Preço (tempo limitado)
       ↓
4. Envio de Comprovante pelo Cliente
       ↓
5. Verificação Manual (equipe TKB)
       ↓
6. Aprovação Manual
       ↓
7. Envio ao Provedor OKX
       ↓
8. OKX libera USDT ao cliente
```

## Fluxo Alvo (Automatizado)

```
1. Cliente conecta via API
       ↓
2. Cotação automática (spread em tempo real)
       ↓
3. PIX detectado automaticamente
       ↓
4. Aprovação automática
       ↓
5. Envio automático ao OKX
       ↓
6. USDT liberado
```

## Etapas Detalhadas

### 1. Abertura de Conta
- KYC/AML obrigatório — ver [[01-squads/TKB Legal]]
- Limite operacional definido no onboarding
- Ver [[Onboarding de Cliente]]

### 2. Cotação
- Edge Function `get-otc-quote` retorna preço USDT/BRL
- Spread aplicado sobre cotação de mercado (OKX)
- Validade: configurável (default 5 min)

### 3. Travamento de Preço
- Edge Function `lock-price` registra cotação travada
- Timer inicia — expiração cancela o pedido
- Cliente vê countdown na interface

### 4. Comprovante / PIX
- Atual: upload manual de comprovante
- Alvo: webhook PIX via parceiro bancário

### 5. Verificação e Aprovação
- Atual: analista verifica manualmente
- Alvo: matching automático valor + chave PIX

### 6. Liquidação via OKX
- `okx-operations` Edge Function processa envio
- USDT enviado para wallet do cliente

---

## SLAs Internos

| Etapa | Meta |
|---|---|
| Cotação | < 1s |
| Lock confirmado | < 2s |
| Aprovação (manual) | < 30min |
| Liquidação OKX | < 5min |

## Links Relacionados

- [[05-knowledge/Integração OKX]]
- [[05-knowledge/Supabase Edge Functions]]
- [[Cotação e Travamento de Preço]]
- [[Aprovação de Pagamento]]
- [[Envio ao Provedor OKX]]

