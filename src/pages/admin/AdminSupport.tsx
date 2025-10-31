import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  email: string;
  whatsapp: string;
  status: string;
  priority: string;
  created_at: string;
  admin_notes: string | null;
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();

    // Realtime subscription
    const channel = supabase
      .channel('support-tickets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets'
      }, () => {
        fetchTickets();
        toast({ title: "💬 Atualização em chamados de suporte!" });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = tickets;

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm)
      );
    }

    setFilteredTickets(filtered);
  }, [tickets, statusFilter, searchTerm]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return;
    }

    setTickets(data || []);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    
    if (newStatus === "resolved" || newStatus === "closed") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("support_tickets")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
      return;
    }

    toast({ title: `✅ Status atualizado` });
    fetchTickets();
  };

  const handleUpdatePriority = async (id: string, newPriority: string) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ priority: newPriority })
      .eq("id", id);

    if (error) {
      console.error("Error updating priority:", error);
      toast({ title: "Erro ao atualizar prioridade", variant: "destructive" });
      return;
    }

    toast({ title: `✅ Prioridade atualizada` });
    fetchTickets();
  };

  const handleUpdateNotes = async () => {
    if (!selectedTicket) return;

    const { error } = await supabase
      .from("support_tickets")
      .update({ admin_notes: adminNotes })
      .eq("id", selectedTicket.id);

    if (error) {
      console.error("Error updating notes:", error);
      toast({ title: "Erro ao salvar notas", variant: "destructive" });
      return;
    }

    toast({ title: "✅ Notas salvas com sucesso" });
    setSelectedTicket(null);
    fetchTickets();
  };

  const metrics = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
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
          <h1 className="text-2xl font-bold">💬 Central de Suporte</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Métricas */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{metrics.open}</p>
                <p className="text-sm text-muted-foreground">Abertos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{metrics.inProgress}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{metrics.urgent}</p>
                <p className="text-sm text-muted-foreground">Urgentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Chamados de Suporte</CardTitle>
            <CardDescription>Gerencie todos os chamados de clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por assunto ou email..."
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
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell>{ticket.email}</TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status as any} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority as any} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setAdminNotes(ticket.admin_notes || "");
                          }}
                        >
                          Ver
                        </Button>
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
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.subject}
              {selectedTicket && <TicketStatusBadge status={selectedTicket.status as any} />}
            </DialogTitle>
            <DialogDescription>
              Aberto em {selectedTicket && format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mensagem</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap border p-3 rounded-md bg-muted">
                {selectedTicket?.message}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm mt-1">{selectedTicket?.email}</p>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <p className="text-sm mt-1">
                  <a 
                    href={`https://wa.me/55${selectedTicket?.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedTicket?.whatsapp}
                  </a>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedTicket?.status} 
                  onValueChange={(value) => selectedTicket && handleUpdateStatus(selectedTicket.id, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select 
                  value={selectedTicket?.priority} 
                  onValueChange={(value) => selectedTicket && handleUpdatePriority(selectedTicket.id, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notas Internas</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione notas sobre este chamado..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Fechar
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
