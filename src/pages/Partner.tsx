import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { partnerRequestSchema } from "@/lib/validators";
import { z } from "zod";
import { Handshake, Phone, Linkedin, Instagram, ArrowLeft, Building2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PartnerFormData = z.infer<typeof partnerRequestSchema>;

export default function Partner() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerRequestSchema),
  });

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
    setValue("phone", formatted);
  };

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    
    try {
      const insertData = {
        name: data.name,
        phone: data.phone,
        linkedin: data.linkedin || null,
        instagram: data.instagram || null,
      };

      const { error } = await supabase
        .from("partner_requests")
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "✅ Solicitação enviada!",
        description: "Entraremos em contato em breve.",
      });

      reset();
    } catch (error) {
      console.error("Error submitting partner request:", error);
      toast({
        title: "Erro ao enviar solicitação",
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
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">Seja um Parceiro TKB Asset</CardTitle>
              <CardDescription className="text-base">
                Escolha o tipo de parceria ideal para o seu perfil
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="assessor" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="assessor" className="gap-2">
                    <Users className="h-4 w-4" />
                    Parceiro por Comissão
                  </TabsTrigger>
                  <TabsTrigger value="b2b" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Mesa OTC (B2B)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="assessor" className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-lg mb-2">Parceria por Comissão</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Você é um assessor de investimentos, corretor ou tem uma rede de contatos
                      que podem se interessar em comprar USDT com cotação premium?
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      Traga seus clientes para a TKB Asset e seja comissionado por cada operação realizada!
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        {...register("name")}
                        placeholder="Seu nome completo"
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          {...register("phone")}
                          onChange={handlePhoneChange}
                          placeholder="(11) 99999-9999"
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn (opcional)</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="linkedin"
                          {...register("linkedin")}
                          placeholder="https://linkedin.com/in/seu-perfil"
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.linkedin && (
                        <p className="text-sm text-destructive">{errors.linkedin.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram (opcional)</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="instagram"
                          {...register("instagram")}
                          placeholder="@seu_usuario ou https://instagram.com/seu_usuario"
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.instagram && (
                        <p className="text-sm text-destructive">{errors.instagram.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="b2b" className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-lg mb-2">Parceria B2B - Mesas OTC</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Opere com markup diferenciado e potencialize seus resultados
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Markup personalizado a partir de 0.4% sobre o preço Binance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Acesso direto à plataforma com cotações em tempo real</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Suporte dedicado e condições especiais</span>
                      </li>
                    </ul>
                  </div>

                  <div className="text-center">
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => navigate('/partner-b2b')}
                      className="w-full"
                    >
                      Acessar Formulário B2B
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Você será redirecionado para o formulário completo
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
