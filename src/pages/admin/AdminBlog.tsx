import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, Sparkles, Edit, Trash2, Eye, Send, FileText, Plus, RefreshCcw } from "lucide-react";
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
    linkedin_version: string | null;
    published_at: string | null;
    created_at: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Rascunho", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    published: { label: "Publicado", className: "bg-green-100 text-green-800 border-green-200" },
    archived: { label: "Arquivado", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

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
    const navigate = useNavigate();
    const { toast } = useToast();

    // Editor state
    const [editorTitle, setEditorTitle] = useState("");
    const [editorSummary, setEditorSummary] = useState("");
    const [editorContent, setEditorContent] = useState("");
    const [editorCategory, setEditorCategory] = useState("mercado");
    const [editorLinkedin, setEditorLinkedin] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data, error } = await (supabase as any)
            .from("blog_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setPosts(data);
        }
        setIsLoading(false);
    };

    const handleGenerateAI = async () => {
        if (!aiTopic.trim()) return;
        setIsGenerating(true);

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

            const response = await fetch(
                `${supabaseUrl}/functions/v1/generate-blog-post`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": anonKey,
                    },
                    body: JSON.stringify({ topic: aiTopic, category: aiCategory }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Erro ${response.status}: ${JSON.stringify(result)}`);
            }

            toast({
                title: "✨ Artigo gerado com sucesso!",
                description: "O rascunho foi salvo. Revise antes de publicar.",
            });

            setShowAIModal(false);
            setAiTopic("");
            fetchPosts();
        } catch (error: any) {
            console.error("AI generation error:", error);
            toast({
                title: "Erro ao gerar artigo",
                description: error.message || "Verifique a Edge Function e a API key do Claude.",
                variant: "destructive",
            });
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
        } else {
            setEditPost(null);
            setEditorTitle("");
            setEditorSummary("");
            setEditorContent("");
            setEditorCategory("mercado");
            setEditorLinkedin("");
        }
        setShowEditor(true);
    };

    const handleSavePost = async () => {
        const slug = editorTitle
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const postData = {
            title: editorTitle,
            slug,
            summary: editorSummary,
            content: editorContent,
            category: editorCategory,
            linkedin_version: editorLinkedin || null,
        };

        try {
            if (editPost) {
                const { error } = await (supabase as any)
                    .from("blog_posts")
                    .update(postData)
                    .eq("id", editPost.id);
                if (error) throw error;
                toast({ title: "✅ Artigo atualizado!" });
            } else {
                const { error } = await (supabase as any)
                    .from("blog_posts")
                    .insert({ ...postData, status: "draft", author: "TKB Asset" });
                if (error) throw error;
                toast({ title: "✅ Rascunho criado!" });
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

        if (!error) {
            toast({ title: "🚀 Artigo publicado!" });
            fetchPosts();
        }
    };

    const handleArchive = async (id: string) => {
        const { error } = await (supabase as any)
            .from("blog_posts")
            .update({ status: "archived" })
            .eq("id", id);

        if (!error) {
            toast({ title: "📦 Artigo arquivado" });
            fetchPosts();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este artigo?")) return;

        const { error } = await (supabase as any)
            .from("blog_posts")
            .delete()
            .eq("id", id);

        if (!error) {
            toast({ title: "🗑️ Artigo excluído" });
            fetchPosts();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)]">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Dashboard
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">📝 Blog &amp; Conteúdo</h1>
                            <p className="text-muted-foreground text-sm">Gerencie artigos e gere conteúdo com IA</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => openEditor()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Artigo
                            </Button>
                            <Button onClick={() => setShowAIModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Gerar com IA
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-green-600">{posts.filter(p => p.status === 'published').length}</p>
                            <p className="text-xs text-muted-foreground">Publicados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-yellow-600">{posts.filter(p => p.status === 'draft').length}</p>
                            <p className="text-xs text-muted-foreground">Rascunhos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold">{posts.length}</p>
                            <p className="text-xs text-muted-foreground">Total de Artigos</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Posts Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Todos os Artigos</CardTitle>
                        <CardDescription>Gerencie, edite e publique seus conteúdos</CardDescription>
                    </CardHeader>
                    <div className="px-6 pb-2">
                        <Tabs value={filter} onValueChange={setFilter}>
                            <TabsList>
                                <TabsTrigger value="all">Todos</TabsTrigger>
                                <TabsTrigger value="published">Publicados</TabsTrigger>
                                <TabsTrigger value="draft">Rascunhos</TabsTrigger>
                                <TabsTrigger value="archived">Arquivados</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                        ) : posts.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Título</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {posts
                                            .filter(post => filter === "all" ? true : post.status === filter)
                                            .map((post) => (
                                                <TableRow key={post.id}>
                                                    <TableCell className="font-medium">{post.title}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{post.category}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusConfig[post.status]?.className}>
                                                            {statusConfig[post.status]?.label || post.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {format(new Date(post.created_at), "dd/MM/yyyy")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => openEditor(post)} title="Editar">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            {post.status === "published" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                                                                    title="Ver publicado"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {post.status === "draft" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600"
                                                                    onClick={() => handlePublish(post.id)}
                                                                    title="Publicar"
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {post.status === "published" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-yellow-600"
                                                                    onClick={() => handleArchive(post.id)}
                                                                    title="Arquivar"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {post.status === "archived" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600"
                                                                    onClick={() => handlePublish(post.id)}
                                                                    title="Postar novamente"
                                                                >
                                                                    <RefreshCcw className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600"
                                                                onClick={() => handleDelete(post.id)}
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhum artigo ainda. Clique em "Gerar com IA" para começar!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* AI Generation Modal */}
            <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Gerar Artigo com IA (Claude)
                        </DialogTitle>
                        <DialogDescription>
                            Descreva o tema e a IA gerará um rascunho completo com versão para LinkedIn.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label>Tema / Assunto</Label>
                            <Input
                                placeholder="Ex: Impacto da regulação de criptoativos no Brasil em 2026"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Categoria</Label>
                            <Select value={aiCategory} onValueChange={setAiCategory}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mercado">📈 Mercado</SelectItem>
                                    <SelectItem value="educacional">📚 Educacional</SelectItem>
                                    <SelectItem value="regulacao">⚖️ Regulação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !aiTopic.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        >
                            {isGenerating ? "Gerando com Claude... (30s)" : "✨ Gerar Artigo"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Editor Modal */}
            <Dialog open={showEditor} onOpenChange={setShowEditor}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editPost ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label>Título</Label>
                            <Input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>Categoria</Label>
                            <Select value={editorCategory} onValueChange={setEditorCategory}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mercado">Mercado</SelectItem>
                                    <SelectItem value="educacional">Educacional</SelectItem>
                                    <SelectItem value="regulacao">Regulação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Resumo</Label>
                            <Textarea value={editorSummary} onChange={(e) => setEditorSummary(e.target.value)} rows={2} className="mt-1" />
                        </div>
                        <div>
                            <Label>Conteúdo</Label>
                            <Textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)} rows={12} className="mt-1 font-mono text-sm" />
                        </div>
                        <div>
                            <Label>Versão LinkedIn (opcional)</Label>
                            <Textarea value={editorLinkedin} onChange={(e) => setEditorLinkedin(e.target.value)} rows={4} className="mt-1" placeholder="Texto curto para postar no LinkedIn..." />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancelar</Button>
                            <Button onClick={handleSavePost} disabled={!editorTitle.trim() || !editorContent.trim()}>
                                {editPost ? "Salvar Alterações" : "Criar Rascunho"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
