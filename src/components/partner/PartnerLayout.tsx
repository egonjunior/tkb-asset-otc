import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Users, BarChart3, Wallet, Settings,
    MessageCircle, LogOut, ChevronLeft, Menu, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import tkbLogo from "@/assets/tkb-logo.png";

interface PartnerLayoutProps {
    children: React.ReactNode;
    partnerName?: string;
    partnerId?: string;
}

const menuItems = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard, path: "/partner/b2b-otc" },
    { id: "clients", label: "Clientes", icon: Users, path: "/partner/clients" },
    { id: "reports", label: "Relatórios", icon: BarChart3, path: "/partner/reports" },
    { id: "financial", label: "Financeiro", icon: Wallet, path: "/partner/financial" },
    { id: "settings", label: "Configurações", icon: Settings, path: "/settings" },
];

const bottomItems = [
    { id: "support", label: "Suporte", icon: MessageCircle, path: "/suporte" },
];

export function PartnerLayout({ children, partnerName = "Parceiro", partnerId = "#TKB-00000" }: PartnerLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="dark min-h-screen bg-[#0A0A0A] flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:sticky top-0 left-0 z-50
        w-64 h-screen bg-[#0D0D0D] border-r border-white/[0.04]
        flex flex-col transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Sidebar Header */}
                <div className="p-5 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={tkbLogo} alt="TKB Asset" className="h-9 w-9" />
                            <div>
                                <h2 className="text-sm font-semibold text-white truncate">{partnerName}</h2>
                                <p className="text-[10px] font-mono text-white/40 tracking-wider">{partnerId}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04]"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.15em] text-white/25">Menu</p>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                navigate(item.path);
                                setSidebarOpen(false);
                            }}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isActive(item.path)
                                    ? 'bg-[#00D4FF]/[0.08] text-[#00D4FF] border border-[#00D4FF]/[0.12]'
                                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80 border border-transparent'
                                }
              `}
                        >
                            <item.icon className="w-[18px] h-[18px]" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-white/[0.04] space-y-1">
                    {bottomItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                        >
                            <item.icon className="w-[18px] h-[18px]" />
                            {item.label}
                        </button>
                    ))}
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile header */}
                <div className="lg:hidden sticky top-0 z-30 h-14 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/[0.04] flex items-center px-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.04]"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="ml-3 text-sm font-semibold text-white">Portal Parceiro</span>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
