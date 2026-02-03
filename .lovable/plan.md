

# Correção do Relatório de Clientes Recorrentes

## Problema Identificado

O relatório não mostra dados porque:

1. **Período de busca limitado**: A API está buscando apenas os últimos 30 dias de saques (configuração padrão do `dateRange`)
2. **Filtro do modal é diferente**: O modal filtra por mês específico (ex: Janeiro 2026), mas se a API só buscou fevereiro, não há dados de janeiro

### Fluxo Atual (Problema)

```text
AdminOkxOperations
  ├── dateRange = últimos 30 dias (ex: 04/01 a 03/02)
  │
  ├── handleOpenReport("Virtual Pay")
  │   └── fetchOperations('withdrawals') com dateRange atual
  │       └── API retorna saques de 04/01 a 03/02
  │
  └── ClientReportModal
      ├── selectedPeriod = "2026-02" (Fevereiro)
      └── filteredWithdrawals = []  ← SEM DADOS de fevereiro completo!
```

---

## Solução Proposta

Quando abrir o modal de relatório de cliente, buscar os saques dos **últimos 12 meses** (sem usar o dateRange padrão).

### Fluxo Corrigido

```text
AdminOkxOperations
  │
  ├── handleOpenReport("Virtual Pay")
  │   └── fetchWithdrawalsForReport() ← NOVO
  │       └── API busca últimos 12 meses
  │
  └── ClientReportModal
      ├── selectedPeriod = "2026-02" (Fevereiro)
      └── filteredWithdrawals = [dados encontrados!]
```

---

## Alterações Necessárias

### `src/pages/admin/AdminOkxOperations.tsx`

1. **Nova função `fetchWithdrawalsForReport`**:
   - Busca saques dos últimos 365 dias (12 meses)
   - Não usa o `dateRange` da interface (que é para as outras abas)
   - Chamada quando abre o modal de relatório

2. **Modificar `handleOpenReport`**:
   - Chamar a nova função em vez de `fetchOperations('withdrawals')`
   - Mostrar loading no modal enquanto busca

3. **Passar estado de loading correto para o modal**:
   - Criar um estado separado `loadingReport` para não conflitar com o loading geral

### Código das Alterações

**Nova função:**
```typescript
const fetchWithdrawalsForReport = async () => {
  setLoadingReport(true);
  try {
    const response = await supabase.functions.invoke('okx-operations', {
      body: {
        type: 'withdrawals',
        // Buscar últimos 365 dias para ter dados de todos os meses
        startDate: format(subDays(new Date(), 365), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      },
    });

    if (response.error) throw new Error(response.error.message);

    const result = response.data?.data || [];
    setWithdrawals(result);
    
    toast({
      title: "Dados carregados",
      description: `${result.length} saques encontrados`,
    });
  } catch (error: any) {
    toast({
      title: "Erro ao carregar saques",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoadingReport(false);
  }
};
```

**Modificar handleOpenReport:**
```typescript
const handleOpenReport = (client: RecurringClient) => {
  setSelectedClientForReport(client);
  setReportModalOpen(true);
  // Buscar saques dos últimos 12 meses para o relatório
  fetchWithdrawalsForReport();
};
```

**Novo estado:**
```typescript
const [loadingReport, setLoadingReport] = useState(false);
```

**Passar para o modal:**
```typescript
<ClientReportModal
  open={reportModalOpen}
  onOpenChange={setReportModalOpen}
  client={selectedClientForReport}
  withdrawals={withdrawals}
  onRefresh={fetchWithdrawalsForReport}
  loading={loadingReport}
/>
```

---

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `AdminOkxOperations.tsx` | Adicionar função `fetchWithdrawalsForReport()` que busca 365 dias |
| `AdminOkxOperations.tsx` | Novo estado `loadingReport` |
| `AdminOkxOperations.tsx` | Modificar `handleOpenReport()` para usar nova função |
| `AdminOkxOperations.tsx` | Passar `loadingReport` ao `ClientReportModal` |

---

## Resultado Esperado

Após a correção:
1. Ao clicar em "Ver Relatório" de um cliente, a API buscará os saques dos últimos 12 meses
2. O modal filtrará corretamente por mês (Janeiro, Dezembro, etc.)
3. Todas as transações para as carteiras do cliente aparecerão no relatório
4. A exportação para Excel funcionará com os dados corretos

