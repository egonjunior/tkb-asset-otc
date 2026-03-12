import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./PremiumLanding.css";
import tkbLogo from "@/assets/tkb-logo.png";

/* ─────────────────────────────────────────────
   Pure CSS landing page — models the Claude
   reference design with premium elevation.
───────────────────────────────────────────── */

const PremiumLanding = () => {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    const openModal = () => { setModalOpen(true); document.body.style.overflow = "hidden"; };
    const closeModal = () => { setModalOpen(false); document.body.style.overflow = ""; };

    // ESC key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Scroll fade-in
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
            { threshold: 0.1 }
        );
        document.querySelectorAll(".pl-fade").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top, behavior: "smooth" });
        }
    };

    return (
        <div className="pl-root">

            {/* ── Nav ── */}
            <header className="pl-header">
                <nav className="pl-nav">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src={tkbLogo} alt="TKB Asset" style={{ height: 32, width: 32, objectFit: "contain" }} />
                        <span className="pl-logo">TKB ASSET</span>
                    </div>
                    <ul className="pl-nav-links">
                        <li><a href="#rotas">Como funciona</a></li>
                        <li><a href="#para-quem">Para quem serve</a></li>
                        <li><a href="#faq">Dúvidas</a></li>
                        <li><a href="/blog">Blog</a></li>
                    </ul>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                            onClick={() => navigate("/login")}
                            className="pl-nav-login"
                        >
                            Login
                        </button>
                        <button className="pl-btn-cta" onClick={() => navigate("/register")}>
                            Criar conta
                        </button>
                    </div>
                </nav>
            </header>

            {/* ── Modal: O que é Dólar Digital ── */}
            {modalOpen && (
                <div className="pl-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="pl-modal">
                        <button className="pl-modal-close" onClick={closeModal}>×</button>

                        <h2 className="pl-h2" style={{ marginBottom: "8px" }}>O que é Dólar Digital?</h2>

                        <div className="pl-modal-h3">Resumo simples</div>
                        <p className="pl-body">
                            Dólar Digital (USDT, USDC) é dólar americano em formato digital. Cada 1 token vale exatamente{" "}
                            <strong>1 dólar americano</strong> (lastro 1:1). A diferença está na movimentação: ao invés de passar
                            por 3–5 bancos intermediários (sistema SWIFT), o dólar digital se move diretamente entre origem e destino.
                        </p>

                        <div className="pl-modal-highlight">
                            <strong>Por que é confiável?</strong><br />
                            Diferente de criptomoedas, o Dólar Digital tem lastro 1:1 em ativos reais. Para cada 1 USDT existente,
                            há exatamente 1 dólar americano em reservas auditadas.
                        </div>

                        <div className="pl-modal-h3">Como funciona o lastro?</div>
                        <p className="pl-body" style={{ marginBottom: 16 }}>
                            A Tether (maior emissora do mundo) mantém reservas em ativos de alta liquidez:
                        </p>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {[
                                ["Títulos do Tesouro Americano", "73% das reservas"],
                                ["Ouro físico", "9% das reservas"],
                                ["Outros ativos líquidos", "18% das reservas"],
                            ].map(([item, pct]) => (
                                <li key={item} className="pl-body" style={{ padding: "7px 0", display: "flex", gap: 12 }}>
                                    <span style={{ color: "#00D4FF" }}>✓</span>
                                    <span><strong>{item}</strong> — {pct}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="pl-modal-h3" style={{ marginTop: 32 }}>Escala da Tether</div>
                        <div className="pl-modal-stats">
                            {[
                                ["USD 186 bi", "Valor em circulação (jan/2026)"],
                                ["USD 193 bi", "Total de reservas (106% de cobertura)"],
                                ["17º lugar", "Maior detentor mundial de Títulos do Tesouro EUA"],
                                ["500 milhões", "Usuários no mundo todo"],
                            ].map(([n, l]) => (
                                <div key={n} className="pl-modal-stat">
                                    <div className="pl-modal-stat-n">{n}</div>
                                    <div className="pl-modal-stat-l">{l}</div>
                                </div>
                            ))}
                        </div>

                        <div className="pl-modal-h3">Auditoria e Transparência</div>
                        <p className="pl-body" style={{ marginBottom: 24 }}>
                            Tether publica relatórios trimestrais auditados pela <strong>BDO Italia</strong> (5ª maior do mundo),
                            padrão ISAE 3000R. Todas as reservas são verificadas publicamente a cada 3 meses.
                        </p>

                        <div className="pl-modal-highlight">
                            <strong>Resumo:</strong> Dólar Digital não é especulação. É dólar real em formato digital,
                            com lastro 1:1, auditado trimestralmente, usado por 500 milhões de pessoas.
                        </div>

                        <div style={{ textAlign: "center", marginTop: 36 }}>
                            <button className="pl-btn pl-btn-primary" onClick={closeModal}>Entendi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hero ── */}
            <section className="pl-hero">
                <div className="pl-hero-glow" />
                <div className="pl-container pl-hero-content">
                    <div className="pl-kicker" style={{ marginBottom: 28 }}>Transferência Internacional Empresarial</div>
                    <h1 className="pl-h1" style={{ marginBottom: 28 }}>
                        Pague fornecedor internacional<br />
                        em <strong>minutos</strong>, não dias.
                    </h1>
                    <p className="pl-lead" style={{ margin: "0 auto 48px" }}>
                        Seu fornecedor aceita Dólar Digital (USDT, USDC)? Pagamento em 15–30 minutos.
                        Prefere USD tradicional em conta bancária? Entregamos em 2–3 horas.
                        Você escolhe. Ambos até 75% mais baratos que banco.
                    </p>
                    <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                        <a href="#rotas" className="pl-btn pl-btn-primary">Ver como funciona</a>
                        <button className="pl-btn pl-btn-ghost" onClick={() => scrollTo("contato")}>Falar com especialista</button>
                    </div>
                </div>
            </section>

            {/* ── Rotas ── */}
            <section className="pl-section" id="rotas">
                <div className="pl-container">
                    <div className="pl-fade" style={{ textAlign: "center", maxWidth: 860, margin: "0 auto 0" }}>
                        <h2 className="pl-h2" style={{ marginBottom: 20 }}>
                            Duas formas de pagar.<br />Você escolhe o que seu fornecedor aceita.
                        </h2>
                        <p className="pl-lead" style={{ margin: "0 auto 16px" }}>
                            Não importa se seu fornecedor quer Dólar Digital direto ou USD tradicional em conta bancária.
                            A gente entrega dos dois jeitos — rápido e barato nos dois casos.
                        </p>
                        <button className="pl-btn-link" onClick={openModal}>O que é Dólar Digital? →</button>
                    </div>

                    <div className="pl-routes-grid pl-fade">
                        {/* Rota 1 */}
                        <div className="pl-route-card route-fast">
                            <span className="pl-route-badge badge-fast">Mais rápida</span>
                            <h3 className="pl-h3" style={{ marginBottom: 14 }}>Dólar Digital Direto</h3>
                            <p className="pl-body" style={{ marginBottom: 0 }}>
                                Para fornecedores que aceitam USDT ou USDC na carteira.
                                Você manda BRL, a gente converte e envia. Simples e ultra-rápido.
                            </p>

                            <div className="pl-flow">
                                {[
                                    ["1. Você", "Envia BRL pra TKB"],
                                    ["2. TKB", "Converte BRL → Dólar Digital"],
                                    ["3. Fornecedor", "Recebe Dólar Digital na carteira"],
                                ].map(([label, value], i, arr) => (
                                    <React.Fragment key={label}>
                                        <div className="pl-flow-step">
                                            <span className="pl-flow-label">{label}</span>
                                            <span className="pl-flow-value">{value}</span>
                                        </div>
                                        {i < arr.length - 1 && <div className="pl-flow-arrow">↓</div>}
                                    </React.Fragment>
                                ))}
                            </div>

                            <ul className="pl-specs">
                                <li><span className="pl-spec-label">Tempo total</span><span className="pl-spec-accent">15-30 minutos</span></li>
                                <li><span className="pl-spec-label">Custo TKB</span><span className="pl-spec-accent">1,0% – 1,5%</span></li>
                                <li><span className="pl-spec-label">O que recebe</span><span className="pl-spec-value">Dólar Digital (USDT, USDC)</span></li>
                                <li><span className="pl-spec-label">Disponibilidade</span><span className="pl-spec-accent">24/7</span></li>
                            </ul>

                            <div className="pl-ideal">
                                <h4>Ideal quando:</h4>
                                <ul>
                                    {["Fornecedor já aceita Dólar Digital", "Velocidade é crítica (mercado spot)", "Operação precisa acontecer fim de semana", "Quer o menor custo possível"].map(l => <li key={l}>{l}</li>)}
                                </ul>
                            </div>
                        </div>

                        {/* Rota 2 */}
                        <div className="pl-route-card route-standard">
                            <span className="pl-route-badge badge-std">Mais comum</span>
                            <h3 className="pl-h3" style={{ marginBottom: 14 }}>USD em Conta Bancária</h3>
                            <p className="pl-body" style={{ marginBottom: 0 }}>
                                Para fornecedores que querem USD tradicional em conta bancária americana.
                                Você manda BRL, nosso provedor USA entrega USD na conta do fornecedor.
                            </p>

                            <div className="pl-flow">
                                {[
                                    ["1. Você", "Envia BRL pra TKB"],
                                    ["2. TKB", "Converte BRL → Dólar Digital"],
                                    ["3. Provedor USA", "Converte Dólar Digital → USD"],
                                    ["4. Fornecedor", "Recebe USD em conta bancária"],
                                ].map(([label, value], i, arr) => (
                                    <React.Fragment key={label}>
                                        <div className="pl-flow-step">
                                            <span className="pl-flow-label">{label}</span>
                                            <span className="pl-flow-value">{value}</span>
                                        </div>
                                        {i < arr.length - 1 && <div className="pl-flow-arrow">↓</div>}
                                    </React.Fragment>
                                ))}
                            </div>

                            <ul className="pl-specs">
                                <li><span className="pl-spec-label">Tempo total</span><span className="pl-spec-value" style={{ color: "#6496FF", fontWeight: 600 }}>2–3 horas</span></li>
                                <li><span className="pl-spec-label">Custo TKB</span><span className="pl-spec-value" style={{ color: "#6496FF", fontWeight: 600 }}>1,5% – 2,0%</span></li>
                                <li><span className="pl-spec-label">O que recebe</span><span className="pl-spec-value">USD (conta bancária)</span></li>
                                <li><span className="pl-spec-label">Disponibilidade</span><span className="pl-spec-value">Horário comercial USA</span></li>
                            </ul>

                            <div className="pl-ideal">
                                <h4>Ideal quando:</h4>
                                <ul>
                                    {["Fornecedor não aceita Dólar Digital", "Quer USD tradicional em banco", "2–3h é suficientemente rápido", "Importação padrão (China, EUA, Europa)"].map(l => <li key={l}>{l}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Comparação ── */}
            <section className="pl-section">
                <div className="pl-container pl-fade">
                    <h2 className="pl-h2 pl-section-center" style={{ marginBottom: 0 }}>Comparação: Banco vs TKB</h2>

                    <div className="pl-table-wrap">
                        <div className="pl-table-row pl-table-head">
                            {["Critério", "Banco Tradicional", "TKB Dólar Digital", "TKB USD Banco"].map(c => (
                                <div key={c} className="pl-table-cell">{c}</div>
                            ))}
                        </div>
                        {[
                            ["Tempo de entrega", ["5–7 dias", "c-poor"], ["15–30 min", "c-great"], ["2–3 horas", "c-good"]],
                            ["Custo total", ["4,5–6%", "c-poor"], ["1,0–1,5%", "c-great"], ["1,5–2,0%", "c-good"]],
                            ["Disponibilidade", ["Horário bancário", "c-poor"], ["24/7/365", "c-great"], ["Horário comercial", "c-good"]],
                            ["Rastreabilidade", ["Opaco", "c-poor"], ["Tempo real", "c-great"], ["Parcial", "c-good"]],
                            ["Burocracia", ["Alta", "c-poor"], ["Mínima", "c-great"], ["Baixa", "c-good"]],
                        ].map(([label, ...cols]) => (
                            <div key={label as string} className="pl-table-row">
                                <div className="pl-table-cell cell-label">{label}</div>
                                {(cols as [string, string][]).map(([val, cls]) => (
                                    <div key={val} className={`pl-table-cell cell-val ${cls}`}>{val}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="pl-section">
                <div className="pl-container pl-fade">
                    <h2 className="pl-h2 pl-section-center" style={{ marginBottom: 0 }}>Economia real em cada rota</h2>
                    <div className="pl-stats">
                        {[
                            ["75%", "Economia Dólar Digital vs banco"],
                            ["15min", "Tempo rota Dólar Digital direto"],
                            ["3h", "Tempo rota USD banco"],
                            ["R$50M+", "Movimentado nos últimos 12 meses"],
                        ].map(([n, l]) => (
                            <div key={n} className="pl-stat">
                                <div className="pl-stat-num">{n}</div>
                                <div className="pl-stat-label">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Para quem ── */}
            <section className="pl-section" id="para-quem">
                <div className="pl-container pl-fade">
                    <div className="pl-section-center" style={{ maxWidth: 700, margin: "0 auto 0" }}>
                        <h2 className="pl-h2" style={{ marginBottom: 16 }}>Qual rota usar em cada situação</h2>
                        <p className="pl-lead" style={{ margin: "0 auto" }}>
                            Cada negócio tem um timing diferente. Mostramos qual rota usar em cada caso.
                        </p>
                    </div>
                    <div className="pl-cases">
                        {[
                            ["🌾", "Agronegócio", "Fertilizante importado, químicos, máquinas agrícolas. Safra tem data pra começar. Fornecedor geralmente aceita USD em banco.", "→ Rota USD Banco (2–3h)"],
                            ["📈", "Trading Commodities", "Mercado spot. Janela fecha em minutos. Margem depende de timing perfeito. Fornecedores modernos aceitam Dólar Digital.", "→ Rota Dólar Digital Direto (15–30min)"],
                            ["🏭", "Importação China/Ásia", "Container no porto. Desembaraço não pode atrasar. Fornecedor chinês aceita ambos: Dólar Digital ou USD tradicional.", "→ Ambas as rotas funcionam"],
                            ["💻", "SaaS & Digital", "Facebook Ads, Google Ads, AWS, servidores cloud. Pagamentos mensais recorrentes em USD. Plataformas aceitam ambos.", "→ Dólar Digital Direto (menor custo)"],
                            ["⚡", "Energia", "Combustível, gás, eletricidade. Mercado 24/7. Hedge operacional. Precisa executar quando spread está ideal.", "→ Dólar Digital Direto (24/7)"],
                            ["💊", "Farmacêutico", "Princípios ativos, insumos críticos. Regulatório tem prazo. Fornecedores tradicionais preferem USD em banco.", "→ Rota USD Banco (2–3h)"],
                        ].map(([icon, title, desc, tag]) => (
                            <div key={title as string} className="pl-case">
                                <span className="pl-case-icon">{icon}</span>
                                <h3>{title}</h3>
                                <p>{desc}</p>
                                <span className="pl-case-tag">{tag}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="pl-section" id="faq">
                <div className="pl-container pl-fade">
                    <h2 className="pl-h2 pl-section-center" style={{ marginBottom: 0 }}>Perguntas sobre as duas rotas</h2>
                    <div className="pl-faq">
                        {[
                            ["Como sei qual rota usar?", 'Pergunte pro seu fornecedor: "você aceita Dólar Digital (USDT, USDC)?" Se sim, rota Dólar Digital Direto (15–30min, mais barato). Se não, rota USD Banco (2–3h, USD tradicional). Nosso time ajuda você a decidir no primeiro contato.'],
                            ["O que é Dólar Digital (USDT, USDC)?", <>Dólar Digital é dólar americano em formato digital. Cada 1 token vale exatamente 1 dólar americano (lastro 1:1 em títulos do Tesouro Americano). É como dólar normal, mas move mais rápido porque não passa pelo sistema bancário tradicional. <button className="pl-btn-link" onClick={openModal} style={{ marginTop: 8 }}>Saiba mais →</button></>],
                            ["Meu fornecedor não conhece Dólar Digital. E agora?", "Sem problema. Use a rota USD Banco. Seu fornecedor recebe USD tradicional na conta bancária dele. Ele nem sabe que Dólar Digital foi usado no meio do caminho. Pra ele é como wire transfer normal, só que chega em 2–3h ao invés de 5–7 dias."],
                            ["Por que a rota USD Banco demora 2–3h e não 15min?", "Porque tem uma conversão extra no meio. BRL → Dólar Digital (rápido). Dólar Digital → Provedor USA → USD banco (depende de horário bancário americano). Mesmo assim, 2–3h ainda é 15x mais rápido que banco tradicional."],
                            ["Qual rota é mais barata?", "Dólar Digital Direto: 1,0–1,5% (mais barata). USD Banco: 1,5–2,0% (conversão extra). Mas ambas são muito mais baratas que banco tradicional (4,5–6%). Você economiza em qualquer uma das duas."],
                            ["Posso trocar de rota depois?", "Sim. Você escolhe a rota a cada operação. Hoje usa Dólar Digital Direto pro fornecedor A. Semana que vem usa USD Banco pro fornecedor B. Totalmente flexível."],
                        ].map(([q, a], i) => (
                            <div key={i} className="pl-faq-item">
                                <div className="pl-faq-q">{q}</div>
                                <div className="pl-faq-a">{a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="pl-section" id="contato">
                <div className="pl-container pl-fade">
                    <div className="pl-cta-box">
                        <div className="pl-cta-box-inner">
                            <h2 className="pl-h2" style={{ marginBottom: 18 }}>Pronto pra economizar e acelerar?</h2>
                            <p className="pl-lead" style={{ margin: "0 auto 36px" }}>
                                Fale com nosso time. A gente te ajuda a escolher a rota ideal pro seu caso.
                                Primeira operação sem custo de setup. Onboarding em 48h.
                            </p>
                            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                                <a href="https://wa.me/5541984219668" target="_blank" rel="noreferrer" className="pl-btn pl-btn-primary">
                                    WhatsApp
                                </a>
                                <a href="mailto:gestao@tkbasset.com" className="pl-btn pl-btn-ghost">
                                    gestao@tkbasset.com
                                </a>
                            </div>
                            <p className="pl-cta-note">Resposta em até 2 horas úteis</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="pl-footer">
                <div className="pl-container">
                    <div className="pl-footer-grid">
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <img src={tkbLogo} alt="TKB Asset" style={{ height: 28, width: 28, objectFit: "contain" }} />
                                <span className="pl-logo" style={{ fontSize: 16 }}>TKB ASSET</span>
                            </div>
                            <p className="pl-body" style={{ fontSize: 14, maxWidth: 320, color: "rgba(255,255,255,0.5)" }}>
                                Transferência internacional empresarial.<br />
                                Dólar Digital direto em 15–30min ou USD em banco em 2–3h.<br />
                                Você escolhe. Ambos até 75% mais baratos que banco.
                            </p>
                        </div>
                        <div className="pl-footer-links">
                            <h4>Rotas</h4>
                            <ul>
                                <li><a href="#rotas">Dólar Digital Direto</a></li>
                                <li><a href="#rotas">USD em Banco</a></li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); openModal(); }}>O que é Dólar Digital?</a></li>
                            </ul>
                        </div>
                        <div className="pl-footer-links">
                            <h4>Empresa</h4>
                            <ul>
                                <li><a href="#">Sobre</a></li>
                                <li><a href="#">Compliance</a></li>
                                <li><a href="/blog">Blog</a></li>
                            </ul>
                        </div>
                        <div className="pl-footer-links">
                            <h4>Contato</h4>
                            <ul>
                                <li><a href="https://wa.me/5541984219668" target="_blank" rel="noreferrer">WhatsApp</a></li>
                                <li><a href="mailto:gestao@tkbasset.com">Email</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pl-footer-bottom">
                        <div>© 2026 TKB Asset · CNPJ 45.933.866/0001-93</div>
                        <div>São Paulo, Brasil</div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default PremiumLanding;
