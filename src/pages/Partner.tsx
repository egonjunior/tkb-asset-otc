import { useState, useEffect } from "react";
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
import { Handshake, Phone, Linkedin, Instagram, ArrowLeft, Building2, Users, Clock, CheckCircle, Loader2, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PartnerContractGenerator } from "@/components/partner/PartnerContractGenerator";

type PartnerFormData = z.infer<typeof partnerRequestSchema>;

export default function Partner() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [showContractGenerator, setShowContractGenerator] = useState(false);
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

  useEffect(() => {
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsCheckingRequest(false);
        return;
      }

      const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('request_type', 'assessor')
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (data) {
        setExistingRequest(data);
      }
    } catch (error) {
      console.error('Error checking request:', error);
    } finally {
      setIsCheckingRequest(false);
    }
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
    setValue("phone", formatted);
  };

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const insertData = {
        name: data.name,
        phone: data.phone,
        linkedin: data.linkedin || null,
        instagram: data.instagram || null,
        request_type: 'assessor',
        user_id: user?.id || null,
      };

      const { error } = await supabase
        .from("partner_requests")
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "✅ Solicitação enviada!",
        description: "Preencha seu contrato para finalizar.",
      });

      if (user) {
        setShowContractGenerator(true);
      } else {
        reset();
      }
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
              <div className="bg-primary/5 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-2">Seja um Parceiro Homologado</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Você é um assessor de investimentos, corretor ou tem uma rede de contatos
                  que podem se interessar em comprar USDT com cotação premium?
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Traga seus clientes para a TKB Asset e seja comissionado por cada operação realizada!
                </p>
              </div>

              {isCheckingRequest ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-2">Verificando solicitação...</p>
                </div>
              ) : showContractGenerator ? (
                <PartnerContractGenerator onComplete={() => checkExistingRequest()} />
              ) : existingRequest ? (
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      {existingRequest.status === 'pending' && (
                        <>
                          <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                            <FileSignature className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Próximo Passo: Assinatura</h3>
                            <p className="text-muted-foreground mt-2 mb-4">
                              Para finalizarmos sua parceria, precisamos que você assine digitalmente o contrato.
                            </p>
                            <Button onClick={() => setShowContractGenerator(true)} className="w-full">
                              Gerar e Assinar Contrato
                            </Button>
                          </div>
                        </>
                      )}
                      {existingRequest.status === 'approved' && (
                        <>
                          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-green-700">Parceria Aprovada! 🎉</h3>
                            <p className="text-muted-foreground mt-2">
                              Sua parceria foi aprovada. Verifique seu dashboard para iniciar as operações.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
