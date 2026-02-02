
# Clientes Recorrentes OKX - Sistema de Relatórios

## Objetivo

Criar uma nova aba "Clientes Recorrentes" na página de Operações OKX que permite:
- Cadastrar clientes com múltiplas carteiras (diferentes redes)
- Gerar relatórios de saques por cliente em períodos específicos (ex: "Janeiro 2026")
- Facilitar a apresentação de relatórios mensais para clientes recorrentes

---

## Estrutura Visual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Operações OKX                                            [Aliases]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┬────────────┐ │
│  │ Depósitos BRL│ Compras USDT │ Saques USDT  │ Crescimento  │ CLIENTES   │ │
│  │              │              │              │              │ RECORRENTES│ │
│  └──────────────┴──────────────┴──────────────┴──────────────┴────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [+ Adicionar Cliente]                                                   ││
│  │                                                                         ││
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             ││
│  │ │ 🏢 Virtual Pay  │ │ 🏢 Marcha Pay   │ │ 🏢 Black Hole   │             ││
│  │ │ 2 carteiras     │ │ 1 carteira      │ │ 1 carteira      │             ││
│  │ │ [Ver Relatório] │ │ [Ver Relatório] │ │ [Ver Relatório] │             ││
│  │ └─────────────────┘ └─────────────────┘ └─────────────────┘             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

         │
         │ Clica em "Ver Relatório"
         ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Relatório: Virtual Pay                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Período: [ Janeiro 2026 ▼ ]   [Atualizar]   [Exportar Excel]               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ RESUMO DO PERÍODO                                                       ││
│  │ Total Enviado: 125.000,00 USDT | Taxas: 45,00 USDT | Operações: 12      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Carteiras vinculadas:                                                      │
│  • 0x6318...CC9 (ERC20) - 50.000 USDT                                      │
│  • TNkg...ofo (TRC20) - 75.000 USDT                                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐
│  │ Data/Hora        │ Carteira │ Valor       │ Taxa   │ Rede   │ Status    │
│  ├──────────────────┼──────────┼─────────────┼────────┼────────┼───────────│
│  │ 15/01/2026 14:30 │ 0x63...  │ 10.000 USDT │ 3 USDT │ ERC20  │ Concluído │
│  │ 12/01/2026 09:15 │ TNkg...  │ 15.000 USDT │ 1 USDT │ TRC20  │ Concluído │
│  │ 08/01/2026 16:45 │ TNkg...  │ 25.000 USDT │ 1 USDT │ TRC20  │ Concluído │
│  └──────────────────────────────────────────────────────────────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Banco de Dados

### Nova Tabela: `okx_recurring_clients`

Armazena os clientes recorrentes (cada cliente pode ter múltiplas carteiras).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `name` | text | Nome do cliente (ex: "Virtual Pay") |
| `notes` | text | Observações opcionais |
| `created_at` | timestamp | Data criação |
| `updated_at` | timestamp | Data atualização |

### Nova Tabela: `okx_client_wallets`

Relaciona carteiras a clientes (N:1).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `client_id` | uuid | FK para okx_recurring_clients |
| `wallet_address` | text | Endereço da carteira |
| `network` | text | Rede (ERC20, TRC20, etc) |
| `label` | text | Rótulo opcional (ex: "Principal") |
| `created_at` | timestamp | Data criação |

### Migração Inteligente

A migração irá:
1. Criar as novas tabelas
2. **Migrar dados existentes**: Cada alias atual da `okx_wallet_aliases` será convertido em um cliente + carteira
3. Manter compatibilidade com o sistema atual

---

## Componentes a Criar

### 1. Modal: Adicionar/Editar Cliente
`src/components/admin/RecurringClientModal.tsx`

- Campo nome do cliente
- Lista de carteiras com rede e endereço
- Botão para adicionar mais carteiras
- Validação de endereço por rede

### 2. Card do Cliente
`src/components/admin/RecurringClientCard.tsx`

- Nome do cliente
- Número de carteiras
- Botão "Ver Relatório"
- Botões editar/excluir

### 3. Modal: Relatório do Cliente
`src/components/admin/ClientReportModal.tsx`

- Seletor de período (meses disponíveis)
- Resumo com totais
- Tabela de transações filtradas
- Botão exportar Excel

---

## Alterações em Arquivos Existentes

### `src/pages/admin/AdminOkxOperations.tsx`

1. Adicionar nova tab "Clientes Recorrentes" no `TabsList`
2. Criar `TabsContent` com lista de clientes
3. Adicionar estados para gerenciar clientes e modais
4. Implementar funções CRUD para clientes

### `supabase/functions/okx-operations/index.ts`

Sem alterações necessárias - a filtragem por carteira será feita no frontend usando os dados de saques já existentes.

---

## Fluxo de Uso

1. **Admin acessa** aba "Clientes Recorrentes"
2. **Clica em** "+ Adicionar Cliente"
3. **Preenche** nome (ex: "Virtual Pay")
4. **Adiciona carteiras**:
   - Carteira 1: `0x6318...` (ERC20)
   - Carteira 2: `TNkg...` (TRC20)
5. **Salva** o cliente
6. **Clica em** "Ver Relatório" no card do cliente
7. **Seleciona** período: "Janeiro 2026"
8. **Visualiza** todos os saques enviados para as carteiras desse cliente
9. **Exporta** para Excel se necessário

---

## Seletor de Período

O seletor de período terá opções como:
- Janeiro 2026
- Fevereiro 2026
- Últimos 30 dias
- Últimos 90 dias
- Período personalizado

A API já retorna saques com data, então o filtro será aplicado no frontend após carregar os dados.

---

## Exportação Excel

Usando a biblioteca `xlsx` já instalada no projeto, o relatório poderá ser exportado contendo:
- Cabeçalho com nome do cliente e período
- Lista de todas as transações
- Linha de totais

---

## Sequência de Implementação

1. **Migração SQL** - Criar tabelas `okx_recurring_clients` e `okx_client_wallets` com RLS
2. **Migrar dados** - Converter aliases existentes em clientes
3. **Modal de Cliente** - CRUD de clientes com carteiras
4. **Cards de Clientes** - Exibição na nova aba
5. **Modal de Relatório** - Filtro por período e tabela de transações
6. **Exportação Excel** - Botão para gerar planilha
7. **Integração na página** - Nova aba e estados

---

## Detalhes Técnicos

### RLS Policies

Ambas as tabelas terão policies para permitir apenas admins acessarem:
- `SELECT`: admins
- `INSERT`: admins  
- `UPDATE`: admins
- `DELETE`: admins

### Integração com Sistema Atual

O sistema atual de "aliases" continuará funcionando para exibir nomes amigáveis na lista de saques. A nova funcionalidade de "Clientes Recorrentes" é complementar e permite:
- Agrupar múltiplas carteiras por cliente
- Gerar relatórios específicos por período
- Não interfere no funcionamento existente

### Performance

Como a filtragem é feita no frontend:
- Os saques já são carregados na memória
- Filtrar por múltiplas carteiras de um cliente é instantâneo
- Não requer chamadas extras à API OKX
