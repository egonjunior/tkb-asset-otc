import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, Bell, Info, AlertTriangle, Zap, RefreshCw, Trash2 } from "lucide-react";

type NotifType = "info" | "warning" | "alert" | "update";

interface Notification {
    id: string;
    title: string;
    body: string;
    type: NotifType;
    created_at: string;
}

const TYPE_META: Record<NotifType, { label: string; color: string; icon: React.ElementType }> = {
    info: { label: "Informação", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Info },
    warning: { label: "Atenção", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: AlertTriangle },
    alert: { label: "Urgente", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: Zap },
    update: { label: "Atualização", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: RefreshCw },
};

export default function AdminNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [type, setType] = useState<NotifType>("info");

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setNotifications(data as Notification[]);
        setLoading(false);
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error("Preencha o título e o conteúdo da mensagem.");
            return;
        }
        setSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from("notifications").insert({
                title: title.trim(),
                body: body.trim(),
                type,
                created_by: user?.id,
            });
            if (error) throw error;
            toast.success("Notificação enviada para todos os usuários!");
            setTitle("");
            setBody("");
            setType("info");
            fetchNotifications();
        } catch (err: any) {
            toast.error("Erro ao enviar notificação: " + err.message);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        await supabase.from("notifications").delete().eq("id", id);
        setNotifications((n) => n.filter((x) => x.id !== id));
        toast.success("Notificação removida.");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Caixa Postal — Broadcast</h1>
                            <p className="text-xs text-muted-foreground">Envie mensagens para todos os usuários da plataforma</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">

                    {/* ── Compose ── */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Send className="h-4 w-4 text-cyan-400" />
                                    Compor Mensagem
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="notif-type">Tipo</Label>
                                    <Select value={type} onValueChange={(v) => setType(v as NotifType)}>
                                        <SelectTrigger id="notif-type" className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.entries(TYPE_META) as [NotifType, typeof TYPE_META[NotifType]][]).map(([key, meta]) => (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex items-center gap-2">
                                                        <meta.icon className="h-3.5 w-3.5" />
                                                        {meta.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="notif-title">Título *</Label>
                                    <Input
                                        id="notif-title"
                                        className="mt-1"
                                        placeholder="Ex: Manutenção programada amanhã"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={120}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">{title.length}/120</p>
                                </div>

                                <div>
                                    <Label htmlFor="notif-body">Conteúdo *</Label>
                                    <Textarea
                                        id="notif-body"
                                        className="mt-1 min-h-[120px] resize-none"
                                        placeholder="Detalhe aqui a mensagem para os usuários..."
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                    />
                                </div>

                                <Button
                                    onClick={handleSend}
                                    disabled={sending || !title.trim() || !body.trim()}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {sending ? "Enviando..." : "Enviar para Todos os Usuários"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        {(title || body) && (
                            <Card className="border border-dashed">
                                <CardHeader className="pb-2">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Preview</p>
                                </CardHeader>
                                <CardContent>
                                    <NotificationCard
                                        title={title || "Título da mensagem"}
                                        body={body || "Conteúdo da mensagem..."}
                                        type={type}
                                        date={new Date().toISOString()}
                                        preview
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── History ── */}
                    <div>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Histórico de Mensagens</CardTitle>
                                <Badge variant="outline">{notifications.length} enviadas</Badge>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-r-transparent animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">Nenhuma mensagem enviada ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {notifications.map((n) => (
                                            <div key={n.id} className="group relative">
                                                <NotificationCard
                                                    title={n.title}
                                                    body={n.body}
                                                    type={n.type as NotifType}
                                                    date={n.created_at}
                                                />
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                                                    title="Remover"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}

function NotificationCard({
    title, body, type, date, preview = false,
}: {
    title: string; body: string; type: NotifType; date: string; preview?: boolean;
}) {
    const meta = TYPE_META[type];
    const Icon = meta.icon;
    return (
        <div className={`rounded-lg border p-4 ${meta.color}`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-md bg-current/10 flex-shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{title}</p>
                        <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${meta.color}`}>
                            {meta.label}
                        </Badge>
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed">{body}</p>
                    {!preview && (
                        <p className="text-[10px] opacity-50 mt-2">
                            {new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
