# meeting

Convoca uma reunião com agentes específicos dos squads TKB Asset. Lê os CLAUDE.md dos squads selecionados e opera com todos os agentes ao mesmo tempo.

## Como usar

```
/meeting @otc-dev @otc-architect
/meeting @lead-hunter @outreach-writer
/meeting @market-intelligence @expansion-advisor @legal-monitor
/meeting all
```

## Agentes disponíveis por squad

### tkb-tech
- `@otc-architect` — Arquitetura, design de integrações, webhooks
- `@otc-dev` — Frontend e Edge Functions
- `@otc-qa` — Testes e critérios de aceitação
- `@otc-devops` — Deploy, CI/CD, infraestrutura

### tkb-commercial
- `@lead-hunter` — Prospecção e qualificação de leads
- `@outreach-writer` — Copy de prospecção multicanal
- `@sales-coach` — Roteiros, pitch, tratamento de objeções
- `@crm-integrator` — Gestão de pipeline e CRM

### tkb-marketing
- `@content-strategist` — Pauta e calendário editorial
- `@copywriter` — Textos, legendas, scripts
- `@designer-brief` — Briefings visuais
- `@webdesigner` — Site e landing pages
- `@brand-guardian` — Identidade visual e voz da marca

### tkb-legal
- `@legal-monitor` — Regulação BCB, CVM, Receita Federal
- `@contract-drafter` — Contratos, termos de uso, NDA
- `@compliance-advisor` — Riscos regulatórios
- `@offshore-strategist` — Estruturas jurídico-fiscais

### tkb-strategy
- `@market-intelligence` — Inteligência competitiva
- `@partnership-scout` — Parcerias estratégicas
- `@event-strategist` — Eventos e networking
- `@expansion-advisor` — Novos mercados e produtos

---

## INSTRUÇÕES DE ATIVAÇÃO

Quando este comando for executado com agentes específicos (ex: `/meeting @otc-dev @sales-coach`):

1. **Identifique os squads** dos agentes mencionados
2. **Leia os CLAUDE.md** de cada squad envolvido em `.claude/squads/<squad>/CLAUDE.md`
3. **Apresente os participantes da reunião:**

```
🤝 REUNIÃO TKB ASSET — [DATA]
Participantes: @agente1 (squad), @agente2 (squad), ...
Pauta: [resumo do que o usuário quer discutir]
```

4. **Opere respondendo na voz de cada agente relevante**, prefixando com `[@nome-do-agente]:` quando houver contribuições distintas
5. **Coordene as perspectivas** — cada agente fala dentro da sua autoridade exclusiva, sem invadir responsabilidades dos outros
6. **Ao final**, proponha próximos passos com responsável por agente

Se `/meeting all` — convoca um representante de cada squad (otc-architect, lead-hunter, content-strategist, legal-monitor, market-intelligence).

Se o usuário não especificar agentes, pergunte quais quer convocar mostrando a lista completa.
