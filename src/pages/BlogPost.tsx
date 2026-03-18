import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import tkbLogo from "@/assets/tkb-logo.png";
import { Calendar, ArrowLeft, Linkedin, BookOpen, TrendingUp, Shield, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface RelatedPost {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    cover_url: string | null;
    published_at: string;
}

const categoryConfig: Record<string, { label: string; color: string; icon: any; fallbackImg: string }> = {
    mercado: {
        label: "Mercado",
        color: "from-cyan-500 to-blue-500",
        icon: TrendingUp,
        fallbackImg: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1600",
    },
    educacional: {
        label: "Educacional",
        color: "from-purple-500 to-pink-500",
        icon: BookOpen,
        fallbackImg: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1600",
    },
    regulacao: {
        label: "Regulação",
        color: "from-amber-500 to-orange-500",
        icon: Shield,
        fallbackImg: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1600",
    },
};

const globalFallback = "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=1600";

function cleanTitle(title: string): string {
    return title.replace(/^Título:\s*/i, "").trim();
}

function calcReadTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}

// Inline bold/italic renderer
function renderInline(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return <em key={i} className="italic text-white/80">{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

function renderContent(content: string): React.ReactNode[] {
    return content.split("\n\n").map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // ### H3
        if (trimmed.startsWith("### ")) {
            return (
                <h3 key={index} className="text-xl md:text-2xl font-display font-semibold text-white mt-10 mb-4 tracking-tight">
                    {trimmed.replace(/^###\s+/, "")}
                </h3>
            );
        }

        // ## H2
        if (trimmed.startsWith("## ")) {
            return (
                <h2 key={index} className="text-2xl md:text-3xl font-display font-semibold text-white mt-12 mb-5 border-b border-white/[0.08] pb-4 tracking-tight">
                    {trimmed.replace(/^##\s+/, "")}
                </h2>
            );
        }

        // # H1
        if (trimmed.startsWith("# ")) {
            return (
                <h2 key={index} className="text-3xl md:text-4xl font-display font-bold text-white mt-14 mb-6 border-b border-white/[0.08] pb-4 tracking-tight">
                    {trimmed.replace(/^#\s+/, "")}
                </h2>
            );
        }

        // ALL CAPS fallback heading (legacy AI format)
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.startsWith("[") && !/[#>*\-]/.test(trimmed[0])) {
            return (
                <h2 key={index} className="text-2xl md:text-3xl font-display font-semibold text-white mt-12 mb-5 border-b border-white/[0.08] pb-4 tracking-tight">
                    {trimmed}
                </h2>
            );
        }

        // Horizontal rule
        if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            return <hr key={index} className="border-white/[0.08] my-10" />;
        }

        // Blockquote
        if (trimmed.startsWith("> ")) {
            const quoteText = trimmed.replace(/^>\s*/gm, "");
            return (
                <blockquote
                    key={index}
                    className="border-l-4 border-[#00D4FF]/60 bg-[#00D4FF]/5 pl-6 pr-4 py-4 my-8 rounded-r-xl"
                >
                    <p className="text-white/80 text-lg italic leading-relaxed font-light">
                        {renderInline(quoteText)}
                    </p>
                </blockquote>
            );
        }

        // Disclaimer/note between brackets
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            return (
                <div key={index} className="bg-[#111] border border-white/10 p-5 rounded-xl my-8 text-white/50 text-sm font-mono leading-relaxed">
                    {trimmed.replace(/^\[|\]$/g, "")}
                </div>
            );
        }

        // Bullet list
        if (trimmed.includes("\n- ") || trimmed.startsWith("- ") || trimmed.includes("\n* ") || trimmed.startsWith("* ")) {
            const lines = trimmed.split("\n");
            const listItems = lines.filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"));
            const introText = lines[0].trim();
            const hasIntro = !introText.startsWith("-") && !introText.startsWith("*");

            return (
                <div key={index} className="my-6">
                    {hasIntro && (
                        <p className="text-[#E2E8F0] leading-[1.8] font-light text-[1.05rem] md:text-[1.15rem] mb-4">
                            {renderInline(introText)}
                        </p>
                    )}
                    <ul className="list-none space-y-3 pl-2">
                        {listItems.map((item, i) => {
                            const itemText = item.replace(/^[-*]\s/, "");
                            return (
                                <li key={i} className="flex gap-4 items-start">
                                    <span className="text-[#00D4FF] mt-2 flex-shrink-0 text-[8px]">◆</span>
                                    <span className="text-[#E2E8F0] leading-relaxed text-[1.05rem]">
                                        {renderInline(itemText)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            );
        }

        // Default paragraph
        return (
            <p key={index} className="text-[#CBD5E1] leading-[1.9] font-light text-[1.05rem] md:text-[1.15rem] tracking-wide mb-7">
                {renderInline(trimmed)}
            </p>
        );
    }).filter(Boolean) as React.ReactNode[];
}

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostData | null>(null);
    const [related, setRelated] = useState<RelatedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            fetchRelated(data.category, data.id);
        }
        setIsLoading(false);
    };

    const fetchRelated = async (category: string, excludeId: string) => {
        const { data } = await (supabase as any)
            .from("blog_posts")
            .select("id, title, slug, summary, category, cover_url, published_at")
            .eq("status", "published")
            .eq("category", category)
            .neq("id", excludeId)
            .order("published_at", { ascending: false })
            .limit(3);

        if (data) setRelated(data);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                    <span className="text-white/20 text-sm">Carregando artigo...</span>
                </div>
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
    const coverImg = post.cover_url || config.fallbackImg || globalFallback;
    const readTime = calcReadTime(post.content);

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Navigation Header */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-[#0A0A0A]/60 backdrop-blur-xl">
                <div className="container mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium text-sm hidden sm:inline-block">Voltar aos artigos</span>
                        <span className="font-medium text-sm sm:hidden">Voltar</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <img src={tkbLogo} alt="TKB Asset" className="h-6 w-6 opacity-40 hidden sm:block" />
                        <Link
                            to="/auth"
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-full transition-all hover:scale-105 active:scale-95"
                        >
                            Acessar Plataforma
                        </Link>
                    </div>
                </div>
            </header>

            {/* Cover Banner */}
            <div className="h-[40vh] md:h-[55vh] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={coverImg}
                        alt="Blog Cover"
                        className="w-full h-full object-cover opacity-60 select-none"
                    />
                </div>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
                <div className={`absolute inset-0 z-10 bg-gradient-to-br ${config.color} opacity-10 mix-blend-overlay`} />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#0A0A0A]/50 to-[#0A0A0A]" />

                {/* Depth blurs */}
                <div className={`absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br ${config.color} rounded-full blur-[128px] opacity-15 z-0`} />
                <div className={`absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl ${config.color} rounded-full blur-[128px] opacity-15 z-0`} />
            </div>

            {/* Article Container */}
            <article className="container mx-auto px-5 md:px-8 max-w-3xl -mt-40 md:-mt-56 relative z-20 pb-20">
                {/* Header */}
                <div className="text-center md:text-left mb-14">
                    {/* Category & meta */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-7 justify-center md:justify-start">
                        <span className="inline-flex items-center gap-2 text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                            <Icon className="w-3.5 h-3.5 text-white/50" />
                            <span className={`bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                                {config.label}
                            </span>
                        </span>

                        <div className="flex items-center justify-center md:justify-start gap-4 text-white/35 text-sm font-medium">
                            {post.published_at && (
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <time dateTime={post.published_at}>
                                        {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                    </time>
                                </span>
                            )}
                            <span>·</span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {readTime} min de leitura
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display font-bold text-white mb-6 leading-[1.15] tracking-tight text-balance">
                        {cleanTitle(post.title)}
                    </h1>

                    {/* Summary */}
                    {post.summary && (
                        <p className="text-[#94A3B8] text-lg md:text-xl leading-relaxed max-w-3xl mb-10 font-light text-balance md:text-left mx-auto md:mx-0">
                            {post.summary}
                        </p>
                    )}

                    {/* Author byline */}
                    <div className="flex items-center justify-center md:justify-start gap-4 pt-8 border-t border-white/[0.08]">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] rounded-full blur-sm opacity-40" />
                            <div className="h-12 w-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center relative z-10">
                                <span className="bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] bg-clip-text text-transparent text-sm font-bold tracking-widest">
                                    {post.author
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-white font-medium text-sm">{post.author}</span>
                            <span className="text-[#00D4FF] text-xs uppercase tracking-wider font-semibold mt-0.5">
                                TKB Asset Especialista
                            </span>
                        </div>
                    </div>
                </div>

                {/* Article body */}
                <div className="max-w-none pb-12">
                    {renderContent(post.content)}
                </div>

                {/* Share */}
                <div className="mt-12 flex justify-center pb-10 border-b border-white/[0.06]">
                    <button
                        onClick={() =>
                            window.open(
                                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                                "_blank"
                            )
                        }
                        className="flex items-center gap-3 px-8 py-3.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-full transition-all hover:scale-105 shadow-xl shadow-[#0A66C2]/20 text-sm"
                    >
                        <Linkedin className="w-4 h-4" />
                        Compartilhar no LinkedIn
                    </button>
                </div>

                {/* Related Articles */}
                {related.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center gap-3 mb-7">
                            <h3 className="text-white font-bold text-xl">Artigos relacionados</h3>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {related.map((rp) => {
                                const rConfig = categoryConfig[rp.category] || categoryConfig.mercado;
                                const rCover = rp.cover_url || rConfig.fallbackImg;
                                return (
                                    <Link
                                        key={rp.id}
                                        to={`/blog/${rp.slug}`}
                                        className="group bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden hover:border-[#00D4FF]/20 transition-all hover:shadow-lg hover:shadow-[#00D4FF]/5"
                                    >
                                        <div className="h-32 relative overflow-hidden">
                                            <img
                                                src={rCover}
                                                alt={cleanTitle(rp.title)}
                                                className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
                                        </div>
                                        <div className="p-4">
                                            <p className="text-white text-sm font-semibold line-clamp-2 group-hover:text-[#00D4FF] transition-colors leading-snug mb-2">
                                                {cleanTitle(rp.title)}
                                            </p>
                                            <span className="text-[#00D4FF] text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Ler <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </article>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-8 px-4">
                <div className="container mx-auto max-w-3xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={tkbLogo} alt="TKB Asset" className="h-5 w-5 opacity-30" />
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
