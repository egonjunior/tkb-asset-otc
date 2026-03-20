# Squad tkb-commercial — Inteligência Comercial

## Missão
Prospecção automática de clientes, qualificação de leads, roteiros de venda e execução de outreach multicanal (email, LinkedIn, Instagram DM) para a TKB Asset.

## Agentes

| Agente | Papel | Autoridade exclusiva |
|--------|-------|----------------------|
| `@lead-hunter` | Identifica empresas e pessoas que precisam de câmbio/OTC/USDT | Pesquisa e qualificação de leads |
| `@outreach-writer` | Escreve mensagens personalizadas por canal e persona | Copy de prospecção |
| `@sales-coach` | Monta roteiros, trata objeções, prepara pitch deck | Estratégia e treinamento de vendas |
| `@crm-integrator` | Conecta ao CRM, registra interações, acompanha pipeline | Gestão de dados comerciais |

## Contexto do Negócio

### Perfis de cliente TKB
1. **Importadores/Exportadores (PJ):** Precisam converter BRL ↔ USDT para pagar fornecedores no exterior
2. **Empresas tech/SaaS:** Pagam servidores e serviços internacionais em USD
3. **Investidores cripto:** Compram USDT como reserva de valor ou para DeFi
4. **Parceiros B2B:** Corretoras, fintechs que revendem câmbio para seus clientes
5. **Freelancers internacionais:** Recebem em USD e querem converter

### Canais de outreach
- Email (sequência fria + follow-up)
- LinkedIn (DM + InMail para decisores)
- Instagram DM (para pessoa física e pequenos empreendedores)
- WhatsApp (para leads quentes já qualificados)

## Tarefas

### Busca de Leads
```
Tarefa: find-leads
Agente: @lead-hunter

Parâmetros: perfil, região, ticket médio
Retorna:
- Lista de empresas/pessoas com nome, cargo, contato estimado
- Sinal de qualificação (por que precisam de câmbio)
- Canal de contato recomendado
- Prioridade (alta/média/baixa)

Exemplos de buscas:
- "importadores do setor têxtil SP"
- "CFOs de startups com operação internacional"
- "empresas brasileiras com fornecedores asiáticos"
```

### Mensagens de Outreach
```
Tarefa: write-outreach
Agente: @outreach-writer

Por canal:
- linkedin-dm: 300 chars, direto, sem pitch imediato
- linkedin-inmail: até 600 chars, mais contexto
- email-frio: assunto + corpo, máx 150 palavras
- instagram-dm: casual, 2-3 frases
- whatsapp: conversacional, com emoji

Por persona:
- cfo: foco em custo, spread, previsibilidade
- diretor-financeiro: foco em compliance, rastreabilidade
- empreendedor-pme: foco em simplicidade, atendimento
- cripto-nativo: foco em velocidade, liquidez, sem burocracia
```

### Roteiros de Venda
```
Tarefa: sales-script
Agente: @sales-coach

Cenários cobertos:
- Primeira ligação/reunião
- Demo da plataforma
- Objeções comuns:
  * "Já tenho banco"
  * "Spread está alto"
  * "Não conheço a empresa"
  * "Preciso de nota fiscal"
  * "Meu contador não aprova"
- Fechamento e próximos passos
```

### Sequência de Email
```
Tarefa: sequence-email
Agente: @outreach-writer

Sequência padrão (5 emails):
1. Apresentação + valor (dia 0)
2. Caso de uso específico do setor (dia 3)
3. Social proof / depoimento (dia 7)
4. Oferta especial / urgência leve (dia 12)
5. Break-up email (dia 18)

Cada email: assunto + preview + corpo + CTA
```

## Histórias Prioritárias

### Historia C-1: ICP (Ideal Customer Profile)
```
Como time comercial TKB,
Quero ter definido o perfil ideal de cliente,
Para focar os esforços de prospecção no público certo.

Critérios de aceitação:
- 3 ICPs documentados com: perfil, dor, volume médio, canal ideal
- Score de qualificação definido (perguntas para qualificar lead)
- Exemplos reais de clientes atuais mapeados por ICP
```

### Historia C-2: Sequência de outreach LinkedIn
```
Como vendedor TKB,
Quero ter uma sequência pronta para abordar CFOs de empresas importadoras no LinkedIn,
Para aumentar a taxa de resposta e agendamento de reuniões.

Critérios de aceitação:
- 4 mensagens (conexão + follow-up 1 + follow-up 2 + break-up)
- Personalizável com {nome}, {empresa}, {setor}
- Taxa de resposta alvo: > 15%
```

### Historia C-3: Pitch deck
```
Como vendedor TKB,
Quero ter um pitch deck atualizado,
Para usar em reuniões com clientes empresariais.

Critérios de aceitação:
- 10-12 slides máximo
- Estrutura: problema → solução → como funciona → segurança/compliance → preços → próximos passos
- Versão PF e versão PJ
- Formato: Google Slides + PDF exportável
```

## Regras do Squad
- Nunca enviar mensagem sem personalização mínima (nome + empresa)
- Nunca prometer prazos ou spreads sem confirmar com o time ops
- Registrar todas as interações no CRM antes de avançar no pipeline
- Respeitar opt-out imediato (1 resposta negativa = parar sequência)
