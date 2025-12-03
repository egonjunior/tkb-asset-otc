import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import tkbLogo from "@/assets/tkb-logo.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(195,100%,92%),transparent_50%),radial-gradient(ellipse_at_bottom_left,_hsl(220,60%,95%),transparent_50%)] opacity-40"></div>
        <div className="absolute inset-0 opacity-[0.015] bg-noise"></div>

        <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative z-10">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-brand font-bold">Email Enviado!</h2>
              <p className="text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Não recebeu? Verifique sua pasta de spam ou tente novamente.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setEmailSent(false)}
                className="w-full"
              >
                Tentar outro email
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(195,100%,92%),transparent_50%),radial-gradient(ellipse_at_bottom_left,_hsl(220,60%,95%),transparent_50%)] opacity-40"></div>
      <div className="absolute inset-0 opacity-[0.015] bg-noise"></div>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative z-10">
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
          
          <div className="flex justify-center pt-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-brand">Esqueceu sua senha?</CardTitle>
            <CardDescription className="text-base mt-2">
              Informe seu email e enviaremos um link para redefinir sua senha
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email cadastrado</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Lembrou a senha?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
