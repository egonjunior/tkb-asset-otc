import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, FileText, MessageCircle, Handshake, LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderUserMenuProps {
    userName: string;
    userEmail?: string;
    onLogout: () => void;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function HeaderUserMenu({ userName, userEmail, onLogout }: HeaderUserMenuProps) {
    const navigate = useNavigate();
    const { isPartner } = useAuth();
    const initials = getInitials(userName);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="header-user-trigger group">
                    {/* Avatar with gold ring */}
                    <div className="avatar-ring">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-[hsl(220,25%,12%)] text-[hsl(45,60%,58%)] text-xs font-semibold font-mono tracking-wider">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Name & Role — hidden on small screens */}
                    <div className="hidden md:flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium text-foreground truncate max-w-[140px] leading-tight">
                            {userName}
                        </span>
                        <span className="badge-role">
                            Operador
                        </span>
                    </div>

                    {/* Chevron */}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-56 bg-[hsl(220,25%,8%)] border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-xl p-1.5"
            >
                {/* User info header */}
                <DropdownMenuLabel className="px-3 py-3 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="avatar-ring">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[hsl(220,25%,12%)] text-[hsl(45,60%,58%)] text-sm font-semibold font-mono">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
                            {userEmail && (
                                <span className="text-[11px] text-muted-foreground truncate">{userEmail}</span>
                            )}
                            <span className="badge-role mt-1">Operador</span>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-white/[0.06] mx-2" />

                {/* Navigation items */}
                <div className="py-1">
                    <DropdownMenuItem
                        onClick={() => navigate("/settings")}
                        className="px-3 py-2.5 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground gap-3 transition-colors"
                    >
                        <Settings className="h-4 w-4" />
                        Configurações
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => navigate("/documents")}
                        className="px-3 py-2.5 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground gap-3 transition-colors"
                    >
                        <FileText className="h-4 w-4" />
                        Meus Documentos
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => navigate(isPartner ? "/partner/dashboard" : "/parceiro")}
                        className="px-3 py-2.5 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground gap-3 transition-colors"
                    >
                        <Handshake className="h-4 w-4" />
                        {isPartner ? "Painel Parceiro" : "Seja um Parceiro"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => navigate("/suporte")}
                        className="px-3 py-2.5 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground gap-3 transition-colors"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Suporte
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-white/[0.06] mx-2" />

                {/* Logout */}
                <div className="py-1">
                    <DropdownMenuItem
                        onClick={onLogout}
                        className="px-3 py-2.5 rounded-lg cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] focus:bg-red-500/[0.08] focus:text-red-300 gap-3 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair da Conta
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
