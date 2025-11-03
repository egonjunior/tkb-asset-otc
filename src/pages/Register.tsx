import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Coins, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { registerSchema, type RegisterFormData, formatCPF, formatCNPJ } from "@/lib/validators";
import tkbLogo from "@/assets/tkb-logo.png";
import { TermsModal } from "@/components/documents/TermsModal";

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      documentType: "CPF",
      acceptTerms: false
    }
  });

  const documentType = watch("documentType");
  const documentNumber = watch("documentNumber");

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = documentType === "CPF" ? formatCPF(value) : formatCNPJ(value);
    setValue("documentNumber", formatted);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            document_type: data.documentType,
            document_number: data.documentNumber.replace(/\D/g, '')
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para fazer login.",
      });

      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] p-4 relative overflow-hidden">
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(195,100%,92%),transparent_50%),radial-gradient(ellipse_at_bottom_left,_hsl(220,60%,95%),transparent_50%)] opacity-40"></div>
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-noise"></div>

      <Card className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative z-10">
        <CardHeader className="space-y-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
            onClick={() => navigate("/login")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-brand">TKB ASSET</CardTitle>
            <CardDescription className="text-base mt-2 font-medium">
              Criar nova conta
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo / Razão Social *</Label>
              <Input
                id="fullName"
                placeholder="João Silva / Empresa LTDA"
                {...register("fullName")}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <RadioGroup
                value={documentType}
                onValueChange={(value) => {
                  setValue("documentType", value as "CPF" | "CNPJ");
                  setValue("documentNumber", "");
                }}
                className="flex gap-4"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CPF" id="cpf" />
                  <Label htmlFor="cpf" className="cursor-pointer font-normal">CPF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CNPJ" id="cnpj" />
                  <Label htmlFor="cnpj" className="cursor-pointer font-normal">CNPJ</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">
                {documentType === "CPF" ? "CPF" : "CNPJ"} *
              </Label>
              <Input
                id="documentNumber"
                placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                value={documentNumber || ""}
                onChange={handleDocumentChange}
                maxLength={documentType === "CPF" ? 14 : 18}
                disabled={isLoading}
              />
              {errors.documentNumber && (
                <p className="text-xs text-destructive">{errors.documentNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={watch("acceptTerms")}
                onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                disabled={isLoading}
              />
              <Label className="text-sm font-normal leading-relaxed">
                Li e aceito os{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Termos de Uso e Política de Privacidade
                </button>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </div>
  );
};

export default Register;
