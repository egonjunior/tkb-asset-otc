import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import tkbLogo from "@/assets/tkb-logo.png";
import { Calendar, ArrowLeft, Linkedin, BookOpen, TrendingUp, Shield } from "lucide-react";
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

const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
    mercado: { label: "Mercado", color: "from-cyan-500 to-blue-500", icon: TrendingUp },
    educacional: { label: "Educacional", color: "from-purple-500 to-pink-500", icon: BookOpen },
    regulacao: { label: "Regulação", color: "from-amber-500 to-orange-500", icon: Shield },
};

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostData | null>(null);
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
        }
        setIsLoading(false);
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
            {/* Navigation Header */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-[#0A0A0A]/60 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0A0A0A]/40">
                <div className="container mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium text-sm hidden sm:inline-block">Voltar aos artigos</span>
                        <span className="font-medium text-sm sm:hidden">Voltar</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <img src={tkbLogo} alt="TKB Asset" className="h-6 w-6 opacity-50 hidden sm:block" />
                        <Link
                            to="/cotacao"
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-full transition-all hover:scale-105 active:scale-95"
                        >
                            Comprar USDT
                        </Link>
                    </div>
                </div>
            </header>

            {/* Minimalist Premium Banner with dynamic Cover Image */}
            <div className={`h-[40vh] md:h-[55vh] relative flex items-center justify-center overflow-hidden`}>
                {/* Imagem de Fundo (Capa do Post ou Fallback Temático) */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={post.cover_url || (post.category === 'mercado' ? 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1600' :
                            post.category === 'educacional' ? 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1600' :
                                post.category === 'regulacao' ? 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1600' :
                                    'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=1600')}
                        alt="Blog Cover"
                        className="w-full h-full object-cover opacity-60 select-none"
                    />
                </div>

                {/* Overlays de Gradiente para legibilidade (Escurecimento suave para baixo) */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
                <div className={`absolute inset-0 z-10 bg-gradient-to-br ${config.color} opacity-10 mix-blend-overlay`} />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#0A0A0A]/60 to-[#0A0A0A]" />

                {/* Floating blur artifacts for depth */}
                <div className={`absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br ${config.color} rounded-full blur-[128px] opacity-20 z-0`} />
                <div className={`absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl ${config.color} rounded-full blur-[128px] opacity-20 z-0`} />
            </div>

            {/* Article Container */}
            <article className="container mx-auto px-5 md:px-8 max-w-4xl -mt-40 md:-mt-56 relative z-20 pb-20">
                {/* Header Section */}
                <div className="text-center md:text-left mb-16">
                    {/* Category & Date */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-8 justify-center md:justify-start">
                        <span className={`inline-flex items-center gap-2 text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md`}>
                            <Icon className={`w-3.5 h-3.5`} style={{ color: `url(#${post.category}-gradient)` }} />
                            <span className={`bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>{config.label}</span>
                        </span>

                        {/* SVG Gradient Def for Icon */}
                        <svg width="0" height="0">
                            <linearGradient id={`${post.category}-gradient`} x1="100%" y1="100%" x2="0%" y2="0%">
                                <stop stopColor="currentColor" offset="0%" />
                                <stop stopColor="currentColor" offset="100%" />
                            </linearGradient>
                        </svg>

                        {post.published_at && (
                            <div className="flex items-center justify-center md:justify-start gap-2 text-white/40 text-sm font-medium">
                                <Calendar className="w-4 h-4" />
                                <time dateTime={post.published_at}>
                                    {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                </time>
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-[1.15] tracking-tight text-balance">
                        {post.title.replace('Título: ', '')}
                    </h1>

                    {/* Summary (Sub-heading) */}
                    {post.summary && (
                        <p className="text-[#94A3B8] text-lg md:text-xl md:leading-relaxed max-w-3xl mb-10 font-light text-balance md:text-left mx-auto md:mx-0">
                            {post.summary}
                        </p>
                    )}

                    {/* Author Byline */}
                    <div className="flex items-center justify-center md:justify-start gap-4 pt-8 border-t border-white/[0.08]">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] rounded-full blur-sm opacity-50" />
                            <div className="h-12 w-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center relative z-10">
                                <span className="bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] bg-clip-text text-transparent text-sm font-bold tracking-widest">
                                    {post.author.split(' ').map(nSeparator => nSeparator[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-white font-medium">{post.author}</span>
                            <span className="text-[#00D4FF] text-xs uppercase tracking-wider font-semibold mt-0.5">TKB Asset Especialista</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-none pb-12">
                    {/* O Claude retorna o texto com \n\n, precisamos transformar isso em parágrafos separados mas a propriedade dangerouslySetInnerHTML com Regex pode foder a estrutura HTML. 
                        Vamos quebrar o conteúdo em blocos e renderizar os subtítulos/parágrafos de forma elegante, simulando um conversor Markdown básico para garantir a tipografia Premium. 
                    */}
                    {post.content.split('\n\n').map((block, index) => {
                        // Se o bloco estiver todo em MAIÚSCULAS (E não for muito curto), é um subtítulo.
                        if (block === block.toUpperCase() && block.length > 5 && !block.startsWith('[')) {
                            return <h2 key={index} className="text-2xl md:text-3xl font-display font-semibold text-white mt-12 mb-6 border-b border-white/[0.08] pb-4 tracking-tight">{block}</h2>
                        }

                        // Se for uma nota/disclaimer entre chaves/colchetes
                        if (block.startsWith('[') && block.endsWith(']')) {
                            return <div key={index} className="bg-[#111] border border-[#333] p-5 rounded-xl my-10 text-white/60 text-[0.95rem] font-mono leading-relaxed shadow-institutional">{block.replace(/\[|\]/g, '')}</div>
                        }

                        // Se for uma lista de bullets (linhas começando com - ou *)
                        if (block.includes('\n- ') || block.startsWith('- ') || block.includes('\n* ') || block.startsWith('* ')) {
                            const listItems = block.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
                            // Se tiver um parágrafo introdutório antes da lista no mesmo bloco
                            const introText = block.split('\n')[0].trim();
                            const hasIntro = !introText.startsWith('-') && !introText.startsWith('*');

                            return (
                                <div key={index} className="mb-8">
                                    {hasIntro && <p className="mb-4">{introText}</p>}
                                    <ul className="list-none space-y-3 my-6 pl-2">
                                        {listItems.map((item, i) => {
                                            const itemText = item.replace(/^[-*]\s/, '');
                                            return (
                                                <li key={i} className="flex gap-4 items-start">
                                                    <span className="text-[#00D4FF] mt-1.5 flex-shrink-0 text-[10px]">■</span>
                                                    <span className="text-[#E2E8F0] leading-relaxed">{itemText.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        }

                        // Bold parsing simples para garantir contraste
                        const renderBold = (text: string) => {
                            const parts = text.split(/(\*\*.*?\*\*)/g);
                            return parts.map((part, i) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>;
                                }
                                return part;
                            });
                        };

                        return <p key={index} className="text-[#E2E8F0] leading-[1.9] font-light text-[1.1rem] md:text-[1.25rem] tracking-wide mb-8">{renderBold(block)}</p>
                    })}
                </div>

                {/* LinkedIn Share */}
                <div className="mt-16 flex justify-center pb-8 border-b border-white/[0.04]">
                    <button
                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                        className="flex items-center gap-3 px-8 py-4 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-full transition-all hover:scale-105 shadow-xl shadow-[#0A66C2]/20"
                    >
                        <Linkedin className="w-5 h-5" />
                        Compartilhar no LinkedIn
                    </button>
                </div>
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
