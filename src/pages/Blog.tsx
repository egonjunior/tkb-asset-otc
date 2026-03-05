import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import tkbLogo from "@/assets/tkb-logo.png";
import { Calendar, ArrowRight, BookOpen, TrendingUp, Shield, Search } from "lucide-react";
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

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
    mercado: { label: "Mercado", icon: TrendingUp, color: "from-cyan-500 to-blue-500" },
    educacional: { label: "Educacional", icon: BookOpen, color: "from-purple-500 to-pink-500" },
    regulacao: { label: "Regulação", icon: Shield, color: "from-amber-500 to-orange-500" },
};

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
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.summary && p.summary.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const categories = ["all", "mercado", "educacional", "regulacao"];

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
                            to="/cotacao"
                            className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Comprar USDT
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Blog <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#3B82F6]">TKB Asset</span>
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
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                            ? "bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white"
                                            : "bg-[#111111] text-white/40 hover:text-white/70 border border-white/[0.06]"
                                        }`}
                                >
                                    {cat === "all" ? "Todos" : config?.label || cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="pb-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPosts.map((post) => {
                                const config = categoryConfig[post.category] || categoryConfig.mercado;
                                const Icon = config.icon;
                                return (
                                    <Link
                                        key={post.id}
                                        to={`/blog/${post.slug}`}
                                        className="group bg-[#111111] border border-white/[0.04] rounded-2xl overflow-hidden hover:border-[#00D4FF]/20 transition-all hover:shadow-lg hover:shadow-[#00D4FF]/5"
                                    >
                                        {/* Cover */}
                                        <div className={`h-40 bg-gradient-to-br ${config.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                                            <Icon className="w-12 h-12 text-white/60" />
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${config.color} text-white`}>
                                                    {config.label}
                                                </span>
                                                {post.published_at && (
                                                    <span className="text-white/20 text-xs flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(post.published_at), "dd MMM yyyy", { locale: ptBR })}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-[#00D4FF] transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>
                                            <p className="text-white/30 text-sm line-clamp-3 mb-4">{post.summary}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white/15 text-xs">{post.author}</span>
                                                <span className="text-[#00D4FF] text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Ler artigo <ArrowRight className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
                            <h3 className="text-white text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
                            <p className="text-white/25 text-sm">
                                {searchTerm ? "Tente buscar com outros termos" : "Em breve teremos conteúdos exclusivos para você!"}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-8 px-4">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={tkbLogo} alt="TKB Asset" className="h-6 w-6" />
                        <span className="text-white/20 text-xs">© {new Date().getFullYear()} TKB Asset. Todos os direitos reservados.</span>
                    </div>
                    <Link to="/" className="text-white/20 hover:text-white/50 text-xs transition-colors">
                        Voltar ao site
                    </Link>
                </div>
            </footer>
        </div>
    );
}
