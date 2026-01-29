

# Plano: Sistema de Notas Operacionais

Sistema completo para usuários solicitarem Notas Operacionais de suas operações, com aprovação administrativa e geração automática de PDF executivo com identidade TKB.

---

## Fluxo Visual

```text
USUÁRIO                                    ADMINISTRADOR
   │                                            │
   ▼                                            │
┌──────────────────┐                            │
│ Dashboard        │                            │
│ [Solicitar Nota] │                            │
└────────┬─────────┘                            │
         │                                      │
         ▼                                      │
┌──────────────────────────────────────┐        │
│ Modal Multi-Etapas                   │        │
│ ┌──────────────────────────────────┐ │        │
│ │ 1. Tipo de Operação              │ │        │
│ │ ○ BRL → USDT                     │ │        │
│ │ ○ USDT → BRL                     │ │        │
│ │ ○ USDT → USD (Remessa)           │ │        │
│ └──────────────────────────────────┘ │        │
│                                      │        │
│ ┌──────────────────────────────────┐ │        │
│ │ 2. Valores Negociados            │ │        │
│ │ Depositou: [____] BRL            │ │        │
│ │ Comprou:   [____] USDT           │ │        │
│ └──────────────────────────────────┘ │        │
│                                      │        │
│ ┌──────────────────────────────────┐ │        │
│ │ 3. Data da Operação              │ │        │
│ │ [📅 Calendário]                  │ │        │
│ └──────────────────────────────────┘ │        │
│                                      │        │
│ ┌──────────────────────────────────┐ │        │
│ │ 4. Dados Bancários*              │ │        │
│ │ (apenas USDT→BRL ou USDT→USD)   │ │        │
│ └──────────────────────────────────┘ │        │
│                                      │        │
│ ┌──────────────────────────────────┐ │        │
│ │ 5. Confirmação                   │ │        │
│ │ [Enviar para Aprovação]          │ │        │
│ └──────────────────────────────────┘ │        │
└──────────────────────────────────────┘        │
         │                                      │
         ▼                                      ▼
┌──────────────────┐               ┌────────────────────────┐
│ Status: Pendente │               │ Dashboard Admin        │
│ (aguardando)     │               │ [🔔 X Notas Pendentes] │
└────────┬─────────┘               └───────────┬────────────┘
         │                                     │
         │                                     ▼
         │                         ┌────────────────────────┐
         │                         │ Página Admin Notas     │
         │                         │ Lista + Ações          │
         │                         │ [Aprovar] [Rejeitar]   │
         │                         └───────────┬────────────┘
         │                                     │
         │◄────────────────────────────────────┘
         │              (Admin aprova)
         ▼
┌──────────────────┐
│ Status: Aprovada │
│ [📥 Baixar PDF]  │◄── PDF gerado automaticamente
└──────────────────┘
```

---

## Campos de Dados Bancários por Tipo de Operação

### USDT → BRL (dados da conta que recebeu)
- Banco
- Agência
- Conta
- Tipo de Conta (Corrente/Poupança)
- Titular da Conta
- CPF/CNPJ do Titular

### USDT → USD Remessa Internacional
- Nome do Banco
- Endereço do Banco
- SWIFT/BIC Code
- Account Number
- Routing Number / Wire Number
- Nome do Beneficiário
- Endereço do Beneficiário

---

## Estrutura do Banco de Dados

### Tabela: `operational_notes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK auto-gerado |
| `note_number` | text | Número sequencial TKB-NO-YYYY-XXX |
| `user_id` | uuid | FK para profiles |
| `operation_type` | text | 'brl_to_usdt', 'usdt_to_brl', 'usdt_to_usd_remessa' |
| `deposited_amount` | numeric | Valor depositado |
| `purchased_amount` | numeric | Quantia comprada |
| `currency_deposited` | text | Moeda depositada |
| `currency_purchased` | text | Moeda comprada |
| `operation_date` | date | Data da operação |
| `bank_details` | jsonb | Dados bancários (estrutura varia por tipo) |
| `status` | text | 'pending', 'approved', 'rejected' |
| `rejection_reason` | text | Motivo se rejeitado |
| `pdf_url` | text | URL do PDF após aprovação |
| `verification_code` | text | Código único de verificação |
| `reviewed_by` | uuid | Admin que revisou |
| `reviewed_at` | timestamp | Data/hora da revisão |
| `created_at` | timestamp | Data criação |

### RLS Policies
- Usuários: INSERT e SELECT próprios registros
- Admins: SELECT e UPDATE todos os registros

---

## Arquivos a Criar

### 1. `src/components/operational-notes/OperationalNoteModal.tsx`
Modal multi-etapas com:
- Tab 1: Seleção do tipo de operação (radio buttons)
- Tab 2: Valores (inputs numéricos dinâmicos)
- Tab 3: Data (Datepicker)
- Tab 4: Dados Bancários (condicional - aparece apenas para USDT→BRL ou USDT→USD)
- Tab 5: Confirmação final + botão enviar

### 2. `src/components/operational-notes/OperationalNotesList.tsx`
Lista de notas do usuário no Dashboard:
- Status com badges coloridos
- Botão download PDF (quando aprovada)
- Data de criação

### 3. `src/pages/admin/AdminOperationalNotes.tsx`
Página administrativa com:
- Tabela de todas as solicitações
- Filtros por status
- Ações de aprovar/rejeitar
- Visualização dos detalhes

