

# Redesign do PDF de Nota Operacional

## Dados da Empresa

- **Email:** gestao@tkbasset.com
- **CNPJ:** 45.933.866/0001-93
- **Sem texto de validade legal** (apenas registro interno)

---

## Alterações no Arquivo

**Arquivo:** `src/lib/generateOperationalNotePDF.ts`

### 1. Header Redesenhado

- Logo/nome "TKB ASSET MANAGER" em destaque
- Subtítulo "Mesa OTC Cambial"
- Email: gestao@tkbasset.com
- Número da nota e data no lado direito
- Barra de cor primária como acento visual

### 2. Texto Institucional

Adicionar parágrafo após header:
```
Este documento atesta a operacao de cambio realizada atraves da 
TKB Asset Manager Cambial Ltda., conforme dados especificados abaixo. 
A presente nota serve como comprovante para fins de registro.
```

### 3. Seções com Design Elegante

Cada seção terá:
- Fundo cinza claro (lightGray)
- Canto superior esquerdo com acento colorido
- Título em negrito
- Labels em cinza, valores em preto

**Seções:**
- IDENTIFICACAO DO CLIENTE
- DETALHES DA OPERACAO
- DADOS DA CONTA RECEBEDORA / BENEFICIARIA

### 4. Labels Profissionais

| De | Para |
|----|------|
| DEPOSITOU | VALOR ENTREGUE |
| ADQUIRIU | VALOR RECEBIDO |
| BRL → USDT | Conversao de Real (BRL) para Tether (USDT) |
| USDT → BRL | Conversao de Tether (USDT) para Real (BRL) |
| USDT → USD | Conversao de Tether (USDT) para Dolar Americano (USD) |

### 5. Selo de Verificacao Elegante

- Borda dupla dourada
- Círculo verde com checkmark branco
- Texto:
  - "OPERACAO VERIFICADA" (título)
  - "Verificado e aprovado pela Mesa de Operacoes TKB Asset Manager Cambial"
  - Nome do aprovador e data
  - Código de verificação em dourado

### 6. Footer Fixo

Posicionado no final da página:
```
TKB Asset Manager Cambial Ltda. | CNPJ: 45.933.866/0001-93
Documento gerado em: [data/hora]
Este documento serve como comprovante de operacao para fins de registro interno.
```

---

## Correções Técnicas

1. **Encoding:** Remover caracteres especiais como "→" (usar texto "para")
2. **Espaçamento:** Aumentar distância entre seções
3. **Posicionamento:** Footer fixo em `pageHeight - 18`
4. **Selo:** Posicionamento dinâmico baseado no conteúdo anterior

---

## Estrutura Visual Final

```text
┌──────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████│
│  TKB ASSET MANAGER              NOTA OPERACIONAL         │
│  Mesa OTC Cambial               No TKB-NO-2026-0001      │
│  gestao@tkbasset.com            Data: 09/12/2025         │
│  ════════════════════════════════════════════════════    │
│                                                          │
│  Este documento atesta a operacao de cambio realizada    │
│  atraves da TKB Asset Manager Cambial Ltda...            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  IDENTIFICACAO DO CLIENTE                          │  │
│  │  Nome Completo: Giovana Gabriela Pereira           │  │
│  │  Documento (CPF): 470.064.738-88                   │  │
│  │  E-mail: giovanagabrielapereira219@gmail.com       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  DETALHES DA OPERACAO                              │  │
│  │  Modalidade: Conversao de Tether (USDT) para       │  │
│  │              Dolar Americano (USD)                 │  │
│  │              (Remessa Internacional)               │  │
│  │                                                    │  │
│  │  ┌───────────────────┐  ┌───────────────────┐      │  │
│  │  │ VALOR ENTREGUE    │  │ VALOR RECEBIDO    │      │  │
│  │  │ 10.180,00 USDT    │  │ US$ 10.000,00     │      │  │
│  │  └───────────────────┘  └───────────────────┘      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  DADOS DA CONTA BENEFICIARIA (INTERNACIONAL)       │  │
│  │  Instituicao Financeira: Bank of America           │  │
│  │  Endereco: Rua 123                                 │  │
│  │  SWIFT/BIC: FDOKFD    Numero da Conta: 12344345   │  │
│  │  Routing/Wire: 034434                              │  │
│  │  Beneficiario: Giovana                             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│          ╔══════════════════════════════════════╗        │
│          ║  ✓  OPERACAO VERIFICADA              ║        │
│          ║                                      ║        │
│          ║  Verificado e aprovado pela Mesa de  ║        │
│          ║  Operacoes TKB Asset Manager Cambial ║        │
│          ║                                      ║        │
│          ║  Aprovado por: Admin TKB             ║        │
│          ║  Data: 30/01/2026 as 10:53           ║        │
│          ║                                      ║        │
│          ║  Codigo: TKB-VRF-XXXXXXXX            ║        │
│          ╚══════════════════════════════════════╝        │
│                                                          │
│  ────────────────────────────────────────────────────    │
│  TKB Asset Manager Cambial Ltda. | CNPJ: 45.933.866/...  │
│  Documento gerado em: 30/01/2026 as 10:53:59             │
│  Este documento serve como comprovante para registro     │
└──────────────────────────────────────────────────────────┘
```

