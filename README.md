# GestãoPubli

Workspace para designers gráficos, social media e profissionais de comunicação, com interface inspirada em quadros de produtividade e estética Liquid Glass azul-escuro.

## Rodar localmente

1. Instale Node.js LTS.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local` e use a URL e a chave publicável do Supabase indicadas no `.env.example`.
4. Execute `npm run dev`.

Sem variáveis do Supabase, a interface funciona em modo demonstração. Dados de exemplo são locais e não persistem entre sessões.

## Deploy na Vercel

Importe este repositório na Vercel, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` nas variáveis de ambiente e faça o deploy. O `vercel.json` encaminha rotas para o app SPA.

## Supabase

O arquivo `supabase/schema.sql` contém um ponto de partida para tabelas com Row Level Security. Revise as políticas antes de usar em produção. Ative Google OAuth em Authentication > Sign In / Providers e configure URLs de redirecionamento no painel do Supabase e no Google Cloud.

## Situação das integrações

- **Autenticação Supabase:** fluxo de e-mail/senha e OAuth Google no frontend, quando configurado.
- **Projetos, pastas e arquivos:** interface de demonstração. Persistência multiusuário, Storage privado, compartilhamento e permissões ainda precisam ser implementados.
- **Aprovação do cliente:** interface de demonstração. Portal público com token aleatório, anotações sobre imagem e comentários exige backend e armazenamento seguro.
- **Orçamentos:** calcula totais e exporta rascunho em texto. PDF com marca d'água ainda precisa de implementação.
- **Contratos/Gemini:** formulário e rascunho local. A chave Gemini deve ficar em função server-side, nunca no navegador; saída deve ser revisada juridicamente.
- **Instagram:** agenda visual demonstrativa. Publicação real exige Meta App, Instagram profissional, OAuth, permissões e tokens de acesso válidos.
- **Convites/collab:** interface de demonstração, envio de convite e autorização por projeto ainda precisam de backend.

Nunca coloque chaves secretas do Gemini, tokens do Instagram ou service-role key do Supabase em variáveis `VITE_*` ou no frontend.
