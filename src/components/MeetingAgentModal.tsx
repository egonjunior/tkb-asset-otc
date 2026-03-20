import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users2, Zap } from "lucide-react";

export interface Agent {
  id: string;
  name: string;
  role: string;
  squad: string;
  squadColor: string;
}

const SQUADS: { id: string; label: string; color: string; agents: Omit<Agent, "squad" | "squadColor">[] }[] = [
  {
    id: "tkb-tech",
    label: "TKB Tech",
    color: "#00D4FF",
    agents: [
      { id: "otc-architect", name: "@otc-architect", role: "Arquitetura & Integrações" },
      { id: "otc-dev", name: "@otc-dev", role: "Frontend & Edge Functions" },
      { id: "otc-qa", name: "@otc-qa", role: "Testes & Qualidade" },
      { id: "otc-devops", name: "@otc-devops", role: "Deploy & Infraestrutura" },
    ],
  },
  {
    id: "tkb-commercial",
    label: "TKB Commercial",
    color: "#10B981",
    agents: [
      { id: "lead-hunter", name: "@lead-hunter", role: "Prospecção & Leads" },
      { id: "outreach-writer", name: "@outreach-writer", role: "Copy de Prospecção" },
      { id: "sales-coach", name: "@sales-coach", role: "Roteiros & Pitch" },
      { id: "crm-integrator", name: "@crm-integrator", role: "Pipeline & CRM" },
    ],
  },
  {
    id: "tkb-marketing",
    label: "TKB Marketing",
    color: "#F59E0B",
    agents: [
      { id: "content-strategist", name: "@content-strategist", role: "Pauta Editorial" },
      { id: "copywriter", name: "@copywriter", role: "Textos & Scripts" },
      { id: "designer-brief", name: "@designer-brief", role: "Direção de Arte" },
      { id: "webdesigner", name: "@webdesigner", role: "Site & Landing Pages" },
      { id: "brand-guardian", name: "@brand-guardian", role: "Identidade da Marca" },
    ],
  },
  {
    id: "tkb-legal",
    label: "TKB Legal",
    color: "#8B5CF6",
    agents: [
      { id: "legal-monitor", name: "@legal-monitor", role: "Regulação BCB/CVM" },
      { id: "contract-drafter", name: "@contract-drafter", role: "Contratos & NDA" },
      { id: "compliance-advisor", name: "@compliance-advisor", role: "Riscos Regulatórios" },
      { id: "offshore-strategist", name: "@offshore-strategist", role: "Estruturas Offshore" },
    ],
  },
  {
    id: "tkb-strategy",
    label: "TKB Strategy",
    color: "#F43F5E",
    agents: [
      { id: "market-intelligence", name: "@market-intelligence", role: "Inteligência Competitiva" },
      { id: "partnership-scout", name: "@partnership-scout", role: "Parcerias Estratégicas" },
      { id: "event-strategist", name: "@event-strategist", role: "Eventos & Networking" },
      { id: "expansion-advisor", name: "@expansion-advisor", role: "Novos Mercados" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MeetingAgentModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(agentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }

  function selectAll() {
    const all = SQUADS.flatMap((s) => s.agents.map((a) => a.id));
    setSelected(new Set(all));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function startMeeting() {
    if (selected.size === 0) return;
    const params = Array.from(selected).join(",");
    navigate(`/meeting?agents=${params}`);
    onClose();
    setSelected(new Set());
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border border-white/[0.06] text-white max-w-xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
              <Users2 className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-white tracking-tight">
                Convocar Meeting Squad
              </DialogTitle>
              <p className="text-[11px] text-white/30 mt-0.5">Selecione os agentes para a reunião</p>
            </div>
          </div>
        </DialogHeader>

        {/* Squad list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {SQUADS.map((squad) => (
            <div key={squad.id}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: squad.color, boxShadow: `0 0 6px ${squad.color}` }}
                />
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: squad.color }}
                >
                  {squad.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {squad.agents.map((agent) => {
                  const isSelected = selected.has(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggle(agent.id)}
                      className={`
                        text-left px-3 py-2.5 rounded-lg border transition-all
                        ${isSelected
                          ? "border-white/20 bg-white/[0.06]"
                          : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08]"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-white/80 font-mono">{agent.name}</span>
                        {isSelected && (
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: squad.color }}
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-white/30 mt-0.5">{agent.role}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Selecionar todos
            </button>
            <span className="text-white/10">·</span>
            <button onClick={clearAll} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Limpar
            </button>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <Badge className="bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20 text-[10px]">
                {selected.size} agente{selected.size > 1 ? "s" : ""}
              </Badge>
            )}
            <Button
              onClick={startMeeting}
              disabled={selected.size === 0}
              className="h-8 px-4 text-[12px] bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-semibold disabled:opacity-30"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Iniciar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SQUADS };
