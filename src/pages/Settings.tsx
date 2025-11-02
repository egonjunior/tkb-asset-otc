import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut, Settings as SettingsIcon, ExternalLink, User, Phone, Mail, MapPin, Linkedin, Instagram, Twitter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import tkbLogo from "@/assets/tkb-logo.png";
import { formatPhone } from "@/lib/validators";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    linkedin: "",
    instagram: "",
    twitter: "",
  });

  const [originalData, setOriginalData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const data = {
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        linkedin: profile.linkedin || "",
        instagram: profile.instagram || "",
        twitter: profile.twitter || "",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email é opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Validações
    if (formData.email && !validateEmail(formData.email)) {
      toast({
        title: "❌ E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          linkedin: formData.linkedin || null,
          instagram: formData.instagram || null,
          twitter: formData.twitter || null,
        })
        .eq("id", user?.id);

      if (error) throw error;

      setOriginalData(formData);

      toast({
        title: "✅ Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível atualizar seu perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-tkb-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220,15%,92%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220,15%,92%)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="h-20 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white border-b border-neutral-700 shadow-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/dashboard')}
              >
                <img src={tkbLogo} alt="TKB Asset" className="h-12 w-12" />
                <div>
                  <h1 className="text-2xl font-brand">TKB ASSET</h1>
                  <p className="text-xs text-neutral-300 font-inter uppercase tracking-wider">Mesa OTC</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-inter hidden sm:inline">
                  Olá, <strong className="font-semibold">{userName}</strong>
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10"
                  onClick={() => navigate('/settings')}
                >
                  <SettingsIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <ExternalLink className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-neutral-600 text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Layout com Sidebar e Conteúdo */}
        <SidebarProvider defaultOpen={true} style={{ ["--sidebar-width" as any]: "12rem" }}>
          <div className="flex w-full min-h-[calc(100vh-80px)]">
            {/* Sidebar */}
            <AppSidebar />

            {/* Main Content */}
            <main className="flex-1 px-6 py-10">
              <div className="max-w-4xl mx-auto space-y-8">
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
                    <SettingsIcon className="h-8 w-8 text-primary" />
                    Configurações do Perfil
                  </h1>
                  <p className="text-muted-foreground">Gerencie suas informações pessoais e de contato</p>
                </div>

                {/* Dados Pessoais */}
                <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="document_type">Tipo de Documento</Label>
                        <Input
                          id="document_type"
                          value={profile?.document_type || ""}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document_number">Número do Documento</Label>
                      <Input
                        id="document_number"
                        value={profile?.document_number || ""}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Os dados de documento não podem ser alterados</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações de Contato */}
                <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <Phone className="h-4 w-4 inline mr-1" />
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Mail className="h-4 w-4 inline mr-1" />
                          E-mail de Contato
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contato@exemplo.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Endereço Completo
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Redes Sociais */}
                <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5 text-primary" />
                      Redes Sociais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">
                        <Linkedin className="h-4 w-4 inline mr-1" />
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/usuario"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">
                          <Instagram className="h-4 w-4 inline mr-1" />
                          Instagram
                        </Label>
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                          placeholder="@usuario"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">
                          <Twitter className="h-4 w-4 inline mr-1" />
                          Twitter/X
                        </Label>
                        <Input
                          id="twitter"
                          value={formData.twitter}
                          onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                          placeholder="@usuario"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Botões de Ação */}
                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="premium"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default Settings;
