import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Info, AlertTriangle, Zap, RefreshCw, ArrowLeft, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotifType = "info" | "warning" | "alert" | "update";

interface Notification {
    id: string;
    title: string;
    body: string;
    type: NotifType;
    created_at: string;
}

const TYPE_META: Record<NotifType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    info: { label: "Informação", color: "text-blue-400", bg: "border-blue-500/20 bg-blue-500/5", icon: Info },
    warning: { label: "Atenção", color: "text-yellow-400", bg: "border-yellow-500/20 bg-yellow-500/5", icon: AlertTriangle },
    alert: { label: "Urgente", color: "text-red-400", bg: "border-red-500/20 bg-red-500/5", icon: Zap },
    update: { label: "Atualização", color: "text-green-400", bg: "border-green-500/20 bg-green-500/5", icon: RefreshCw },
};

export default function NotificacoesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<NotifType | "all">("all");

    const fetchAll = useCallback(async () => {
        if (!user) return;
        const [{ data: notifs }, { data: reads }] = await Promise.all([
            supabase.from("notifications").select("*").order("created_at", { ascending: false }),
            supabase.from("notification_reads").select("notification_id").eq("user_id", user.id),
        ]);
        if (notifs) setNotifications(notifs as Notification[]);
        if (reads) setReadIds(new Set(reads.map((r) => r.notification_id)));
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Mark all as read on mount
    useEffect(() => {
        if (!user || notifications.length === 0) return;
        const unread = notifications.filter((n) => !readIds.has(n.id));
        if (unread.length === 0) return;
        supabase.from("notification_reads").upsert(
            unread.map((n) => ({ notification_id: n.id, user_id: user.id }))
        );
        setReadIds(new Set(notifications.map((n) => n.id)));
    }, [notifications, user]);

    const displayed = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);
    const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

    return (
        <div className="dark min-h-screen bg-[#0A0A0A] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/[0.05]">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/dashboard")}
                        className="text-white/50 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-[#00D4FF]" />
                        <h1 className="text-lg font-semibold">Caixa Postal</h1>
                        {unreadCount > 0 && (
                            <Badge className="bg-[#00D4FF] text-black text-xs font-bold px-2">
                                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(["all", "info", "warning", "alert", "update"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f
                                    ? "bg-[#00D4FF] text-black"
                                    : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white"
                                }`}
                        >
                            {f === "all" ? `Todas (${notifications.length})` : TYPE_META[f].label}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 rounded-full border-2 border-[#00D4FF] border-r-transparent animate-spin" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-white/20">
                        <Bell className="h-14 w-14 mb-4" />
                        <p className="text-base font-medium text-white/30">Nenhuma mensagem aqui</p>
                        <p className="text-sm mt-1">Novas notificações da TKB aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayed.map((n) => {
                            const meta = TYPE_META[n.type as NotifType] || TYPE_META.info;
                            const Icon = meta.icon;
                            const isRead = readIds.has(n.id);
                            return (
                                <div
                                    key={n.id}
                                    className={`rounded-xl border p-5 transition-all ${meta.bg} ${!isRead ? "ring-1 ring-[#00D4FF]/20" : "opacity-70"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg bg-current/10 flex-shrink-0 ${meta.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                                                    {!isRead && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] flex-shrink-0" />
                                                    )}
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${meta.color} border-current/30`}>
                                                    {meta.label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-white/65 leading-relaxed">{n.body}</p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-[11px] text-white/30">
                                                    TKB Asset · {new Date(n.created_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
                                                </span>
                                                {isRead && (
                                                    <span className="flex items-center gap-1 text-[11px] text-white/25">
                                                        <CheckCheck className="h-3 w-3" /> Lida
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
