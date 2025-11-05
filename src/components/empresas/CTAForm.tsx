import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Zap, BarChart3, Mail, Phone, MapPin, Building } from "lucide-react";

const formSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email_corporativo: z.string().email("Email inválido"),
  volume_mensal: z.string().min(1, "Selecione uma opção"),
  necessidade: z.string().min(1, "Selecione uma opção"),
  necessidade_outro: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export function CTAForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarOutro, setMostrarOutro] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const necessidadeValue = watch("necessidade");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('submit-lead', {
        body: data
      });

      if (error) throw error;

      toast.success("Simulação solicitada com sucesso! Entraremos em contato em até 2 horas úteis.");
      reset();
      setMostrarOutro(false);
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error("Erro ao enviar formulário. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="cta-form" className="py-24 bg-gradient-to-br from-[hsl(186,100%,50%)] to-[hsl(220,100%,40%)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              PRONTO PARA ECONOMIZAR?
            </h2>
            <p className="text-xl text-white/90">
              Receba simulação personalizada em 2 horas:
            </p>
          </div>

          {/* Formulário */}
          <Card className="p-8 bg-white/95 backdrop-blur">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome completo */}
              <div>
                <Label htmlFor="nome_completo" className="text-[hsl(220,25%,15%)] font-semibold">
                  Nome completo *
                </Label>
                <Input
                  id="nome_completo"
                  placeholder="João Silva"
                  {...register("nome_completo")}
                  className="mt-2"
                />
                {errors.nome_completo && (
                  <p className="text-sm text-red-500 mt-1">{errors.nome_completo.message}</p>
                )}
              </div>

              {/* Email corporativo */}
              <div>
                <Label htmlFor="email_corporativo" className="text-[hsl(220,25%,15%)] font-semibold">
                  Email corporativo *
                </Label>
                <Input
                  id="email_corporativo"
                  type="email"
                  placeholder="joao@empresa.com.br"
                  {...register("email_corporativo")}
                  className="mt-2"
                />
                {errors.email_corporativo && (
                  <p className="text-sm text-red-500 mt-1">{errors.email_corporativo.message}</p>
                )}
              </div>

              {/* Volume mensal */}
              <div>
                <Label className="text-[hsl(220,25%,15%)] font-semibold mb-3 block">
                  Volume mensal aproximado *
                </Label>
                <RadioGroup {...register("volume_mensal")} className="grid sm:grid-cols-2 gap-3">
                  {["R$ 100k-500k", "R$ 500k-2M", "R$ 2M-10M", "R$ 10M+"].map((option) => (
                    <div key={option}>
                      <RadioGroupItem
                        value={option}
                        id={option}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option}
                        className="flex items-center justify-center px-4 py-3 bg-white/50 border-2 border-gray-200 rounded-lg cursor-pointer peer-data-[state=checked]:border-[hsl(186,100%,50%)] peer-data-[state=checked]:bg-[hsl(186,100%,95%)] hover:bg-white/80 transition-all"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.volume_mensal && (
                  <p className="text-sm text-red-500 mt-1">{errors.volume_mensal.message}</p>
                )}
              </div>

              {/* Principal necessidade */}
              <div>
                <Label className="text-[hsl(220,25%,15%)] font-semibold mb-3 block">
                  Principal necessidade *
                </Label>
                <RadioGroup 
                  {...register("necessidade")} 
                  onValueChange={(value) => setMostrarOutro(value === "Outro")}
                  className="space-y-3"
                >
                  {[
                    "Remessas internacionais (SWIFT)",
                    "Conversão BRL→USDT (Exchange)",
                    "Liquidez para operações",
                    "Outro"
                  ].map((option) => (
                    <div key={option}>
                      <RadioGroupItem
                        value={option}
                        id={option}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option}
                        className="flex items-center px-4 py-3 bg-white/50 border-2 border-gray-200 rounded-lg cursor-pointer peer-data-[state=checked]:border-[hsl(186,100%,50%)] peer-data-[state=checked]:bg-[hsl(186,100%,95%)] hover:bg-white/80 transition-all"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {mostrarOutro && necessidadeValue === "Outro" && (
                  <Input
                    placeholder="Descreva sua necessidade..."
                    {...register("necessidade_outro")}
                    className="mt-3"
                  />
                )}
                
                {errors.necessidade && (
                  <p className="text-sm text-red-500 mt-1">{errors.necessidade.message}</p>
                )}
              </div>

              {/* Botão Primário */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full text-lg py-6 bg-white text-[hsl(186,100%,50%)] hover:bg-white/90 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? "ENVIANDO..." : "RECEBER SIMULAÇÃO GRATUITA →"}
              </Button>

              {/* Divisor */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>

              {/* Botão Secundário */}
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full text-lg py-6 border-2 border-[hsl(186,100%,50%)] text-[hsl(186,100%,50%)] hover:bg-[hsl(186,100%,95%)]"
                onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
              >
                FALAR COM ESPECIALISTA
              </Button>
            </form>

            {/* Trust Badges */}
            <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-[hsl(215,16%,47%)]">
                <Lock className="h-5 w-5 text-[hsl(142,71%,45%)]" />
                <span>Seus dados protegidos (LGPD)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[hsl(215,16%,47%)]">
                <Zap className="h-5 w-5 text-[hsl(142,71%,45%)]" />
                <span>Resposta em até 2 horas úteis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[hsl(215,16%,47%)]">
                <BarChart3 className="h-5 w-5 text-[hsl(142,71%,45%)]" />
                <span>Simulação sem compromisso</span>
              </div>
            </div>
          </Card>

          {/* Rodapé - Informações de Contato */}
          <Card className="p-6 bg-black/20 backdrop-blur border-white/20 text-white">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">TKB Asset</h3>
                <p className="text-sm text-white/80">Mesa OTC BRL → USDT</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>contato@tkbasset.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>WhatsApp: +55 11 99999-9999</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>São Paulo, Brasil</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>CNPJ: XX.XXX.XXX/0001-XX</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
