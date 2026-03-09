import { FileText, Handshake, MessageCircle, Settings, Receipt, BarChart2, History } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPartner } = useAuth();

  const items = [
    { title: "Analytics", url: "/analytics", icon: BarChart2 },
    { title: "Histórico", url: "/dashboard#historico", icon: History },
    { title: "Meus Documentos", url: "/documents", icon: FileText },
    { title: "Notas Operacionais", url: "/dashboard#notas", icon: Receipt },
    { title: "Configurações", url: "/settings", icon: Settings },
    {
      title: isPartner ? "Dashboard Parceiro Comercial" : "Parceiro Comercial",
      url: isPartner ? "/partner/dashboard" : "/parceiro",
      icon: Handshake
    },
    { title: "Suporte", url: "/suporte", icon: MessageCircle },
  ];

  const isActive = (path: string) => {
    if (path.includes('#')) {
      const [base] = path.split('#');
      return location.pathname === base; // Basic matching for hash routes
    }
    return location.pathname === path;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.04] bg-[#0A0A0A] md:top-[64px] md:h-[calc(100svh-64px)]">
      {/* Botão X para fechar no mobile */}
      <div className="flex justify-end p-2 md:hidden">
        <SidebarTrigger className="text-white/50 hover:text-white" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 tracking-widest font-mono text-[10px] uppercase">Ações Rápidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => {
                      if (item.url.includes('#')) {
                        const [base, hash] = item.url.split('#');
                        if (location.pathname !== base) {
                          navigate(base);
                        }
                        setTimeout(() => {
                          const el = document.getElementById(hash);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        navigate(item.url);
                      }
                    }}
                    isActive={isActive(item.url)}
                    tooltip={state === "collapsed" ? item.title : undefined}
                    className="hover:bg-white/[0.04] hover:text-white text-white/60 transition-colors"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
