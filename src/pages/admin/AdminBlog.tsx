import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ArrowLeft, Sparkles, Edit, Trash2, Eye, Send, FileText, Plus, RefreshCcw,
    Search, TrendingUp, BookOpen, Shield, Globe, Archive, Image, User, Link2,
    CheckCircle2, Clock, BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: string;
    status: string;
    author: string;
    cover_url: string | null;
    linkedin_version: string | null;
    published_at: string | null;
    created_at: string;
}

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
    mercado: { label: "Mercado", icon: TrendingUp, color: "text-cyan-400" },
    educacional: { label: "Educacional", icon: BookOpen, color: "text-purple-400" },
    regulacao: { label: "Regulação", icon: Shield, color: "text-amber-400" },
};

const statusConfig: Record<string, { label: string; dotColor: string; badgeClass: string }> = {
    draft: { label: "Rascunho", dotColor: "bg-yellow-400", badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    published: { label: "Publicado", dotColor: "bg-emerald-400", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    archived: { label: "Arquivado", dotColor: "bg-white/20", badgeClass: "bg-white/5 text-white/40 border-white/10" },
};

function toSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function wordCount(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function readTime(text: string): number {
    return Math.max(1, Math.ceil(wordCount(text) / 200));
}

export default function AdminBlog() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [editPost, setEditPost] = useState<BlogPost | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiCategory, setAiCategory] = useState("mercado");
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const { toast } = useToast();

    // Editor state
    const [editorTitle, setEditorTitle] = useState("");
    const [editorSummary, setEditorSummary] = useState("");
    const [editorContent, setEditorContent] = useState("");
    const [editorCategory, setEditorCategory] = useState("mercado");
    const [editorLinkedin, setEditorLinkedin] = useState("");
    const [editorCoverUrl, setEditorCoverUrl] = useState("");
    const [editorAuthor, setEditorAuthor] = useState("TKB Asset");

    const editorSlug = useMemo(() => toSlug(editorTitle), [editorTitle]);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data, error } = await (supabase as any)
            .from("blog_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) setPosts(data);
        setIsLoading(false);
    };

    const handleGenerateAI = async () => {
        if (!aiTopic.trim()) return;
        setIsGenerating(true);

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

            const response = await fetch(`${supabaseUrl}/functions/v1/generate-blog-post`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "apikey": anonKey },
                body: JSON.stringify({ topic: aiTopic, category: aiCategory }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Erro ${response.status}`);

            toast({ title: "✨ Artigo gerado!", description: "Rascunho salvo. Revise antes de publicar." });
            setShowAIModal(false);
            setAiTopic("");
            fetchPosts();
        } catch (error: any) {
            toast({ title: "Erro ao gerar artigo", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const openEditor = (post?: BlogPost) => {
        if (post) {
            setEditPost(post);
            setEditorTitle(post.title);
            setEditorSummary(post.summary || "");
            setEditorContent(post.content);
            setEditorCategory(post.category);
            setEditorLinkedin(post.linkedin_version || "");
            setEditorCoverUrl(post.cover_url || "");
            setEditorAuthor(post.author || "TKB Asset");
        } else {
            setEditPost(null);
            setEditorTitle("");
            setEditorSummary("");
            setEditorContent("");
            setEditorCategory("mercado");
            setEditorLinkedin("");
            setEditorCoverUrl("");
            setEditorAuthor("TKB Asset");
        }
        setShowEditor(true);
    };

    const handleSavePost = async (publishNow = false) => {
        const postData: any = {
            title: editorTitle,
            slug: editorSlug,
            summary: editorSummary,
            content: editorContent,
            category: editorCategory,
            linkedin_version: editorLinkedin || null,
            cover_url: editorCoverUrl || null,
            author: editorAuthor || "TKB Asset",
        };

        if (publishNow) {
            postData.status = "published";
            postData.published_at = new Date().toISOString();
        }

        try {
            if (editPost) {
                const { error } = await (supabase as any).from("blog_posts").update(postData).eq("id", editPost.id);
                if (error) throw error;
                toast({ title: publishNow ? "🚀 Artigo publicado!" : "✅ Artigo atualizado!" });
            } else {
                const { error } = await (supabase as any).from("blog_posts").insert({
                    ...postData,
                    status: publishNow ? "published" : "draft",
                });
                if (error) throw error;
                toast({ title: publishNow ? "🚀 Artigo publicado!" : "✅ Rascunho criado!" });
            }

            setShowEditor(false);
            fetchPosts();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const handlePublish = async (id: string) => {
        const { error } = await (supabase as any)
            .from("blog_posts")
            .update({ status: "published", published_at: new Date().toISOString() })
            .eq("id", id);
        if (!error) { toast({ title: "🚀 Artigo publicado!" }); fetchPosts(); }
    };

    const handleArchive = async (id: string) => {
        const { error } = await (supabase as any).from("blog_posts").update({ status: "archived" }).eq("id", id);
        if (!error) { toast({ title: "📦 Artigo arquivado" }); fetchPosts(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este artigo?")) return;
        const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);
        if (!error) { toast({ title: "🗑️ Artigo excluído" }); fetchPosts(); }
    };

    const filteredPosts = posts.filter((p) => {
        const matchesFilter = filter === "all" || p.status === filter;
        const matchesSearch =
            !search ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            (p.summary && p.summary.toLowerCase().includes(search.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const stats = {
        published: posts.filter((p) => p.status === "published").length,
        draft: posts.filter((p) => p.status === "draft").length,
        archived: posts.filter((p) => p.status === "archived").length,
        total: posts.length,
    };

    const filterTabs = [
        { value: "all", label: "Todos", count: stats.total },
        { value: "published", label: "Publicados", count: stats.published },
        { value: "draft", label: "Rascunhos", count: stats.draft },
        { value: "archived", label: "Arquivados", count: stats.archived },
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            {/* Header */}
            <header className="border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="container mx-auto px-5 py-4">
                    <button
                        onClick={() => navigate("/admin/dashboard")}
                        className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Voltar ao Dashboard
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Blog &amp; Conteúdo</h1>
                            <p className="text-white/30 text-sm mt-0.5">Gerencie artigos e gere conteúdo com IA</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => openEditor()}
                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Artigo
                            </Button>
                            <Button
                                onClick={() => setShowAIModal(true)}
                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-900/30"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Gerar com IA
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-5 py-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Publicados", value: stats.published, icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/8" },
                        { label: "Rascunhos", value: stats.draft, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/8" },
                        { label: "Arquivados", value: stats.archived, icon: Archive, color: "text-white/40", bg: "bg-white/4" },
                        { label: "Total", value: stats.total, icon: BarChart3, color: "text-[#00D4FF]", bg: "bg-[#00D4FF]/8" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
                            <div className={`${stat.bg} p-3 rounded-xl flex-shrink-0`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                <p className="text-white/30 text-xs mt-0.5">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Posts Table Card */}
                <div className="bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06]">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Artigos</h2>
                            <p className="text-white/30 text-sm">Gerencie, edite e publique seus conteúdos</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input
                                type="text"
                                placeholder="Buscar artigos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:border-[#00D4FF]/30 focus:ring-1 focus:ring-[#00D4FF]/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 px-6 py-3 border-b border-white/[0.06]">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setFilter(tab.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                    filter === tab.value
                                        ? "bg-white/10 text-white"
                                        : "text-white/35 hover:text-white/60 hover:bg-white/5"
                                }`}
                            >
                                {tab.label}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    filter === tab.value ? "bg-white/15 text-white/80" : "bg-white/5 text-white/20"
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                            <div className="w-5 h-5 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                            <span className="text-white/30 text-sm">Carregando...</span>
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/[0.04]">
                                        <th className="text-left text-xs font-semibold text-white/30 uppercase tracking-wider px-6 py-3 w-[45%]">Título</th>
                                        <th className="text-left text-xs font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Categoria</th>
                                        <th className="text-left text-xs font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Status</th>
                                        <th className="text-left text-xs font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Data</th>
                                        <th className="text-right text-xs font-semibold text-white/30 uppercase tracking-wider px-6 py-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {filteredPosts.map((post) => {
                                        const catConf = categoryConfig[post.category];
                                        const stConf = statusConfig[post.status] || statusConfig.draft;
                                        const Icon = catConf?.icon;
                                        return (
                                            <tr key={post.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-[#00D4FF] transition-colors">
                                                        {post.title.replace(/^Título:\s*/i, "")}
                                                    </p>
                                                    {post.summary && (
                                                        <p className="text-white/30 text-xs mt-1 line-clamp-1">{post.summary}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {catConf && (
                                                        <span className={`flex items-center gap-1.5 text-xs font-medium ${catConf.color}`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                            {catConf.label}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${stConf.badgeClass}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${stConf.dotColor}`} />
                                                        {stConf.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-white/30 text-xs">
                                                        {format(new Date(post.created_at), "dd MMM yyyy", { locale: ptBR })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openEditor(post)}
                                                            title="Editar"
                                                            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </button>
                                                        {post.status === "published" && (
                                                            <button
                                                                onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                                                                title="Ver publicado"
                                                                className="p-1.5 rounded-lg text-white/30 hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {post.status === "draft" && (
                                                            <button
                                                                onClick={() => handlePublish(post.id)}
                                                                title="Publicar"
                                                                className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                                            >
                                                                <Send className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {post.status === "published" && (
                                                            <button
                                                                onClick={() => handleArchive(post.id)}
                                                                title="Arquivar"
                                                                className="p-1.5 rounded-lg text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                                            >
                                                                <Archive className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {post.status === "archived" && (
                                                            <button
                                                                onClick={() => handlePublish(post.id)}
                                                                title="Republicar"
                                                                className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                                            >
                                                                <RefreshCcw className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(post.id)}
                                                            title="Excluir"
                                                            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-14 h-14 rounded-2xl bg-[#0A0A0A] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-6 h-6 text-white/15" />
                            </div>
                            <p className="text-white/30 text-sm">
                                {search ? "Nenhum artigo encontrado para essa busca." : 'Nenhum artigo ainda. Clique em "Gerar com IA" para começar!'}
                            </p>
                            {search && (
                                <button onClick={() => setSearch("")} className="mt-3 text-[#00D4FF] text-sm hover:underline">
                                    Limpar busca
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* AI Generation Modal */}
            <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
                <DialogContent className="max-w-lg bg-[#111111] border-white/[0.08] text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-white text-xl">
                            <div className="p-2 rounded-xl bg-violet-500/15">
                                <Sparkles className="w-5 h-5 text-violet-400" />
                            </div>
                            Gerar Artigo com IA
                        </DialogTitle>
                        <DialogDescription className="text-white/40">
                            Descreva o tema e o Claude gerará um rascunho completo com versão para LinkedIn. Leva cerca de 30 segundos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="text-white/60 text-sm">Tema / Assunto</Label>
                            <Input
                                placeholder="Ex: Impacto da regulação de criptoativos no Brasil em 2026"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !isGenerating && aiTopic.trim() && handleGenerateAI()}
                                className="mt-1.5 bg-[#0A0A0A] border-white/[0.08] text-white placeholder-white/20 focus:border-violet-500/40"
                            />
                        </div>
                        <div>
                            <Label className="text-white/60 text-sm">Categoria</Label>
                            <Select value={aiCategory} onValueChange={setAiCategory}>
                                <SelectTrigger className="mt-1.5 bg-[#0A0A0A] border-white/[0.08] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-white/[0.08] text-white">
                                    <SelectItem value="mercado">📈 Mercado</SelectItem>
                                    <SelectItem value="educacional">📚 Educacional</SelectItem>
                                    <SelectItem value="regulacao">⚖️ Regulação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isGenerating && (
                            <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                <div>
                                    <p className="text-violet-300 text-sm font-medium">Gerando com Claude...</p>
                                    <p className="text-violet-400/60 text-xs mt-0.5">Isso pode levar até 30 segundos</p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !aiTopic.trim()}
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold h-11 disabled:opacity-40"
                        >
                            {isGenerating ? "Gerando..." : "✨ Gerar Artigo"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Editor Modal */}
            <Dialog open={showEditor} onOpenChange={setShowEditor}>
                <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-[#111111] border-white/[0.08] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl">
                            {editPost ? "Editar Artigo" : "Novo Artigo"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 mt-2">
                        {/* Title */}
                        <div>
                            <Label className="text-white/60 text-sm">Título</Label>
                            <Input
                                value={editorTitle}
                                onChange={(e) => setEditorTitle(e.target.value)}
                                placeholder="Título do artigo"
                                className="mt-1.5 bg-[#0A0A0A] border-white/[0.08] text-white placeholder-white/20 focus:border-[#00D4FF]/30 text-base font-medium"
                            />
                            {editorTitle && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-white/25">
                                    <Link2 className="w-3 h-3" />
                                    <span className="font-mono truncate">/blog/{editorSlug}</span>
                                </div>
                            )}
                        </div>

                        {/* Category + Author row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-white/60 text-sm">Categoria</Label>
                                <Select value={editorCategory} onValueChange={setEditorCategory}>
                                    <SelectTrigger className="mt-1.5 bg-[#0A0A0A] border-white/[0.08] text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111111] border-white/[0.08] text-white">
                                        <SelectItem value="mercado">📈 Mercado</SelectItem>
                                        <SelectItem value="educacional">📚 Educacional</SelectItem>
                                        <SelectItem value="regulacao">⚖️ Regulação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-white/60 text-sm flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> Autor
                                </Label>
                                <Input
                                    value={editorAuthor}
                                    onChange={(e) => setEditorAuthor(e.target.value)}
                                    placeholder="TKB Asset"
                                    className="mt-1.5 bg-[#0A0A0A] border-white/[0.08] text-white placeholder-white/20 focus:border-[#00D4FF]/30"
                                />
                            </div>
                        </div>

                        {/* Cover URL */}
                        <div>
                            <Label className="text-white/60 text-sm flex items-center gap-1.5">
                                <Image className="w-3 h-3" /> URL da Capa (opcional)
                            </Label>
                            <Input
                                value={editorCoverUrl}
                                onChange={(e) => setEditorCoverUrl(e.target.value)}
                                placeholder="https://..."
                                className="mt-1.5 bg-[#0A0A0A] border-white/[0.08] text-white placeholder-white/20 focus:border-[#00D4FF]/30 font-mono text-sm"
                            />
                            {editorCoverUrl && (
                                <div className="mt-2 h-24 rounded-lg overflow-hidden border border-white/[0.08]">
                                    <img
                                        src={editorCoverUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label className="text-white/60 text-sm">Resumo (2-3 linhas)</Label>
                                <span className={`text-[11px] font-medium tabular-nums ${editorSummary.length > 350 ? "text-red-400" : "text-white/25"}`}>
                                    {editorSummary.length} / 350
                                </span>
                            </div>
                            <Textarea
                                value={editorSummary}
                                onChange={(e) => setEditorSummary(e.target.value)}
                                rows={2}
                                placeholder="Breve descrição do artigo..."
                                className="bg-[#0A0A0A] border-white/[0.08] text-white placeholder-white/20 focus:border-[#00D4FF]/30 resize-none"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label className="text-white/60 text-sm">Conteúdo</Label>
                                <div className="flex items-center gap-3 text-[11px] text-white/25 font-medium">
                                    <span>{wordCount(editorContent).toLocaleString()} palavras</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {readTime(editorContent)} min leitura
                                    </span>
                                </div>
                            </div>
                            <Textarea
                                value={editorContent}
                                onChange={(e) => setEditorContent(e.target.value)}
                                rows={14}
                                placeholder="Conteúdo do artigo... (suporta Markdown: # H1, ## H2, **negrito**, > citação, - lista)"
                                className="bg-[#0A0A0A] border-white/[0.08] text-white placeholder-white/20 focus:border-[#00D4FF]/30 font-mono text-sm leading-relaxed resize-none"
                            />
                            <p className="text-white/20 text-xs mt-1.5">
                                Suporte a Markdown: # H1, ## H2, ### H3, **negrito**, *itálico*, {">"} citação, - lista, --- divisor
                            </p>
                        </div>

                        {/* LinkedIn */}
                        <div>
                            <Label className="text-white/60 text-sm">Versão LinkedIn (opcional)</Label>
                            <Textarea
                                value={editorLinkedin}
                                onChange={(e) => setEditorLinkedin(e.target.value)}
                                rows={4}
                                placeholder="Texto curto e impactante para postar no LinkedIn..."
                                className="mt-1.5 bg-[#0A0A0A] border-white/[0.08] text-white placeholder-white/20 focus:border-[#00D4FF]/30 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                            <Button
                                variant="ghost"
                                onClick={() => setShowEditor(false)}
                                className="text-white/40 hover:text-white hover:bg-white/5"
                            >
                                Cancelar
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleSavePost(false)}
                                    disabled={!editorTitle.trim() || !editorContent.trim()}
                                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white disabled:opacity-30"
                                >
                                    {editPost ? "Salvar" : "Salvar Rascunho"}
                                </Button>
                                <Button
                                    onClick={() => handleSavePost(true)}
                                    disabled={!editorTitle.trim() || !editorContent.trim()}
                                    className="bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] hover:opacity-90 text-white font-semibold shadow-lg shadow-[#00D4FF]/20 disabled:opacity-30"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Publicar agora
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
