import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Mail, Phone, Check, X, Settings } from "lucide-react";
import { PartnerB2BStats } from "@/components/admin/PartnerB2BStats";
import { PartnerB2BConfigModal } from "@/components/admin/PartnerB2BConfigModal";
import { toast } from "sonner";

// TypeScript interfaces para type safety
interface PartnerB2BConfig {
  user_id: string;
  markup_percent: number;
  is_active: boolean;
  company_name: string | null;
  trading_volume_monthly: number | null;
  notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

interface PartnerRequest {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  user_id: string | null;
  trading_volume_monthly: number | null;
  notes: string | null;
  created_at: string;
  partner_b2b_config: PartnerB2BConfig | null;
}

export default function AdminPartnersB2B() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PartnerRequest[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<PartnerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPartners();

    // Real-time subscription for requests and configs
    const channel = supabase
      .channel('admin-partners-b2b')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'partner_requests' },
        () => fetchPartners()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'partner_b2b_config' },
        () => fetchPartners()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = partners;

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPartners(filtered);
  }, [partners, statusFilter, searchTerm]);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      // 1) Fetch partner requests without JOIN
      const { data: requestsData, error: requestsError } = await supabase
        .from('partner_requests')
        .select('*')
        .eq('request_type', 'b2b_otc')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // 2) Fetch all existing configs
      const { data: configsData, error: configsError } = await supabase
        .from('partner_b2b_config')
        .select('*');

      if (configsError) {
        console.warn('⚠️ Could not fetch partner_b2b_config:', configsError);
      }

      // 3) Map configs by user_id for quick lookup
      const configMap = new Map<string, any>();
      (configsData || []).forEach((cfg: any) => {
        if (cfg?.user_id) configMap.set(cfg.user_id, cfg);
      });

      // 4) Merge data manually
      const combined = (requestsData || []).map((req: any) => ({
        ...req,
        partner_b2b_config: req.user_id ? configMap.get(req.user_id) || null : null,
      }));

      setPartners(combined as PartnerRequest[]);
    } catch (error: any) {
      console.error('❌ Error fetching B2B partners:', error);
      toast.error('Erro ao carregar parceiros B2B');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, isActive?: boolean) => {
    if (status === 'approved' && isActive) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Ativo</Badge>;
    }
    if (status === 'approved' && !isActive) {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Inativo</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Rejeitado</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  const handleReject = async (partnerId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este parceiro?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('partner_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast.success("Parceiro rejeitado");
      fetchPartners();
    } catch (error: any) {
      console.error("Error rejecting partner:", error);
      toast.error(`Erro ao rejeitar: ${error.message}`);
    }
  };

  const handleToggleActive = async (partner: PartnerRequest) => {
    // Verificar se partner tem config antes de tentar toggle
    if (!partner.partner_b2b_config) {
      toast.error("Este parceiro ainda não foi configurado");
      return;
    }

    try {
      const newStatus = !partner.partner_b2b_config.is_active;
      
      const { error } = await supabase
        .from('partner_b2b_config')
        .update({ is_active: newStatus })
        .eq('user_id', partner.user_id);

      if (error) throw error;

      toast.success(`Parceiro ${newStatus ? 'ativado' : 'desativado'}`);
      fetchPartners();
    } catch (error: any) {
      console.error("Error toggling partner status:", error);
      toast.error(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8 text-purple-600" />
                Parceiros B2B - Mesas OTC
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie mesas OTC parceiras com markup personalizado
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <PartnerB2BStats partners={partners} />

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Partners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Parceiros B2B ({filteredPartners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Volume Mensal</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
                        Carregando parceiros...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum parceiro B2B encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {partner.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {partner.trading_volume_monthly ? (
                          <span className="font-medium">
                            R$ {Number(partner.trading_volume_monthly).toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {partner.partner_b2b_config?.markup_percent != null ? (
                          <Badge variant="outline" className="font-mono">
                            {partner.partner_b2b_config.markup_percent}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Não configurado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(partner.status, partner.partner_b2b_config?.is_active ?? false)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(partner.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {partner.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setIsConfigModalOpen(true);
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(partner.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {partner.status === 'approved' && partner.partner_b2b_config && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setIsConfigModalOpen(true);
                                }}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={partner.partner_b2b_config.is_active ? "destructive" : "default"}
                                onClick={() => handleToggleActive(partner)}
                              >
                                {partner.partner_b2b_config.is_active ? 'Desativar' : 'Ativar'}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedPartner && (
        <PartnerB2BConfigModal
          partner={selectedPartner}
          isOpen={isConfigModalOpen}
          onClose={() => {
            setIsConfigModalOpen(false);
            setSelectedPartner(null);
          }}
          onSuccess={fetchPartners}
        />
      )}
    </div>
  );
}
