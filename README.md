# Personal Trainer — Gestão e Termo Digital de Ciência e Aceite

Sistema de gestão para personal trainers, com o módulo de **Termo Digital de
Ciência e Aceite** completo na primeira entrega. A arquitetura é modular e
multi-tenant, preparada para receber agenda, controle de sessões e
pagamentos em versões futuras (ver seção "Roadmap" abaixo).

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Server Actions e Route Handlers do próprio Next.js
- **Banco de dados / Auth**: Supabase (PostgreSQL + Supabase Auth + Row Level Security)
- **E-mail**: Resend
- **PDF**: `@react-pdf/renderer` (geração no servidor)
- **Hospedagem recomendada**: Vercel

## Regra fundamental do sistema

**Uma versão publicada de um termo é imutável.** Toda vez que um convite é
enviado a um aluno, o sistema grava um *snapshot* completo do documento
(título, cláusulas, pacote, valores — não apenas IDs). O aceite grava outro
snapshot equivalente, mais um hash SHA-256, garantindo que o conteúdo
apresentado ao aluno naquele momento possa ser comprovado para sempre,
mesmo que o termo seja editado ou uma nova versão seja publicada depois.

## 1. Pré-requisitos

- Node.js 20+ e npm
- Uma conta gratuita no [Supabase](https://supabase.com)
- (Opcional, para envio de e-mail) uma conta no [Resend](https://resend.com)

## 2. Criar o projeto no Supabase

1. Crie um novo projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha esta chave no navegador)
3. Em **SQL Editor**, execute os arquivos de migration nesta ordem (também
   disponíveis em `supabase/migrations/`):
   - `0001_init_schema.sql` — cria todas as tabelas, enums, índices e triggers.
   - `0002_rls_policies.sql` — habilita e configura o Row Level Security
     (isolamento multi-tenant: cada personal só acessa seus próprios dados).

   Se preferir usar a CLI do Supabase:

   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   ```

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com os valores do seu projeto Supabase e, se for usar
envio de e-mail, sua `RESEND_API_KEY` e o remetente em `RESEND_FROM_EMAIL`
(precisa de um domínio verificado no Resend para produção). Sem essa
variável, o sistema funciona normalmente — apenas o e-mail de confirmação de
aceite não é enviado (o registro do aceite nunca depende do e-mail).

Ajuste `NEXT_PUBLIC_APP_URL` para a URL onde a aplicação será acessada (em
desenvolvimento local, `http://localhost:3000`; em produção, o domínio da
Vercel ou seu domínio próprio).

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`, crie uma conta em **/cadastro** e comece a
usar o painel.

## 5. Deploy na Vercel

1. Suba o projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Configure as mesmas variáveis de `.env.local` em **Project Settings → Environment Variables**.
4. Faça o deploy. A cada aceite de aluno, os PDFs são gerados sob demanda
   pela rota `/api/pdf/[acceptanceId]` — não é necessário armazenamento de
   arquivos.

## Estrutura do projeto

```
src/
  app/                       # Rotas (App Router)
    (auth)/                  # Login e cadastro do personal
    (dashboard)/             # Painel autenticado (alunos, pacotes, termos, aceites...)
    aceite/[token]/          # Página pública do aluno (mobile-first)
    api/pdf/[acceptanceId]/  # Geração de PDF do comprovante
  components/
    ui/                      # Design system (Button, Card, Modal, Input...)
    layout/                  # Sidebar, Topbar
    students/ packages/ terms/ invitations/ acceptances/ public-accept/
  lib/
    supabase/                # Clientes Supabase (browser, server, admin, middleware)
    repositories/            # Acesso a dados (uma classe por tabela/domínio)
    services/                # Regras de negócio (versionamento, aceite, e-mail...)
    actions/                 # Server Actions (mutações chamadas pelos formulários)
    validation/              # Schemas Zod (validação client + server)
    utils/                   # Formatação BR, segurança (token/hash/protocolo), variáveis
  types/database.ts          # Tipos TypeScript que espelham o schema do banco
  pdf/                       # Componente do PDF (@react-pdf/renderer)
supabase/migrations/         # Migrations SQL versionadas
```

## Segurança

- **Row Level Security** em todas as tabelas: um personal nunca acessa dados
  de outro (`trainer_id = auth.uid()`).
- A página pública `/aceite/[token]` usa a **service role key** apenas no
  servidor, e o próprio token (gerado com 32 bytes aleatórios,
  criptograficamente seguro) é o que autoriza a leitura/escrita — nenhuma
  informação sensível é exposta ao navegador do aluno além do que já está no
  snapshot do documento.
- Toda entrada de formulário é validada com Zod tanto no cliente quanto no
  servidor (Server Actions).
- IDs sensíveis (alunos, pacotes, termos) nunca são aceitos "cegamente": toda
  consulta ao banco filtra por `trainer_id` do usuário autenticado.

## Aviso sobre o conteúdo jurídico

Este sistema utiliza um **Termo de Ciência e Aceite** com **registro
eletrônico do aceite** — não é uma plataforma de assinatura eletrônica
certificada (ICP-Brasil ou similar). Recomenda-se revisão jurídica
profissional do conteúdo dos termos sempre que envolverem obrigações
relevantes. Caso deseje adicionar assinatura eletrônica com validade jurídica
específica no futuro, trate isso como um módulo separado.

## Roadmap (arquitetura já preparada)

O item "Agenda" já aparece no menu como "Em breve". O banco e o código estão
organizados para receber, sem retrabalho estrutural:

- Agenda, horários e reagendamento
- Controle de aulas realizadas/restantes e check-in
- Pagamentos (pago/pendente/vencido) e renovação automática de pacotes
- Integração com WhatsApp (lembretes, envio de link, cancelamento)
- Relatórios (faturamento, aulas realizadas, faltas, cancelamentos)
- Personalização visual (logo, foto, cor principal) já possui campos prontos
  em `trainer_profiles`, faltando apenas a interface de upload de imagens.

## Termo de demonstração

Na tela **Termos**, o botão **"Usar modelo padrão"** cria automaticamente um
termo com as 16 cláusulas sugeridas no briefing do projeto (objeto do
serviço, pacote, cancelamentos, atrasos, reposição, pagamento etc.) — texto
100% editável antes de publicar a primeira versão.
