

# Correção do Relatório de Clientes Recorrentes - Problema Identificado

## Diagnóstico

Após investigar os logs da API OKX e os dados do banco, identifiquei **dois problemas**:

### Problema 1: Campo incorreto na Edge Function

A API OKX retorna o endereço de destino no campo **`to`**, mas a edge function está tentando ler de **`toAddr`** (que não existe):

**Resposta real da OKX (dos logs):**
```json
{
  "to": "0x594543f1e45168103f2b3226e5bb028f63a0cdb3",
  "chain": "USDT-ERC20",
  "amt": "3761.1",
  ...
}
```

**Código atual (ERRADO):**
```typescript
return {
  id: w.wdId,
  toAddress: w.toAddr,  // ← ERRO! Campo não existe
  ...
}
```

**Código corrigido:**
```typescript
return {
  id: w.wdId,
  toAddress: w.to,  // ← CORRETO!
  ...
}
```

### Problema 2: Paginação insuficiente

A API está buscando apenas 100 saques (2 páginas), mas com limite de 10 páginas. Para um histórico completo de 12 meses, precisamos aumentar o limite de páginas.

---

## Alterações Necessárias

### Arquivo: `supabase/functions/okx-operations/index.ts`

1. **Corrigir mapeamento de campo** (linha 357):
   - Mudar de `w.toAddr` para `w.to`

2. **Aumentar limite de paginação** (linha 109):
   - Aumentar `maxPages` de 10 para 50 para buscar mais histórico

### Código da Correção

**Linha 109 - Aumentar limite de páginas:**
```typescript
const maxPages = 50; // Increased to fetch more historical data
```

**Linha 344-359 - Corrigir mapeamento:**
```typescript
result = withdrawals?.map((w: any) => {
  const address = w.to?.toLowerCase() || '';  // ← Usar 'to' em vez de 'toAddr'
  const alias = aliasMap.get(address);
  
  return {
    id: w.wdId,
    amount: parseFloat(w.amt),
    fee: parseFloat(w.fee || 0),
    currency: w.ccy,
    network: w.chain,
    status: mapWithdrawalStatus(w.state),
    timestamp: new Date(parseInt(w.ts)).toISOString(),
    txId: w.txId,
    toAddress: w.to,  // ← Campo correto
    alias: alias || null,
  };
}) || [];
```

---

## Fluxo Após Correção

```text
OKX API Response
├── to: "0x6318...CC9"  ← Campo correto
├── chain: "USDT-ERC20"
└── amt: "5000"
        │
        ▼
Edge Function (corrigida)
├── toAddress: w.to  ← Agora lê do campo correto
        │
        ▼
ClientReportModal
├── clientWalletAddresses: ["0x6318...cc9"]
├── withdrawal.toAddress: "0x6318...CC9"
├── Match: true! ← Agora encontra!
        │
        ▼
Relatório mostra os saques ✓
```

---

## Resumo das Mudanças

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `supabase/functions/okx-operations/index.ts` | 109 | Aumentar `maxPages` de 10 para 50 |
| `supabase/functions/okx-operations/index.ts` | 345 | Mudar `w.toAddr?.toLowerCase()` para `w.to?.toLowerCase()` |
| `supabase/functions/okx-operations/index.ts` | 357 | Mudar `toAddress: w.toAddr` para `toAddress: w.to` |

---

## Resultado Esperado

Após a correção:
1. A edge function lerá o endereço de destino corretamente do campo `to`
2. O matching entre carteiras cadastradas e saques funcionará
3. O relatório mostrará todos os saques enviados para as carteiras do cliente
4. A paginação buscará mais registros históricos (até 5000 saques)

