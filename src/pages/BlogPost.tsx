import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import tkbLogo from "@/assets/tkb-logo.png";
import { Calendar, ArrowLeft, Copy, CheckCircle2, Linkedin, BookOpen, TrendingUp, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface BlogPostData {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: string;
    cover_url: string | null;
    author: string;
    linkedin_version: string | null;
    published_at: string;
}

const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
    mercado: { label: "Mercado", color: "from-cyan-500 to-blue-500", icon: TrendingUp },
    educacional: { label: "Educacional", color: "from-purple-500 to-pink-500", icon: BookOpen },
    regulacao: { label: "Regulação", color: "from-amber-500 to-orange-500", icon: Shield },
};

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchPost();
    }, [slug]);

    const fetchPost = async () => {
        if (!slug) return;

        const { data, error } = await (supabase as any)
            .from("blog_posts")
            .select("*")
            .eq("slug", slug)
            .eq("status", "published")
            .single();

        if (!error && data) {
            setPost(data);
        }
        setIsLoading(false);
    };

    const handleCopyLinkedIn = async () => {
        if (!post?.linkedin_version) return;
        try {
            await navigator.clipboard.writeText(post.linkedin_version);
            setCopied(true);
            toast.success("Texto copiado para o clipboard!");
            setTimeout(() => setCopied(false), 3000);
        } catch {
            toast.error("Erro ao copiar");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-white text-2xl font-bold mb-2">Artigo não encontrado</h2>
                    <p className="text-white/30 mb-6">Este artigo pode ter sido removido ou o link está incorreto.</p>
                    <Link to="/blog" className="text-[#00D4FF] hover:underline">← Voltar ao Blog</Link>
                </div>
            </div>
        );
    }

    const config = categoryConfig[post.category] || categoryConfig.mercado;
    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Header */}
            <header className="border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <img src={tkbLogo} alt="TKB Asset" className="h-8 w-8" />
                        <span className="font-medium text-sm">Voltar ao Blog</span>
                    </Link>
                    <Link
                        to="/cotacao"
                        className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Comprar USDT
                    </Link>
                </div>
            </header>

            {/* Hero Banner */}
            <div className={`h-48 md:h-64 bg-gradient-to-br ${config.color} opacity-80 flex items-center justify-center relative`}>
                <Icon className="w-20 h-20 text-white/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
            </div>

            {/* Article */}
            <article className="container mx-auto px-4 max-w-3xl -mt-16 relative z-10 pb-20">
                {/* Meta */}
                <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-white`}>
                        {config.label}
                    </span>
                    {post.published_at && (
                        <span className="text-white/25 text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                    )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                    {post.title}
                </h1>

                {post.summary && (
                    <p className="text-white/40 text-lg mb-8 leading-relaxed">{post.summary}</p>
                )}

                <div className="flex items-center gap-3 mb-10 pb-8 border-b border-white/[0.06]">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{post.author.charAt(0)}</span>
                    </div>
                    <span className="text-white/40 text-sm">{post.author}</span>
                </div>

                {/* Content */}
                <div
                    className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-white/60 prose-p:leading-relaxed
            prose-strong:text-white
            prose-a:text-[#00D4FF] prose-a:no-underline hover:prose-a:underline
            prose-li:text-white/50
            prose-blockquote:border-l-[#00D4FF] prose-blockquote:text-white/40
            prose-code:text-[#00D4FF] prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
          "
                    dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br />") }}
                />

                {/* LinkedIn CTA */}
                {post.linkedin_version && (
                    <div className="mt-12 p-6 bg-[#111111] border border-white/[0.06] rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                            <h3 className="text-white font-semibold">Versão para LinkedIn</h3>
                        </div>
                        <p className="text-white/30 text-sm mb-4 whitespace-pre-wrap leading-relaxed">
                            {post.linkedin_version}
                        </p>
                        <button
                            onClick={handleCopyLinkedIn}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {copied ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copiar para Clipboard
                                </>
                            )}
                        </button>
                    </div>
                )}
            </article>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-8 px-4">
                <div className="container mx-auto max-w-3xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={tkbLogo} alt="TKB Asset" className="h-6 w-6" />
                        <span className="text-white/20 text-xs">© {new Date().getFullYear()} TKB Asset</span>
                    </div>
                    <Link to="/blog" className="text-white/20 hover:text-white/50 text-xs transition-colors">
                        ← Todos os artigos
                    </Link>
                </div>
            </footer>
        </div>
    );
}
