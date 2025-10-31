import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, ExternalLink, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PartnerRequest {
  id: string;
  name: string;
  phone: string;
  linkedin: string | null;
  instagram: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

const statusConfig = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  contacted: { label: "Contatado", className: "bg-blue-100 text-blue-800 border-blue-200" },
  approved: { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800 border-red-200" },
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<PartnerRequest[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<PartnerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<PartnerRequest | null>(null);
  const [notes, setNotes] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPartners();

    // Realtime subscription
    const channel = supabase
      .channel('partner-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'partner_requests'
      }, () => {
        fetchPartners();
        toast({ title: "🤝 Nova solicitação de parceria!" });
      })
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
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
      );
    }

    setFilteredPartners(filtered);
  }, [partners, statusFilter, searchTerm]);

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from("partner_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching partners:", error);
      return;
    }

    setPartners(data || []);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("partner_requests")
      .update({ 
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
      return;
    }

    toast({ title: `✅ Status atualizado para: ${statusConfig[newStatus as keyof typeof statusConfig].label}` });
    fetchPartners();
  };

  const handleUpdateNotes = async () => {
    if (!selectedPartner) return;

    const { error } = await supabase
      .from("partner_requests")
      .update({ notes })
      .eq("id", selectedPartner.id);

    if (error) {
      console.error("Error updating notes:", error);
      toast({ title: "Erro ao salvar notas", variant: "destructive" });
      return;
    }

    toast({ title: "✅ Notas salvas com sucesso" });
    setSelectedPartner(null);
    fetchPartners();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)]">
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold">🤝 Solicitações de Parceria</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gestão de Parceiros</CardTitle>
            <CardDescription>Gerencie solicitações de parceria comercial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Redes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        <a 
                          href={`https://wa.me/55${partner.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {partner.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {partner.linkedin && (
                            <a href={partner.linkedin} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">LinkedIn</Button>
                            </a>
                          )}
                          {partner.instagram && (
                            <a href={partner.instagram.startsWith('@') ? `https://instagram.com/${partner.instagram.slice(1)}` : partner.instagram} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">Instagram</Button>
                            </a>
                          )}
                          {!partner.linkedin && !partner.instagram && "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[partner.status as keyof typeof statusConfig]?.className}>
                          {statusConfig[partner.status as keyof typeof statusConfig]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(partner.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setNotes(partner.notes || "");
                            }}
                          >
                            Ver
                          </Button>
                          {partner.status === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUpdateStatus(partner.id, "contacted")}
                              >
                                Contatar
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600"
                                onClick={() => handleUpdateStatus(partner.id, "approved")}
                              >
                                Aprovar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPartner?.name}</DialogTitle>
            <DialogDescription>
              Solicitação recebida em {selectedPartner && format(new Date(selectedPartner.created_at), "dd/MM/yyyy 'às' HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <p className="text-sm mt-1">{selectedPartner?.phone}</p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm mt-1">
                  <Badge className={statusConfig[selectedPartner?.status as keyof typeof statusConfig]?.className}>
                    {statusConfig[selectedPartner?.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </p>
              </div>
            </div>
            {(selectedPartner?.linkedin || selectedPartner?.instagram) && (
              <div>
                <Label>Redes Sociais</Label>
                <div className="flex gap-2 mt-1">
                  {selectedPartner?.linkedin && (
                    <a href={selectedPartner.linkedin} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        LinkedIn
                      </Button>
                    </a>
                  )}
                  {selectedPartner?.instagram && (
                    <a href={selectedPartner.instagram.startsWith('@') ? `https://instagram.com/${selectedPartner.instagram.slice(1)}` : selectedPartner.instagram} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Instagram
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label>Notas Internas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre este parceiro..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPartner(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateNotes}>
                Salvar Notas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
