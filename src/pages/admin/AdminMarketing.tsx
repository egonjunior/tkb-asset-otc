import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, LayoutTemplate, PenTool, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SocialPlatform = 'linkedin_post' | 'instagram_carousel' | 'instagram_post';

interface SocialContent {
    id: string;
    platform: SocialPlatform;
    topic: string;
    content_json: any;
    status: string;
    created_at: string;
}

export default function AdminMarketing() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [contents, setContents] = useState<SocialContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Generator State
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState("");
    const [platform, setPlatform] = useState<SocialPlatform>("linkedin_post");
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedContent, setSelectedContent] = useState<SocialContent | null>(null);

    useEffect(() => {
        fetchContents();
    }, []);

    const fetchContents = async () => {
        const { data, error } = await (supabase as any)
            .from("social_content")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setContents(data);
        }
        setIsLoading(false);
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

            // 1. Call Edge Function
            const response = await fetch(
                `${supabaseUrl}/functions/v1/generate-social-content`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": anonKey,
                    },
                    body: JSON.stringify({ topic, platform }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Erro ${response.status}`);
            }

            // 2. Save to DB
            const { data: insertedData, error: dbError } = await (supabase as any)
                .from("social_content")
                .insert({
                    topic,
                    platform,
                    content_json: result,
                    status: 'draft'
                })
                .select()
                .single();

            if (dbError) throw dbError;

            toast({
                title: "✅ Conteúdo Gerado!",
                description: "O conteúdo visual foi criado com sucesso.",
            });

            setTopic("");
            fetchContents();
            openPreview(insertedData);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao gerar conteúdo",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const openPreview = (content: SocialContent) => {
        setSelectedContent(content);
        setShowPreviewModal(true);
    };

    const platformLabels: Record<string, string> = {
        linkedin_post: "LinkedIn Post",
        instagram_carousel: "Instagram Carrossel",
        instagram_post: "Instagram Post Único"
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white">
            {/* Header */}
            <header className="bg-[#1E293B]/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" className="mb-2 text-white/50 hover:text-white" onClick={() => navigate("/admin/dashboard")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Dashboard
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <LayoutTemplate className="w-6 h-6 text-rose-500" />
                                Sala de Marketing (Beta)
                            </h1>
                            <p className="text-white/50 text-sm mt-1">Crie conteúdo automatizado e visualmente alinhado à TKB Asset.</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lateral Esquerda: Gerador */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-[#1E293B]/50 border-white/10 text-white backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#00D4FF]" />
                                Nova Publicação (IA)
                            </CardTitle>
                            <CardDescription className="text-white/40">
                                Descreva o tema. O Claude irá gerar o texto, títulos e a estrutura visual automaticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-white/70">Formato</Label>
                                <Select value={platform} onValueChange={(val: SocialPlatform) => setPlatform(val)}>
                                    <SelectTrigger className="mt-1 bg-[#0F172A] border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1E293B] border-white/10 text-white">
                                        <SelectItem value="linkedin_post">LinkedIn (Texto + Post)</SelectItem>
                                        <SelectItem value="instagram_carousel">Instagram (Carrossel)</SelectItem>
                                        <SelectItem value="instagram_post">Instagram (Imagem Única)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-white/70">Tópico / Briefing</Label>
                                <Input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ex: Resumo do FOMC e impacto..."
                                    className="mt-1 bg-[#0F172A] border-white/10 text-white placeholder:text-white/20"
                                />
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic.trim()}
                                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 hover:opacity-90 transition-opacity"
                            >
                                {isGenerating ? "Gerando Layout e Texto..." : "Gerar Conteúdo"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Lateral Direita: Histórico e Galeria */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Conteúdos Recentes</h2>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10 text-white/30">Carregando...</div>
                    ) : contents.length === 0 ? (
                        <div className="text-center py-20 bg-[#1E293B]/30 border border-white/5 rounded-2xl">
                            <PenTool className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40">Nenhum conteúdo gerado ainda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contents.map(content => (
                                <Card key={content.id} className="bg-[#1E293B]/50 border-white/10 hover:border-rose-500/50 transition-colors cursor-pointer group" onClick={() => openPreview(content)}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-white/60">
                                                {platformLabels[content.platform]}
                                            </span>
                                            <span className="text-[10px] text-white/30">
                                                {new Date(content.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-white font-medium line-clamp-2 text-sm group-hover:text-rose-400 transition-colors">
                                            {content.topic}
                                        </h3>
                                        <div className="mt-4 flex items-center text-xs text-[#00D4FF] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ver Estúdio Visual <ExternalLink className="w-3 h-3 ml-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de Prévia (O Core do Canva-like) */}
            <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
                <DialogContent className="max-w-4xl bg-[#0A0A0A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Estúdio Visual</DialogTitle>
                        <DialogDescription className="text-white/40">
                            Visualize como a arte ficará na plataforma. (Funções de exportação em breve).
                        </DialogDescription>
                    </DialogHeader>

                    {selectedContent && (
                        <div className="mt-4 bg-[#111] border border-white/5 rounded-xl p-4 md:p-8 flex items-center justify-center overflow-x-auto">
                            {/* Renderização baseada no tipo */}

                            {selectedContent.platform === 'linkedin_post' && (
                                <div className="bg-white text-black w-full max-w-md rounded-xl p-6 shadow-2xl text-left font-sans">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xl text-blue-600">
                                            TK
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">TKB Asset</h4>
                                            <p className="text-xs text-gray-500">Instituição Financeira • 1d</p>
                                        </div>
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                                        {selectedContent.content_json.content}
                                    </div>
                                </div>
                            )}

                            {selectedContent.platform === 'instagram_carousel' && selectedContent.content_json.content && (
                                <div className="flex gap-6 pb-4">
                                    {(selectedContent.content_json.content as any[]).map((slide, idx) => (
                                        <div key={idx} className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex-shrink-0 bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-white/10 rounded-xl relative overflow-hidden shadow-2xl flex flex-col justify-center p-8">
                                            {/* Design Elements TKB */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF] rounded-full blur-[64px] opacity-10" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full blur-[64px] opacity-10" />

                                            <div className="absolute top-6 left-6 text-white/30 text-xs font-bold tracking-widest">
                                                TKB ASSET
                                            </div>

                                            {slide.type === 'cover' ? (
                                                <div className="text-center z-10">
                                                    <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4 tracking-tight uppercase">
                                                        {slide.title}
                                                    </h2>
                                                    <p className="text-[#00D4FF] font-medium text-lg">{slide.body}</p>
                                                </div>
                                            ) : slide.type === 'cta' ? (
                                                <div className="text-center z-10 w-full flex flex-col items-center">
                                                    <h2 className="text-2xl font-bold text-white mb-6 text-center">{slide.title}</h2>
                                                    <div className="bg-gradient-to-r from-[#00D4FF] to-blue-600 text-white font-bold py-3 px-6 rounded-lg inline-block">
                                                        {slide.body}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="z-10">
                                                    <h3 className="text-[#00D4FF] text-xl font-bold mb-4">{slide.title}</h3>
                                                    <p className="text-white/80 text-lg leading-relaxed">{slide.body}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedContent.platform === 'instagram_post' && (
                                <div className="flex flex-col md:flex-row gap-8 w-full">
                                    <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] mx-auto flex-shrink-0 bg-[#0A0A0A] border border-[#00D4FF]/20 rounded-xl relative overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00D4FF] rounded-full blur-[100px] opacity-15" />
                                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug z-10 text-balance">
                                            {selectedContent.content_json.content?.imageText}
                                        </h2>
                                        <div className="absolute bottom-6 text-white/20 text-xs font-medium tracking-widest">
                                            TKB ASSET
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-white/5 p-6 rounded-xl border border-white/10 h-[300px] md:h-[400px] overflow-y-auto">
                                        <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">Legenda do Post</h4>
                                        <p className="text-sm whitespace-pre-wrap text-white/80 leading-relaxed">
                                            {selectedContent.content_json.content?.caption}
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
