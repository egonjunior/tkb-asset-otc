import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Info, AlertTriangle, Zap, RefreshCw } from "lucide-react";

type NotifType = "info" | "warning" | "alert" | "update";

interface Notification {
    id: string;
    title: string;
    body: string;
    type: NotifType;
    created_at: string;
}

const TYPE_ICON: Record<NotifType, React.ElementType> = {
    info: Info,
    warning: AlertTriangle,
    alert: Zap,
    update: RefreshCw,
};

const TYPE_COLOR: Record<NotifType, string> = {
    info: "text-blue-400",
    warning: "text-yellow-400",
    alert: "text-red-400",
    update: "text-green-400",
};

export function BellNotifications({ userId }: { userId: string }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    const fetchAll = useCallback(async () => {
        const db = supabase as any;
        const [{ data: notifs }, { data: reads }] = await Promise.all([
            db.from("notifications").select("*").order("created_at", { ascending: false }).limit(30),
            db.from("notification_reads").select("notification_id").eq("user_id", userId),
        ]);
        if (notifs) setNotifications(notifs as Notification[]);
        if (reads) setReadIds(new Set((reads as any[]).map((r) => r.notification_id)));
    }, [userId]);

    useEffect(() => {
        fetchAll();

        // Realtime: new notification → re-fetch
        const channel = supabase
            .channel("notifications-bell")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, fetchAll)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchAll]);

    const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

    const markRead = async (id: string) => {
        if (readIds.has(id)) return;
        await (supabase as any).from("notification_reads").upsert({ notification_id: id, user_id: userId });
        setReadIds((prev) => new Set([...prev, id]));
    };

    const markAllRead = async () => {
        const unread = notifications.filter((n) => !readIds.has(n.id));
        if (unread.length === 0) return;
        await (supabase as any).from("notification_reads").upsert(
            unread.map((n) => ({ notification_id: n.id, user_id: userId }))
        );
        setReadIds(new Set(notifications.map((n) => n.id)));
    };

    const goInbox = () => {
        setOpen(false);
        markAllRead();
        navigate("/notificacoes");
    };

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                onClick={() => { setOpen(!open); if (!open) fetchAll(); }}
                className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/[0.06] transition-colors text-white/60 hover:text-white"
                aria-label="Notificações"
            >
                <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-[#00D4FF] text-black text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-11 w-80 z-50 rounded-xl border border-white/[0.07] bg-[#0d0d0d] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-sm font-semibold text-white">Notificações</p>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[11px] text-[#00D4FF] hover:underline"
                                >
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-white/30">
                                    <Bell className="h-8 w-8 mb-2" />
                                    <p className="text-xs">Sem notificações</p>
                                </div>
                            ) : (
                                notifications.slice(0, 5).map((n) => {
                                    const isUnread = !readIds.has(n.id);
                                    const Icon = TYPE_ICON[n.type] || Info;
                                    const color = TYPE_COLOR[n.type] || "text-blue-400";
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => markRead(n.id)}
                                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0 ${isUnread ? "bg-white/[0.025]" : ""}`}
                                        >
                                            <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${color}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                                                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] flex-shrink-0" />}
                                                </div>
                                                <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 mt-0.5">{n.body}</p>
                                                <p className="text-[10px] text-white/30 mt-1">
                                                    {new Date(n.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-white/[0.06]">
                            <button
                                onClick={goInbox}
                                className="w-full text-center text-xs text-[#00D4FF] hover:underline"
                            >
                                Ver caixa postal completa →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
