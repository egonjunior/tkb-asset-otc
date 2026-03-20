---
title: Home — Mente TKB
tags: [home, dashboard]
aliases: [Dashboard, Início]
---

# TKB Asset — Mente Operacional

> [!quote] Missão
> Mesa OTC de USDT: o caminho mais direto entre reais e liquidez cripto para quem realmente opera.

---

## Navegação Rápida

### Squads
| Squad | Foco |
|---|---|
| [[01-squads/TKB Tech\|TKB Tech]] | Plataforma, API, integrações |
| [[01-squads/TKB Legal\|TKB Legal]] | Jurídico, compliance, contratos |
| [[01-squads/TKB Commercial\|TKB Commercial]] | Vendas, CRM, prospecção |
| [[01-squads/TKB Marketing\|TKB Marketing]] | Conteúdo, branding, Instagram |
| [[01-squads/TKB Strategy\|TKB Strategy]] | Parcerias, expansão, mercado |

### Processos Core
- [[02-processos/Fluxo OTC Completo]] — do cadastro ao USDT entregue
- [[02-processos/Onboarding de Cliente]] — etapas de abertura de conta
- [[02-processos/Cotação e Travamento de Preço]] — lógica de lock
- [[02-processos/Aprovação de Pagamento]] — verificação e liberação
- [[02-processos/Envio ao Provedor OKX]] — integração e liquidação

### Estratégia
- [[04-estrategia/Tese de Mercado OTC]]
- [[04-estrategia/Pipeline de Parcerias]]
- [[04-estrategia/Roadmap da Plataforma]]

### Knowledge Base
- [[05-knowledge/Arquitetura da Plataforma]]
- [[05-knowledge/Integração OKX]]
- [[05-knowledge/Supabase Edge Functions]]

---

## Status da Plataforma

> [!info] Fase Atual
> **Manual → Semi-automatizado**
> Fluxo de cotação e lock funcionando. Aprovação ainda manual. Meta: automação via PIX detection + aprovação automática.

```dataview
TABLE status, squad, updated
FROM #tarefa
SORT updated DESC
LIMIT 10
```

---

## Inbox

> [!tip] Como usar
> Jogue ideias, links e capturas rápidas em [[00-inbox/Inbox]]. Processe semanalmente.

