import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { OfflineClient, OfflineTransaction } from "@/types/offlineClients";

interface OfflineClientReportProps {
  client: OfflineClient;
  transactions: OfflineTransaction[];
}

export function OfflineClientReport({ client, transactions }: OfflineClientReportProps) {
  // Calculate metrics
  const totalUSDT = transactions.reduce((sum, t) => sum + Number(t.usdt_amount), 0);
  const totalBRL = transactions.reduce((sum, t) => sum + Number(t.brl_amount), 0);
  const avgRate = totalBRL / totalUSDT;
  
  const compras = transactions.filter(t => t.operation_type === 'compra');
  const vendas = transactions.filter(t => t.operation_type === 'venda');
  
  const totalCompras = compras.reduce((sum, t) => sum + Number(t.usdt_amount), 0);
  const totalVendas = vendas.reduce((sum, t) => sum + Number(t.usdt_amount), 0);

  // Chart data
  const chartData = transactions
    .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
    .map(t => ({
      date: new Date(t.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      volume: Number(t.usdt_amount),
      rate: Number(t.usdt_rate),
    }));

  return (
    <div className="bg-white p-8 space-y-6" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <div className="border-b-4 border-primary pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">TKB Asset</h1>
            <p className="text-sm text-muted-foreground">Relatório de Operações Offline</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Emitido em:</p>
            <p>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-3 text-foreground">Informações do Cliente</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Nome:</p>
            <p className="font-semibold">{client.full_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Documento:</p>
            <p className="font-semibold">{client.document_type}: {client.document_number}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email:</p>
            <p className="font-semibold">{client.email || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Telefone:</p>
            <p className="font-semibold">{client.phone || '-'}</p>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div>
        <h2 className="text-xl font-bold mb-3 text-foreground">Resumo do Período</h2>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Volume Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalUSDT.toFixed(2)} USDT</p>
              <p className="text-xs text-muted-foreground mt-1">
                R$ {totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cotação Média</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">R$ {avgRate.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground mt-1">USDT/BRL</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Operações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{transactions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {compras.length} compras | {vendas.length} vendas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3 text-foreground">Evolução de Volume</h2>
          <div className="bg-muted/30 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} name="Volume USDT" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Compras</h3>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{totalCompras.toFixed(2)} USDT</p>
            <p className="text-sm text-green-600">{compras.length} operações</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Vendas</h3>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-2xl font-bold text-orange-700">{totalVendas.toFixed(2)} USDT</p>
            <p className="text-sm text-orange-600">{vendas.length} operações</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t text-center text-xs text-muted-foreground">
        <p>Este relatório foi gerado automaticamente pelo sistema TKB Asset</p>
        <p className="mt-1">Para mais informações, entre em contato através dos nossos canais oficiais</p>
      </div>
    </div>
  );
}
