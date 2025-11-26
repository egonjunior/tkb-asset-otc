import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Copy, ExternalLink, Pencil, Power, PowerOff, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface OtcClient {
  id: string;
  slug: string;
  client_name: string;
  spread_percent: number;
  price_source: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export default function AdminOtcClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<OtcClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<OtcClient | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    client_name: '',
    spread_percent: '0.5',
    price_source: 'binance' as 'binance' | 'okx',
    notes: '',
  });

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('otc_quote_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes OTC');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('otc_quote_clients')
          .update({
            client_name: formData.client_name,
            spread_percent: parseFloat(formData.spread_percent),
            price_source: formData.price_source,
            notes: formData.notes,
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('otc_quote_clients')
          .insert({
            slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            client_name: formData.client_name,
            spread_percent: parseFloat(formData.spread_percent),
            price_source: formData.price_source,
            notes: formData.notes,
          });

        if (error) throw error;
        toast.success('Cliente criado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({ slug: '', client_name: '', spread_percent: '0.5', price_source: 'binance', notes: '' });
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cliente');
      console.error(error);
    }
  };

  const toggleActive = async (client: OtcClient) => {
    try {
      const { error } = await supabase
        .from('otc_quote_clients')
        .update({ is_active: !client.is_active })
        .eq('id', client.id);

      if (error) throw error;
      toast.success(`Cliente ${!client.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      fetchClients();
    } catch (error: any) {
      toast.error('Erro ao alterar status');
      console.error(error);
    }
  };

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para área de transferência!');
  };

  const openEdit = (client: OtcClient) => {
    setEditingClient(client);
    setFormData({
      slug: client.slug,
      client_name: client.client_name,
      spread_percent: client.spread_percent.toString(),
      price_source: (client.price_source as 'binance' | 'okx') || 'binance',
      notes: client.notes || '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({ slug: '', client_name: '', spread_percent: '0.5', price_source: 'binance', notes: '' });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Clientes OTC</h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente OTC
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente OTC' : 'Novo Cliente OTC'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="slug">Slug (URL)*</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="blackhole"
                  required
                  disabled={!!editingClient}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será usado na URL: tkbasset.com/{formData.slug || 'slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="client_name">Nome do Cliente*</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Black Hole Capital"
                  required
                />
              </div>

              <div>
                <Label htmlFor="price_source">⚙️ Fonte de Preço*</Label>
                <Select 
                  value={formData.price_source} 
                  onValueChange={(value: 'binance' | 'okx') => setFormData({ ...formData, price_source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">
                      <div className="flex flex-col">
                        <span className="font-medium">Binance</span>
                        <span className="text-xs text-muted-foreground">Maior liquidez, preço spot global</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="okx">
                      <div className="flex flex-col">
                        <span className="font-medium">OKX</span>
                        <span className="text-xs text-muted-foreground">Melhor spread BRL, mercado local</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="spread_percent">Spread (%)*</Label>
                <Input
                  id="spread_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.spread_percent}
                  onChange={(e) => setFormData({ ...formData, spread_percent: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: 0.5 = 0.5% sobre o preço da {formData.price_source === 'binance' ? 'Binance' : 'OKX'}
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações internas sobre o cliente..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingClient ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Clientes OTC ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum cliente OTC cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Spread</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-sm">/{client.slug}</TableCell>
                    <TableCell className="font-medium">{client.client_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {client.price_source || 'binance'}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.spread_percent}%</TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? 'default' : 'secondary'}>
                        {client.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyLink(client.slug)}
                          title="Copiar link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/${client.slug}`, '_blank')}
                          title="Abrir página"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(client)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(client)}
                          title={client.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {client.is_active ? (
                            <PowerOff className="h-4 w-4 text-destructive" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}