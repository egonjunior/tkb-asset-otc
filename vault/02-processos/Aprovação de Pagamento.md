---
title: Aprovação de Pagamento
tags: [processo, aprovacao, pix, pagamento]
---

# Aprovação de Pagamento

---

## Fluxo Atual (Manual)

1. Cliente realiza PIX ou transferência
2. Faz upload do comprovante na plataforma
3. Analista TKB recebe alerta
4. Verifica: valor ✓, titular ✓, data ✓
5. Aprova manualmente no painel
6. Dispara envio ao OKX

> [!warning] Gargalo
> Aprovação manual é o principal limitador de escala. SLA interno: 30min. Na prática, depende de disponibilidade da equipe.

## Fluxo Alvo (Automático)

1. Cliente realiza PIX
2. Webhook bancário notifica sistema em tempo real
3. Sistema faz matching: valor = valor_travado ± tolerância
4. Se match → aprovação automática
5. Dispara envio OKX sem intervenção humana

### Requisitos para Automação
- [ ] Conta bancária com suporte a webhooks PIX (ex: Celcoin, BMP, Fitbank)
- [ ] Tolerância de valor configurável (ex: ±0.5%)
- [ ] Fallback manual para casos de divergência
- [ ] Log de auditoria completo

## Casos Especiais

| Situação | Ação |
|---|---|
| Valor divergente | Fila de revisão manual |
| PIX de terceiro | Bloqueado — requer análise compliance |
| Comprovante suspeito | Escalado para [[01-squads/TKB Legal]] |
| Timeout sem pagamento | Cotação expirada automaticamente |

## Links

- [[Fluxo OTC Completo]]
- [[Envio ao Provedor OKX]]

