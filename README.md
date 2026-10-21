# VÁRZEA PRO — micro SaaS de treino para jogador de várzea

React + TypeScript + Tailwind (PWA) · Supabase (Postgres, Auth por link mágico, RLS, Edge Functions) · Three.js (R3F).

## Rodar local (sem backend)
```
npm i && VITE_DEMO=true npm run dev     # dados no navegador; /app/perfil permite simular mensal/anual/sem plano
npm test                                # regras de acesso, webhook, planner, adaptação por local, seed
```

## Colocar no ar
1. Crie o projeto Supabase e rode `supabase/migrations/0001_schema.sql`.
2. `insert into public.admins values ('seu@email.com');`
3. Edge Functions: `checkout-webhook` (`--no-verify-jwt`), `admin-grant`, `delete-account`.
   Secrets: `WEBHOOK_SECRET`, `PLAN_ANNUAL_MATCH` (texto/ID que identifica o anual).
   Webhook no checkout: `https://<proj>.functions.supabase.co/checkout-webhook?token=<WEBHOOK_SECRET>`.
   **Confira os campos de Hotmart/Kiwify/Hubla com um payload de teste real** (`supabase/functions/_shared/webhook.ts`); há também um formato genérico `{event,email,plan,period_end,ref}`.
4. Conteúdo inicial: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed`.
5. Auth: habilite e-mail (link mágico) e a URL do site. Variáveis do front: ver `.env.example`.
6. Admin > Preços: fase, preços e URLs de checkout (sem publicar código).

## Animações 3D (GLB)
Envie pelo admin (Exercícios > Animação 3D, até ~2 MB, 8–15 s, loop). Clips nomeados `erro`, `correto`, `n1`..`n4` (senão usa o primeiro). Os ossos com "knee/joelho", "ankle/tornozelo", "hip/quadril" no nome alimentam zoom e raio‑X. Sem GLB aparece o manequim provisório (ou imagem/vídeo próprio).

## Avisos
- Textos de lições, guia e termos são rascunho: revisão de treinador/advogado antes de publicar.
- Landing sem depoimentos/resultados: preencha `src/content/landing.ts` com dados reais.
