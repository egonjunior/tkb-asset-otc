# TKB Asset OTC — Instruções para Claude

## Stack
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (PostgreSQL + Edge Functions em Deno)
- Deploy: Vercel (auto-deploy via push na `main`)
- Repositório: `egonjunior/tkb-asset-otc`

## Fluxo de Deploy

**Após cada commit e push, sempre criar um Pull Request no GitHub e enviar o link para o usuário.**

```bash
gh pr create --repo egonjunior/tkb-asset-otc \
  --base main \
  --head claude/<branch-name> \
  --title "<título>" \
  --body "<descrição>"
```

O usuário clica no link do PR → faz merge → Vercel sobe automaticamente.

## Branch padrão de desenvolvimento
Sempre desenvolver em `claude/setup-tkb-integration-w84cg` (ou branch informada no início da sessão).