### 4. `src/components/admin/OperationalNoteReviewModal.tsx`
Modal para admin revisar:
- Dados do cliente
- Detalhes da operação
- Dados bancários
- Botões Aprovar/Rejeitar (com campo de motivo)

### 5. `src/lib/generateOperationalNotePDF.ts`
Gerador de PDF executivo usando jsPDF:
- Header com logo TKB
- Dados do cliente
- Detalhes da operação
- Dados bancários (quando aplicável)
- Selo de aprovação visual
- Código de verificação
- Assinatura digital do admin

---

## Arquivos a Modificar

### 1. `src/pages/Dashboard.tsx`
- Adicionar botão "Solicitar Nota Operacional"
- Adicionar seção "Minhas Notas Operacionais"

### 2. `src/pages/admin/AdminDashboard.tsx`
- Adicionar card de notificação de notas pendentes

### 3. `src/components/AppSidebar.tsx`
- Adicionar link "Notas Operacionais" no menu lateral

### 4. `src/App.tsx`
- Adicionar rota `/admin/operational-notes`

---

## Design do PDF Executivo

```text
┌──────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                                          │
│   TKB ASSET                    NOTA OPERACIONAL          │
│   Mesa OTC                     Nº TKB-NO-2026-0001       │
│                                                          │
│   ════════════════════════════════════════════════════   │
│                                                          │
│   ┌────────────────────────────────────────────────┐     │
│   │  DADOS DO CLIENTE                              │     │
│   │  Nome: João da Silva                           │     │
│   │  CPF: 123.456.789-00                           │     │
│   │  Email: joao@email.com                         │     │
│   └────────────────────────────────────────────────┘     │
│                                                          │
│   ┌────────────────────────────────────────────────┐     │
│   │  DETALHES DA OPERAÇÃO                          │     │
│   │                                                │     │
│   │  Tipo: BRL → USDT                              │     │
│   │  Data: 15 de Janeiro de 2026                   │     │
│   │                                                │     │
│   │  ┌─────────────────┐  ┌─────────────────┐      │     │
│   │  │ DEPOSITOU       │  │ ADQUIRIU        │      │     │
│   │  │ R$ 50.000,00    │  │ 9.259,26 USDT   │      │     │
│   │  └─────────────────┘  └─────────────────┘      │     │
│   │                                                │     │
│   │  Cotação: R$ 5,4000 / USDT                     │     │
│   └────────────────────────────────────────────────┘     │
│                                                          │
│   ┌────────────────────────────────────────────────┐     │
│   │  DADOS BANCÁRIOS DO RECEBIMENTO (se aplicável) │     │
│   │  Banco: Bradesco                               │     │
│   │  Agência: 1234                                 │     │
│   │  Conta: 12345-6                                │     │
│   │  Titular: João da Silva                        │     │
│   └────────────────────────────────────────────────┘     │
│                                                          │
│          ╔══════════════════════════════════╗            │
│          ║   ✓  OPERAÇÃO VERIFICADA         ║            │
│          ║                                  ║            │
│          ║   Aprovado por: Admin TKB        ║            │
│          ║   Data: 16/01/2026 14:30         ║            │
│          ║                                  ║            │
│          ║   Código: TKB-VRF-XXXXXXXX       ║            │
│          ╚══════════════════════════════════╝            │
│                                                          │
│   ────────────────────────────────────────────────────   │
│   TKB Asset © 2026 | CNPJ: XX.XXX.XXX/0001-XX           │
│   Documento gerado em: 16/01/2026 às 14:30:00           │
└──────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Tipos de Operação e Labels

| Tipo | Label | Moeda Depositada | Moeda Comprada | Dados Bancários |
|------|-------|------------------|----------------|-----------------|
| `brl_to_usdt` | BRL para USDT | BRL | USDT | Não |
| `usdt_to_brl` | USDT para BRL | USDT | BRL | Conta Brasileira |
| `usdt_to_usd_remessa` | USDT para USD (Remessa) | USDT | USD | Conta Internacional |

### Estrutura JSONB `bank_details`

**Para USDT → BRL:**
```json
{
  "type": "brazilian",
  "bank_name": "Bradesco",
  "agency": "1234",
  "account": "12345-6",
  "account_type": "corrente",
  "holder_name": "João da Silva",
  "holder_document": "123.456.789-00"
}
```

**Para USDT → USD (Remessa):**
```json
{
  "type": "international",
  "bank_name": "Bank of America",
  "bank_address": "123 Main St, New York, NY 10001, USA",
  "swift_code": "BOFAUS3N",
  "account_number": "123456789",
  "routing_number": "026009593",
  "beneficiary_name": "John Smith",
  "beneficiary_address": "456 Oak Ave, Miami, FL 33101, USA"
}
```

---

## Sequência de Implementação

1. **Migração SQL** - Criar tabela `operational_notes` com RLS
2. **Modal do usuário** - Formulário multi-etapas com dados bancários condicionais
3. **Lista de notas** - Componente para exibir no Dashboard
4. **Integração Dashboard** - Botão e seção de notas
5. **Página Admin** - Lista e gestão de notas pendentes
6. **Modal de Revisão** - Aprovar/Rejeitar com detalhes
7. **Geração de PDF** - Função jsPDF com selo visual
8. **Rotas e navegação** - Atualizar App.tsx e Sidebar
9. **Notificação Admin** - Card no Dashboard admin

