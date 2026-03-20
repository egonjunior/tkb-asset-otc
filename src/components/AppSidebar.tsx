import {
  FileText, Handshake, MessageCircle, Settings, Receipt,
  BarChart2, History, Users, ShieldCheck,
  LayoutDashboard, FileCheck, DollarSign,
  Bell, Newspaper, Zap, Users2
} from "lucide-react";
import { useState } from "react";
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
import { MeetingAgentModal } from "@/components/MeetingAgentModal";

export function AppSidebar({ forceAdmin = false }: { forceAdmin?: boolean }) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPartner, isAdmin: isUserAdmin } = useAuth();
  const [meetingOpen, setMeetingOpen] = useState(false);

  const isAdminRoute = forceAdmin || location.pathname.startsWith('/admin');

  const clientItems = [
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

  const adminItems = [
    { title: "Dashboard Admin", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Gestão de Usuários", url: "/admin/users", icon: Users },
    { title: "Validação de Contratos", url: "/admin/documents", icon: FileCheck },
    { title: "Precificação Exclusive", url: "/admin/pricing", icon: DollarSign },
    { title: "Operações OKX", url: "/admin/okx-operations", icon: Zap },
    { title: "Notas Operacionais", url: "/admin/operational-notes", icon: Receipt },
    { title: "Leads Empresas", url: "/admin/leads", icon: MessageCircle },
    { title: "Blog & Marketing", url: "/admin/blog", icon: Newspaper },
    { title: "Notificações", url: "/admin/notifications", icon: Bell },
    { title: "Compliance PLD", url: "/admin/pld-compliance", icon: ShieldCheck },
  ];

  if (isAdminRoute) {
    adminItems.push({ title: "Voltar ao App", url: "/dashboard", icon: BarChart2 });
  }

  const items = isAdminRoute ? adminItems : clientItems;

  const isActive = (path: string) => {
    if (path.includes('#')) {
      const [base] = path.split('#');
      return location.pathname === base;
    }
    return location.pathname === path;
  };

  const isMeetingActive = location.pathname === "/meeting";

  return (
    <>
      <MeetingAgentModal open={meetingOpen} onClose={() => setMeetingOpen(false)} />

      <Sidebar
        collapsible="offcanvas"
        className={[
          "border-r border-white/[0.02] bg-black",
          !isAdminRoute ? "md:top-[64px] md:h-[calc(100svh-64px)]" : "",
        ].join(" ")}
      >
        {/* Botão X para fechar no mobile */}
        <div className="flex justify-end p-2 md:hidden">
          <SidebarTrigger className="text-white/20 hover:text-white transition-colors" />
        </div>

        <SidebarContent className="px-2 py-6">
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[9px] font-mono uppercase tracking-[0.3em] text-white/20 h-8 flex items-center">
              {isAdminRoute ? "Administração" : "Mesa de Operações"}
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

          {/* Meeting Squad — separado na parte inferior */}
          <div className="mt-4 px-1">
            <div className="h-px bg-white/[0.04] mb-3" />
            <SidebarGroupLabel className="px-3 text-[9px] font-mono uppercase tracking-[0.3em] text-white/20 h-6 flex items-center mb-1">
              Agentes IA
            </SidebarGroupLabel>
            <button
              onClick={() => setMeetingOpen(true)}
              className={`
                w-full flex items-center gap-3 h-9 px-3 rounded-lg transition-all group relative
                ${isMeetingActive
                  ? "bg-[#00D4FF]/5 text-[#00D4FF]"
                  : "text-white/40 hover:bg-white/[0.02] hover:text-white"
                }
              `}
            >
              <Users2 className={`w-[16px] h-[16px] flex-none ${isMeetingActive ? "text-[#00D4FF]" : "group-hover:text-white/80 transition-colors"}`} />
              {state !== "collapsed" && (
                <span className="font-medium text-[12px] tracking-tight">Meeting Squad</span>
              )}
              {state !== "collapsed" && (
                <span className="ml-auto text-[9px] font-mono bg-[#00D4FF]/10 text-[#00D4FF] px-1.5 py-0.5 rounded-md border border-[#00D4FF]/20">
                  IA
                </span>
              )}
              {isMeetingActive && (
                <div className="absolute left-0 w-0.5 h-4 bg-[#00D4FF] rounded-r-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
              )}
            </button>
          </div>

          <div className="mt-auto px-3 pb-4">
            <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 mb-1.5">
                {isAdminRoute ? "Painel Admin · v2.0" : "Mesa OTC · Status"}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#10B981] shadow-[0_0_4px_#10B981]" />
                <span className="text-[10px] font-medium text-white/40">Sincronizado</span>
              </div>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
