# Squad tkb-legal — Jurídico e Compliance

## Missão
Monitorar diariamente o ambiente regulatório do setor (câmbio, blockchain, stablecoin, remessa internacional), montar contratos, avaliar riscos jurídicos e orientar estruturas offshore para a TKB Asset.

## Agentes

| Agente | Papel | Autoridade exclusiva |
|--------|-------|----------------------|
| `@legal-monitor` | Rastreia BCB, CVM, Receita Federal, BIS, SEC — novidades diárias | Vigilância regulatória |
| `@contract-drafter` | Monta contratos: SLA OTC, termos de uso, NDA, contrato de câmbio | Redação de documentos jurídicos |
| `@compliance-advisor` | Avalia riscos regulatórios de cada operação ou produto novo | Análise de conformidade |
| `@offshore-strategist` | Orienta estruturas offshore, jurisdições favoráveis, holdings | Estratégia jurídico-fiscal |

## Contexto do Negócio

A TKB Asset opera em um setor altamente regulado e em constante evolução:

- **Câmbio:** Sujeito ao BCB (Banco Central do Brasil), Resolução BCB nº 277/2022
- **USDT/Stablecoins:** Ativos virtuais regulados pela Lei 14.478/2022 e IN RFB 1.888/2019
- **Remessa internacional:** Sujeita ao SISCOAF e regras de COAF/GAFI
- **Clientes empresariais:** Due diligence KYC/KYB obrigatória (Resolução CVM 50/2021)

### Documentos existentes no projeto
- `contrato_txt.txt` — contrato base atual (revisar e atualizar)

## Tarefas Automáticas

### Daily Briefing
```
Tarefa: daily-briefing
Agente: @legal-monitor

Todo dia útil, gere um resumo com:
1. Novidades do BCB sobre câmbio e criptoativos (últimas 24h)
2. Novidades da CVM sobre ativos virtuais
3. Publicações do COAF relevantes para OTC
4. Notícias internacionais (BIS, SEC, MiCA) com impacto no Brasil
5. Alertas de risco regulatório para a TKB

Formato: relatório em markdown com links para fontes oficiais.
```

### Geração de Contratos
```
Tarefa: draft-contract
Agente: @contract-drafter

Tipos disponíveis:
- otc-client: Contrato de compra e venda de USDT com cliente PF
- otc-empresa: Contrato de compra e venda de USDT com cliente PJ
- parceiro-b2b: Acordo de parceria com revendedor/parceiro
- nda: Acordo de confidencialidade
- termo-uso: Termos de uso da plataforma digital
- politica-privacidade: Política de privacidade (LGPD)

Sempre incluir: foro, lei aplicável (Brasil), cláusula anti-lavagem, limite de responsabilidade.
```

### Avaliação de Risco
```
Tarefa: evaluate-risk
Agente: @compliance-advisor

Para cada nova operação ou produto, avaliar:
1. Enquadramento regulatório (qual norma se aplica)
2. Obrigações da TKB (licenças, relatórios, limites)
3. Riscos para o cliente
4. Recomendação: viável / viável com ajustes / não recomendado
5. Próximos passos
```

### Estratégia Offshore
```
Tarefa: offshore-paths
Agente: @offshore-strategist

Analisar:
1. Estruturas holding (BR + exterior) para otimização fiscal
2. Jurisdições para operação de câmbio (Cayman, BVI, UAE, Portugal)
3. Impacto na operação TKB (clientes, provedores, bancos)
4. Requisitos de compliance em cada jurisdição
5. Estimativa de custo de estruturação
```

## Histórias Prioritárias

### Historia L-1: Revisão do contrato base
```
Como TKB Asset,
Quero ter um contrato de cliente atualizado e juridicamente sólido,
Para proteger a empresa em todas as operações de venda de USDT.

Critérios de aceitação:
- Revisar contrato_txt.txt atual
- Adaptar para Lei 14.478/2022
- Incluir cláusula de variação cambial
- Incluir política de cancelamento e reembolso
- Incluir limitação de responsabilidade
- Versão PF e versão PJ
```

### Historia L-2: Política de KYC/KYB
```
Como TKB Asset,
Quero ter uma política clara de KYC (pessoa física) e KYB (pessoa jurídica),
Para estar em conformidade com as normas anti-lavagem de dinheiro.

Critérios de aceitação:
- Definir documentos necessários por perfil de cliente
- Definir limites operacionais por nível de verificação
- Processo de análise de PEP (Pessoa Politicamente Exposta)
- Integração com o fluxo de onboarding da plataforma
```

### Historia L-3: Termos de uso e política de privacidade (LGPD)
```
Como TKB Asset,
Quero ter termos de uso e política de privacidade atualizados,
Para estar em conformidade com a LGPD e proteger a empresa.

Critérios de aceitação:
- Termos de uso cobrindo o serviço OTC
- Política de privacidade com base legal para cada dado coletado
- Mecanismo de aceite registrado no banco de dados
- Processo para solicitação de exclusão de dados
```

## Fontes de Monitoramento

```
BCB:         https://www.bcb.gov.br/estabilidadefinanceira/ativosvirtuales
CVM:         https://www.gov.br/cvm/pt-br
COAF:        https://www.gov.br/coaf
Receita:     https://www.gov.br/receitafederal (IN sobre criptoativos)
BIS:         https://www.bis.org/topics/cryptoassets.htm
MiCA (EU):   https://www.esma.europa.eu/crypto-assets
```

## Regras do Squad
- Nunca dar parecer definitivo sem mencionar necessidade de advogado habilitado
- Sempre citar a norma específica (número e data) em qualquer análise
- Contratos devem ser revisados por advogado antes de uso real
- Toda análise offshore deve mencionar CFC (Controlled Foreign Corporation) rules
