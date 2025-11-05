import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { FileDown, Mail, MessageCircle, Eye, Copy, Search } from "lucide-react";
import { LeadsStats } from "@/components/admin/LeadsStats";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";

interface Lead {
  id: string;
  nome_completo: string;
  email_corporativo: string;
  volume_mensal: string;
  necessidade: string;
  necessidade_outro?: string;
  status: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  admin_notes?: string;
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [volumeFilter, setVolumeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();

    // Realtime updates
    const channel = supabase
      .channel('admin-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, statusFilter, volumeFilter, searchTerm]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar leads",
        description: "Não foi possível carregar os leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (volumeFilter !== 'all') {
      filtered = filtered.filter(lead => lead.volume_mensal === volumeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email_corporativo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeads(filtered);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'contatado') {
        updateData.contacted_at = new Date().toISOString();
      } else if (newStatus === 'qualificado') {
        updateData.qualified_at = new Date().toISOString();
      } else if (newStatus === 'convertido') {
        updateData.converted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: "O status do lead foi alterado com sucesso.",
      });

      fetchLeads();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Data', 'Nome', 'Email', 'Volume', 'Necessidade', 'Status'],
      ...filteredLeads.map(l => [
        format(new Date(l.created_at), 'dd/MM/yyyy HH:mm'),
        l.nome_completo,
        l.email_corporativo,
        l.volume_mensal,
        l.necessidade,
        l.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-empresas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Email copiado!",
      description: "O email foi copiado para a área de transferência.",
    });
  };

  const getVolumeBadge = (volume: string) => {
    switch (volume) {
      case 'R$ 100k-500k/mês':
        return 'bg-blue-100 text-blue-800';
      case 'R$ 500k-2M/mês':
        return 'bg-blue-200 text-blue-900';
      case 'R$ 2M-10M/mês':
        return 'bg-purple-100 text-purple-800';
      case 'R$ 10M+/mês':
        return 'bg-amber-100 text-amber-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)]">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">Leads Empresariais</h1>
                <p className="text-muted-foreground">Cadastros via landing page /empresas</p>
              </div>
              <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {/* Stats */}
            <LeadsStats leads={leads} />

            {/* Filters */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="novo">🆕 Novo</SelectItem>
                    <SelectItem value="contatado">📞 Contatado</SelectItem>
                    <SelectItem value="qualificado">✅ Qualificado</SelectItem>
                    <SelectItem value="convertido">🏆 Convertido</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={volumeFilter} onValueChange={setVolumeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os volumes</SelectItem>
                    <SelectItem value="R$ 100k-500k/mês">R$ 100k-500k/mês</SelectItem>
                    <SelectItem value="R$ 500k-2M/mês">R$ 500k-2M/mês</SelectItem>
                    <SelectItem value="R$ 2M-10M/mês">R$ 2M-10M/mês</SelectItem>
                    <SelectItem value="R$ 10M+/mês">R$ 10M+/mês</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{filteredLeads.length}</span>
                  {filteredLeads.length === 1 ? 'lead encontrado' : 'leads encontrados'}
                </div>
              </div>
            </Card>

            {/* Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Necessidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando leads...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{lead.nome_completo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{lead.email_corporativo}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyEmail(lead.email_corporativo)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getVolumeBadge(lead.volume_mensal)} border text-xs`}>
                            {lead.volume_mensal}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {lead.necessidade}
                        </TableCell>
                        <TableCell>
                          <LeadStatusBadge
                            status={lead.status}
                            leadId={lead.id}
                            onStatusChange={handleStatusChange}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openLeadDetails(lead)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`mailto:${lead.email_corporativo}`, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`https://wa.me/5541984219668`, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </SidebarInset>
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={fetchLeads}
      />
    </SidebarProvider>
  );
};

export default AdminLeads;
