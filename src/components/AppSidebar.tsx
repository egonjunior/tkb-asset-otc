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
    { title: "Dashboard", url: "/dashboard", icon: BarChart2 },
    { title: "Histórico", url: "/dashboard#historico", icon: History },
    { title: "Meus Documentos", url: "/documents", icon: FileText },
    { title: "Notas Operacionais", url: "/dashboard#notas", icon: Receipt },
    { title: "Configurações", url: "/settings", icon: Settings },
    {
      title: isPartner ? "Dashboard Parceiro" : "Parceiro Comercial",
      url: isPartner ? "/partner/dashboard" : "/parceiro",
      icon: Handshake
    },
    { title: "Suporte", url: "/suporte", icon: MessageCircle },
  ];

  const isActive = (path: string) => {
    if (path.includes('#')) {
      const [base] = path.split('#');
      return location.pathname === base;
    }
    return location.pathname === path;
  };

  return (
    <Sidebar collapsible="none" className="border-r border-white/[0.02] bg-black md:top-[64px] md:h-[calc(100svh-64px)] !w-[18rem]">
      {/* Botão X para fechar no mobile */}
      <div className="flex justify-end p-2 md:hidden">
        <SidebarTrigger className="text-white/20 hover:text-white transition-colors" />
      </div>

      <SidebarContent className="px-2 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[9px] font-mono uppercase tracking-[0.3em] text-white/20 h-8 flex items-center">
            Mesa de Operações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 mt-2">
              {items.map((item) => {
                const active = isActive(item.url);
                return (
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
                      isActive={active}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      className={`
                        h-9 px-3 rounded-lg transition-all group
                        ${active
                          ? "bg-[#00D4FF]/5 text-[#00D4FF]"
                          : "text-white/40 hover:bg-white/[0.02] hover:text-white"
                        }
                      `}
                    >
                      <item.icon className={`w-[16px] h-[16px] ${active ? "text-[#00D4FF]" : "group-hover:text-white/80 transition-colors"}`} />
                      <span className="font-medium text-[12px] tracking-tight ml-3">{item.title}</span>
                      {active && (
                        <div className="absolute left-0 w-0.5 h-4 bg-[#00D4FF] rounded-r-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-3 pb-4">
          <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl">
            <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 mb-1.5">Mesa OTC · Status</p>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#10B981] shadow-[0_0_4px_#10B981]" />
              <span className="text-[10px] font-medium text-white/40">Sincronizado</span>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
