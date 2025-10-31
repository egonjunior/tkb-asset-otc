import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supportTicketSchema } from "@/lib/validators";
import { z } from "zod";
import { MessageCircle, Phone, Mail, ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SupportFormData = z.infer<typeof supportTicketSchema>;

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  email: string;
  whatsapp: string;
}

export default function Support() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportTicketSchema),
  });

  useEffect(() => {
    fetchUserProfile();
    fetchTickets();
    
    // Realtime subscription
    const channel = supabase
      .channel('user-tickets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
      }, () => fetchTickets())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setUserEmail(user.email || "");
        setValue("email", user.email || "");
      }
    }
  };

  const fetchTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return;
    }

    setTickets(data || []);
  };

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue("whatsapp", formatted);
  };

  const onSubmit = async (data: SupportFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const insertData = {
        user_id: user.id,
        subject: data.subject,
        message: data.message,
        email: data.email,
        whatsapp: data.whatsapp,
      };

      const { error } = await supabase
        .from("support_tickets")
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "✅ Chamado aberto!",
        description: "Acompanhe o status na seção abaixo.",
      });

      reset({
        email: userEmail,
        subject: "",
        message: "",
        whatsapp: "",
      });
      
      fetchTickets();
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Erro ao abrir chamado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)]">
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">Central de Suporte TKB Asset</CardTitle>
              <CardDescription className="text-base">
                Está com alguma dúvida ou problema? Abra um chamado e nossa equipe responderá em breve.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Select
                    onValueChange={(value) => setValue("subject", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dúvida sobre Operação">Dúvida sobre Operação</SelectItem>
                      <SelectItem value="Problema com Pagamento">Problema com Pagamento</SelectItem>
                      <SelectItem value="Documentos">Documentos</SelectItem>
                      <SelectItem value="Cotação">Cotação</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    {...register("message")}
                    placeholder="Descreva sua dúvida ou problema..."
                    rows={5}
                    disabled={isSubmitting}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email para contato *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        {...register("email")}
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        {...register("whatsapp")}
                        onChange={handlePhoneChange}
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.whatsapp && (
                      <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Chamado"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {tickets.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Meus Chamados</CardTitle>
                <CardDescription>
                  Acompanhe o status dos seus chamados de suporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{ticket.subject}</p>
                            <TicketStatusBadge status={ticket.status as "open" | "in_progress" | "resolved" | "closed"} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Aberto em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.subject}
              {selectedTicket && <TicketStatusBadge status={selectedTicket.status as "open" | "in_progress" | "resolved" | "closed"} />}
            </DialogTitle>
            <DialogDescription>
              Aberto em {selectedTicket && format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mensagem</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTicket?.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm mt-1">{selectedTicket?.email}</p>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <p className="text-sm mt-1">{selectedTicket?.whatsapp}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
