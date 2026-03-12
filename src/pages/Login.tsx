import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import tkbLogo from "@/assets/tkb-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in and redirect based on role
    const checkSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is admin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roles) {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    };
    checkSessionAndRole();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Erro no login",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo à TKB Asset",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message === "Invalid login credentials"
          ? "Email ou senha incorretos"
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] p-4 relative overflow-hidden font-inter">
      {/* Subtle Premium Bokeh */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00D4FF]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4A853]/3 blur-[120px] rounded-full" />

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-2xl border-white/[0.05] relative z-10 shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-2xl bg-black border border-white/[0.08] flex items-center justify-center shadow-2xl relative group">
              <div className="absolute inset-0 bg-[#00D4FF]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10 relative z-10" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-brand tracking-widest text-white">TKB ASSET</CardTitle>
            <CardDescription className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00D4FF]">
              Institutional OTC Desk
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-white/30 font-mono">ID Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@tkbasset.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/[0.02] border-white/[0.05] text-white placeholder:text-white/10 h-11 text-sm focus:border-[#00D4FF]/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-white/30 font-mono">Chave de Acesso</Label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[9px] uppercase tracking-widest text-[#00D4FF]/60 hover:text-[#00D4FF] transition-colors"
                >
                  Recuperar
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/[0.02] border-white/[0.05] text-white placeholder:text-white/10 h-11 text-sm focus:border-[#00D4FF]/30 transition-all"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-bold text-xs uppercase tracking-[0.2em] transition-apple shadow-lg active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? "Autenticando..." : "Entrar na Mesa"}
            </Button>

            <div className="pt-2 flex flex-col gap-4 text-center">
              <div className="text-[11px] text-white/30">
                Novo investidor?{" "}
                <Link to="/register" className="text-[#D4A853] hover:text-[#D4A853]/80 font-medium transition-colors">
                  Abrir Conta Institucional
                </Link>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

              <div className="text-[9px] uppercase tracking-[0.25em] text-white/10 font-mono">
                Acesso Restrito · Criptografia de Ponta a Ponta
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
