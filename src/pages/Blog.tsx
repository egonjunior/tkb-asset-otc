import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import tkbLogo from "@/assets/tkb-logo.png";
import { Calendar, ArrowRight, BookOpen, TrendingUp, Shield, Search, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    cover_url: string | null;
    author: string;
    published_at: string;
}

const categoryConfig: Record<string, { label: string; icon: any; color: string; fallbackImg: string }> = {
    mercado: {
        label: "Mercado",
        icon: TrendingUp,
        color: "from-cyan-500 to-blue-500",
        fallbackImg: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    },
    educacional: {
        label: "Educacional",
        icon: BookOpen,
        color: "from-purple-500 to-pink-500",
        fallbackImg: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
    },
    regulacao: {
        label: "Regulação",
        icon: Shield,
        color: "from-amber-500 to-orange-500",
        fallbackImg: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80",
    },
};

const fallbackImg = "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&w=800&q=80";

function getCoverUrl(post: BlogPost): string {
    return post.cover_url || categoryConfig[post.category]?.fallbackImg || fallbackImg;
}

function cleanTitle(title: string): string {
    return title.replace(/^Título:\s*/i, "").trim();
}

export default function Blog() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data, error } = await (supabase as any)
            .from("blog_posts")
            .select("id, title, slug, summary, category, cover_url, author, published_at")
            .eq("status", "published")
            .order("published_at", { ascending: false });

        if (!error && data) {
            setPosts(data);
        }
        setIsLoading(false);
    };

    const filteredPosts = posts.filter((p) => {
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        const matchesSearch =
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.summary && p.summary.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const categories = ["all", "mercado", "educacional", "regulacao"];
    const categoryCounts = categories.reduce(
        (acc, cat) => {
            acc[cat] = cat === "all" ? posts.length : posts.filter((p) => p.category === cat).length;
            return acc;
        },
        {} as Record<string, number>
    );

    const [featured, ...rest] = filteredPosts;

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Header */}
            <header className="border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={tkbLogo} alt="TKB Asset" className="h-9 w-9" />
                        <div>
                            <span className="text-white font-bold text-lg">TKB Asset</span>
                            <span className="text-[#00D4FF] text-xs ml-2 font-medium">Blog</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-white/50 hover:text-white text-sm transition-colors">
                            Login
                        </Link>
                        <Link
                            to="/auth"
                            className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Criar Conta na TKB
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-16 pb-10 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                        Análises &amp; Educação
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Blog{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#3B82F6]">
                            TKB Asset
                        </span>
                    </h1>
                    <p className="text-white/40 text-lg max-w-2xl mx-auto mb-8">
                        Análises de mercado, educação sobre criptoativos e atualizações regulatórias para quem opera OTC com excelência.
                    </p>

                    {/* Search */}
                    <div className="relative max-w-md mx-auto mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                            type="text"
                            placeholder="Buscar artigos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#111111] border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/20 focus:border-[#00D4FF]/30 focus:ring-1 focus:ring-[#00D4FF]/10 transition-all outline-none"
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex justify-center gap-2 flex-wrap">
                        {categories.map((cat) => {
                            const config = categoryConfig[cat];
                            const count = categoryCounts[cat] || 0;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                        selectedCategory === cat
                                            ? "bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white shadow-lg shadow-[#00D4FF]/20"
                                            : "bg-[#111111] text-white/40 hover:text-white/70 border border-white/[0.06] hover:border-white/10"
                                    }`}
                                >
                                    {cat === "all" ? "Todos" : config?.label || cat}
                                    {count > 0 && (
                                        <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                selectedCategory === cat
                                                    ? "bg-white/20 text-white"
                                                    : "bg-white/5 text-white/30"
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Posts */}
            <section className="pb-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                            <span className="text-white/20 text-sm">Carregando artigos...</span>
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <div className="space-y-6">
                            {/* Featured Post */}
                            {featured && (
                                <Link
                                    to={`/blog/${featured.slug}`}
                                    className="group relative block rounded-2xl overflow-hidden border border-white/[0.04] hover:border-[#00D4FF]/20 transition-all hover:shadow-2xl hover:shadow-[#00D4FF]/5"
                                >
                                    {/* Background image */}
                                    <div className="h-72 md:h-96 relative overflow-hidden bg-[#0A0A0A]">
                                        <img
                                            src={getCoverUrl(featured)}
                                            alt={cleanTitle(featured.title)}
                                            className="w-full h-full object-cover opacity-50 group-hover:opacity-65 group-hover:scale-105 transition-all duration-700 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                                    </div>

                                    {/* Content overlay */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
                                        <div className="max-w-2xl">
                                            {/* Featured + Category badges */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF]">
                                                    Destaque
                                                </span>
                                                {(() => {
                                                    const config = categoryConfig[featured.category] || categoryConfig.mercado;
                                                    return (
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center gap-1.5`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${config.color}`} />
                                                            {config.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-[#00D4FF] transition-colors">
                                                {cleanTitle(featured.title)}
                                            </h2>

                                            <p className="text-white/50 text-sm md:text-base line-clamp-2 mb-5 leading-relaxed">
                                                {featured.summary}
                                            </p>

                                            <div className="flex items-center gap-5 text-white/40 text-xs font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {featured.published_at
                                                        ? format(new Date(featured.published_at), "dd MMM yyyy", { locale: ptBR })
                                                        : "Em breve"}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    5 min leitura
                                                </span>
                                                <span className="flex items-center gap-1.5 text-[#00D4FF] font-semibold group-hover:gap-2.5 transition-all">
                                                    Ler artigo <ArrowRight className="w-3.5 h-3.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* Rest of posts grid */}
                            {rest.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {rest.map((post) => {
                                        const config = categoryConfig[post.category] || categoryConfig.mercado;
                                        return (
                                            <Link
                                                key={post.id}
                                                to={`/blog/${post.slug}`}
                                                className="group bg-[#111111] border border-white/[0.04] rounded-2xl overflow-hidden hover:border-[#00D4FF]/20 transition-all hover:shadow-lg hover:shadow-[#00D4FF]/5 flex flex-col"
                                            >
                                                {/* Cover Image */}
                                                <div className="h-44 relative overflow-hidden bg-[#0A0A0A]">
                                                    <img
                                                        src={getCoverUrl(post)}
                                                        alt={cleanTitle(post.title)}
                                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 ease-out mix-blend-luminosity group-hover:mix-blend-normal"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-15 mix-blend-overlay group-hover:opacity-8 transition-opacity`} />

                                                    <div className="absolute top-3 left-3 z-20">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white flex items-center gap-1.5 shadow-xl">
                                                            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${config.color}`} />
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-3 mb-3 text-white/30 text-xs font-medium">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            {post.published_at
                                                                ? format(new Date(post.published_at), "dd MMM yyyy", { locale: ptBR })
                                                                : "Em breve"}
                                                        </span>
                                                        <span>·</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            5 min
                                                        </span>
                                                    </div>

                                                    <h3 className="text-white font-bold text-[1.05rem] leading-[1.4] mb-2.5 group-hover:text-[#00D4FF] transition-colors line-clamp-2">
                                                        {cleanTitle(post.title)}
                                                    </h3>

                                                    <p className="text-[#94A3B8] text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
                                                        {post.summary}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center">
                                                                <span className="bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] bg-clip-text text-transparent text-[9px] font-bold">
                                                                    {post.author
                                                                        .split(" ")
                                                                        .map((n) => n[0])
                                                                        .join("")
                                                                        .substring(0, 2)
                                                                        .toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <span className="text-white/40 text-xs font-medium">{post.author}</span>
                                                        </div>
                                                        <span className="text-[#00D4FF] text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                                            Ler <ArrowRight className="w-3 h-3" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-24">
                            <div className="w-16 h-16 rounded-2xl bg-[#111] border border-white/[0.04] flex items-center justify-center mx-auto mb-5">
                                <BookOpen className="w-7 h-7 text-white/15" />
                            </div>
                            <h3 className="text-white text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
                            <p className="text-white/25 text-sm">
                                {searchTerm
                                    ? "Tente buscar com outros termos"
                                    : "Em breve teremos conteúdos exclusivos para você!"}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="mt-5 text-[#00D4FF] text-sm hover:underline"
                                >
                                    Limpar busca
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-8 px-4">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={tkbLogo} alt="TKB Asset" className="h-5 w-5 opacity-40" />
                        <span className="text-white/20 text-xs">
                            © {new Date().getFullYear()} TKB Asset. Todos os direitos reservados.
                        </span>
                    </div>
                    <Link to="/" className="text-white/20 hover:text-white/50 text-xs transition-colors">
                        Voltar ao site
                    </Link>
                </div>
            </footer>
        </div>
    );
}
