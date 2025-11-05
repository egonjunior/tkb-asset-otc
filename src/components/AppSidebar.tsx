import { FileText, Handshake, MessageCircle, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

const items = [
  { title: "Meus Documentos", url: "/documents", icon: FileText },
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Seja um Parceiro", url: "/parceiro", icon: Handshake },
  { title: "Suporte", url: "/suporte", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r md:top-[80px] md:h-[calc(100svh-80px)]">
      {/* Botão X para fechar no mobile */}
      <div className="flex justify-end p-2 md:hidden">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Ações Rápidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={state === "collapsed" ? item.title : undefined}
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
