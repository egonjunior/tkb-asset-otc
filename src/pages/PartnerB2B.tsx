import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, TrendingUp, Shield, Zap, ArrowLeft, Loader2, Clock, CheckCircle } from "lucide-react";

export default function PartnerB2B() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    linkedin: "",
    instagram: "",
    company_name: "",
    cnpj: "",
    trading_volume_monthly: "",
    notes: "",
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
        .eq('request_type', 'b2b_otc')
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (data) {
        setExistingRequest(data);
        
        // If approved, redirect to B2B OTC environment
        if (data.status === 'approved') {
          navigate('/partner/b2b-otc');
        }
      }
    } catch (error) {
      console.error('Error checking request:', error);
    } finally {
      setIsCheckingRequest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('partner_requests')
        .insert({
          name: formData.company_name,
          phone: formData.phone,
          linkedin: formData.linkedin,
          instagram: formData.instagram,
          request_type: 'b2b_otc',
          status: 'pending',
          user_id: user?.id || null,
          notes: `Responsável: ${formData.name}\nCNPJ: ${formData.cnpj}\nVolume Mensal: R$ ${formData.trading_volume_monthly}\n\nObservações: ${formData.notes}`,
          trading_volume_monthly: parseFloat(formData.trading_volume_monthly) || 0,
        });

      if (error) throw error;

      toast.success("Solicitação enviada com sucesso! Em breve entraremos em contato.");
      
      if (user) {
        checkExistingRequest();
      } else {
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error: any) {
      console.error("Error submitting B2B partner request:", error);
      toast.error(`Erro ao enviar solicitação: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Building2 className="h-10 w-10 text-primary" />
              Parceria B2B - Mesas OTC
            </h1>
            <p className="text-muted-foreground mt-2">
              Opere com markup diferenciado e potencialize seus resultados
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Benefits */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-primary/10 p-4 rounded-full">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Markup Personalizado</h3>
                <p className="text-sm text-muted-foreground">
                  Markup personalizado com condições especiais para sua operação
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Operação Ágil</h3>
                <p className="text-sm text-muted-foreground">
                  Acesso direto à plataforma com cotações em tempo real e travamento de preço
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Suporte Dedicado</h3>
                <p className="text-sm text-muted-foreground">
                  Atendimento prioritário e condições especiais para mesas parceiras
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Solicitar Parceria B2B</CardTitle>
            <CardDescription>
              Preencha os dados da sua mesa OTC para iniciar o processo de parceria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCheckingRequest ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-4">Verificando solicitação...</p>
              </div>
            ) : existingRequest ? (
              <div className="text-center space-y-6 py-8">
                {existingRequest.status === 'pending' && (
                  <>
                    <div className="bg-yellow-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                      <Clock className="h-12 w-12 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl mb-2">Solicitação em Análise</h3>
                      <p className="text-lg text-muted-foreground">
                        Sua solicitação B2B foi enviada em{' '}
                        {new Date(existingRequest.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg mt-4 text-left max-w-md mx-auto">
                        <p className="text-sm text-muted-foreground">
                          <strong>Status:</strong> Aguardando aprovação
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Nossa equipe comercial está analisando sua proposta. 
                          Você receberá um retorno em até <strong>24h úteis</strong>.
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {existingRequest.status === 'approved' && (
                  <>
                    <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl text-green-700 mb-2">Parceria B2B Ativa! 🎉</h3>
                      <p className="text-lg text-muted-foreground">
                        Sua mesa OTC foi aprovada e está ativa na plataforma
                      </p>
                      <Button 
                        onClick={() => navigate('/dashboard')} 
                        className="mt-4"
                        size="lg"
                      >
                        Acessar Plataforma
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Dados da Empresa</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nome da Mesa OTC *</Label>
                    <Input
                      id="company_name"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Ex: Crypto Trading LTDA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      required
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trading_volume_monthly">Volume Mensal Estimado (R$) *</Label>
                  <Input
                    id="trading_volume_monthly"
                    type="number"
                    required
                    value={formData.trading_volume_monthly}
                    onChange={(e) => setFormData({ ...formData, trading_volume_monthly: e.target.value })}
                    placeholder="500000"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Dados do Responsável</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(41) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn (opcional)</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/seu-perfil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram (opcional)</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@sua_mesa"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Informações Adicionais (opcional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Conte-nos um pouco mais sobre sua mesa OTC e expectativas de parceria..."
                  rows={4}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-2">Como funciona:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Análise da sua solicitação em até 24h úteis</li>
                  <li>Contato da nossa equipe para validação e configuração do markup</li>
                  <li>Aprovação e acesso à plataforma com preços diferenciados</li>
                  <li>Suporte contínuo e condições exclusivas</li>
                </ol>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Solicitar Parceria B2B
              </Button>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
