import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Users2, Send, X, ChevronLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SQUADS } from "@/components/MeetingAgentModal";

interface Message {
  id: string;
  role: "user" | "agent";
  agentId?: string;
  agentName?: string;
  agentColor?: string;
  content: string;
  timestamp: Date;
}

function getAgentMeta(agentId: string) {
  for (const squad of SQUADS) {
    for (const agent of squad.agents) {
      if (agent.id === agentId) {
        return { ...agent, squad: squad.id, squadLabel: squad.label, color: squad.color };
      }
    }
  }
  return null;
}

export default function MeetingSquad() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agentIds = (searchParams.get("agents") ?? "").split(",").filter(Boolean);
  const agents = agentIds.map(getAgentMeta).filter(Boolean) as NonNullable<ReturnType<typeof getAgentMeta>>[];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "agent",
      agentId: "system",
      agentName: "Meeting Squad",
      agentColor: "#00D4FF",
      content: `Reunião iniciada com ${agents.length} agente${agents.length > 1 ? "s" : ""}: ${agents.map((a) => a.name).join(", ")}. Como posso ajudar?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (agents.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/40 text-sm">Nenhum agente selecionado.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="border-white/10 text-white/50">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  function handleSend() {
    if (!input.trim() || sending) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Simulate agent responses — replace with real AI call
    setTimeout(() => {
      const responses: Message[] = agents.map((agent, i) => ({
        id: `${Date.now()}-${i}`,
        role: "agent",
        agentId: agent.id,
        agentName: agent.name,
        agentColor: agent.color,
        content: `[${agent.name}] Recebido. Trabalhando nisso dentro da perspectiva de ${agent.role}.`,
        timestamp: new Date(),
      }));
      setMessages((prev) => [...prev, ...responses]);
      setSending(false);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex-none border-b border-white/[0.04] bg-black/80 backdrop-blur-sm px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors text-white/30 hover:text-white/60"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
              <Users2 className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">Meeting Squad</h1>
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.15em]">
                Sala ativa · {agents.length} agente{agents.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Agent chips */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02]"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: agent.color, boxShadow: `0 0 4px ${agent.color}` }}
                />
                <span className="text-[10px] font-mono text-white/50">{agent.name}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors text-white/20 hover:text-white/50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "agent" ? (
                <div className="max-w-[85%] space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: msg.agentColor ?? "#00D4FF",
                        boxShadow: `0 0 4px ${msg.agentColor ?? "#00D4FF"}`,
                      }}
                    />
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.15em]"
                      style={{ color: msg.agentColor ?? "#00D4FF" }}
                    >
                      {msg.agentName}
                    </span>
                    <span className="text-[9px] text-white/20">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[75%] space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[9px] text-white/20">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">Você</span>
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-[#00D4FF]/8 border border-[#00D4FF]/15">
                    <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse [animation-delay:0.2s]" />
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-none border-t border-white/[0.04] bg-black/80 backdrop-blur-sm px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Fale com ${agents.map((a) => a.name).join(", ")}...`}
              rows={1}
              className="w-full resize-none bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors leading-relaxed min-h-[46px] max-h-32"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="h-[46px] w-[46px] p-0 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black disabled:opacity-20 rounded-xl flex-none"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="max-w-4xl mx-auto text-[10px] text-white/15 mt-2 font-mono">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
