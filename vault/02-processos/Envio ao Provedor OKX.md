---
title: Envio ao Provedor OKX
tags: [processo, okx, liquidacao, usdt]
---

# Envio ao Provedor OKX

---

## Visão Geral

Após aprovação do pagamento, a Edge Function `okx-operations` processa o envio do USDT ao cliente via OKX.

## Etapas Técnicas

1. Aprovação dispara evento no Supabase
2. `okx-operations` recebe payload com:
   - Wallet destino do cliente
   - Valor em USDT
   - ID da cotação travada
3. Chama API OKX → ordem de retirada
4. OKX processa e envia USDT on-chain
5. Status atualizado no banco: `COMPLETED`
6. Cliente notificado (email/push)

## Redes Suportadas

| Rede | Prazo | Custo |
|---|---|---|
| TRC-20 (TRON) | ~1 min | Baixo |
| ERC-20 (Ethereum) | ~5 min | Alto |
| BEP-20 (BSC) | ~1 min | Baixo |

> [!tip] Padrão
> TRC-20 é o padrão para a maioria das operações por custo e velocidade.

## Tratamento de Erros

| Erro | Ação |
|---|---|
| Saldo insuficiente OKX | Alerta imediato para equipe |
| Wallet inválida | Bloquear antes do envio (validação no onboarding) |
| Timeout OKX | Retry automático 3x, depois escalar |
| Rede congestionada | Aguardar e monitorar, notificar cliente |

## Links

- [[05-knowledge/Integração OKX]]
- [[Aprovação de Pagamento]]
- [[Fluxo OTC Completo]]

