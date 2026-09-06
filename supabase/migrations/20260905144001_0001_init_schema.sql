-- =============================================================================
-- 0001_init_schema.sql
-- Sistema de Gestão para Personal Trainer — Termo Digital de Ciência e Aceite
--
-- Arquitetura multi-tenant: toda tabela relevante carrega trainer_id.
-- Regra fundamental: uma vez publicada, uma versão de termo é IMUTÁVEL.
-- Todo aceite guarda um snapshot completo e independente do documento
-- efetivamente apresentado ao aluno (ver term_invitations.document_snapshot
-- e acceptances.document_snapshot).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

create type student_status as enum ('ativo', 'inativo', 'arquivado');
create type package_status as enum ('ativo', 'inativo');
create type student_package_status as enum ('ativo', 'concluido', 'cancelado', 'expirado');
create type term_version_status as enum ('rascunho', 'publicado', 'arquivado');
create type invitation_status as enum ('pendente', 'aceito', 'expirado', 'cancelado', 'nova_versao_pendente');
create type acceptance_status as enum ('ativo', 'cancelado');
create type audit_event_type as enum (
  'termo_criado',
  'termo_atualizado',
  'clausula_criada',
  'clausula_atualizada',
  'clausula_removida',
  'clausula_reordenada',
  'versao_publicada',
  'convite_gerado',
  'convite_enviado',
  'convite_cancelado',
  'link_acessado',
  'termo_aceito',
  'pdf_gerado',
  'nova_versao_solicitada',
  'aluno_criado',
  'aluno_atualizado',
  'aluno_arquivado',
  'pacote_criado',
  'pacote_atualizado'
);

-- -----------------------------------------------------------------------------
-- TRAINER PROFILES
-- Um registro por personal trainer autenticado (1:1 com auth.users).
-- -----------------------------------------------------------------------------

create table trainer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_profissional text not null,
  nome_empresa text,
  cref text,
  email_contato text,
  telefone text,
  whatsapp text,
  logo_url text,
  foto_url text,
  cor_principal text not null default '#0f172a',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table trainer_profiles is 'Dados profissionais/personalização do personal trainer. Chave = auth.users.id.';

-- -----------------------------------------------------------------------------
-- STUDENTS
-- -----------------------------------------------------------------------------

create table students (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  nome_completo text not null,
  cpf text,
  data_nascimento date,
  telefone text,
  whatsapp text,
  email text,
  observacoes text,
  status student_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_trainer_id on students(trainer_id);
create index idx_students_status on students(trainer_id, status);
create index idx_students_nome on students using gin (to_tsvector('portuguese', nome_completo));

-- -----------------------------------------------------------------------------
-- PACKAGES (pacotes de aulas)
-- -----------------------------------------------------------------------------

create table packages (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  nome text not null,
  descricao text,
  quantidade_aulas integer not null check (quantidade_aulas > 0),
  duracao_minutos integer not null check (duracao_minutos > 0),
  valor_centavos bigint not null check (valor_centavos >= 0),
  validade_dias integer not null check (validade_dias > 0),
  status package_status not null default 'ativo',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_packages_trainer_id on packages(trainer_id);
create index idx_packages_status on packages(trainer_id, status);

-- -----------------------------------------------------------------------------
-- STUDENT_PACKAGES (associação aluno + pacote contratado)
-- -----------------------------------------------------------------------------

create table student_packages (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  package_id uuid not null references packages(id) on delete restrict,
  data_inicio date,
  data_validade_final date,
  aulas_realizadas integer not null default 0,
  status student_package_status not null default 'ativo',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_student_packages_trainer_id on student_packages(trainer_id);
create index idx_student_packages_student_id on student_packages(student_id);

-- -----------------------------------------------------------------------------
-- TERM TEMPLATES (modelo do termo — "container" editável)
-- -----------------------------------------------------------------------------

create table term_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  titulo text not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_term_templates_trainer_id on term_templates(trainer_id);

-- -----------------------------------------------------------------------------
-- TERM CLAUSES (cláusulas do rascunho em edição — mutável)
-- Representa o estado de trabalho atual do template. Ao publicar uma versão,
-- estas linhas são copiadas (snapshot) para term_version_clauses, que é imutável.
-- -----------------------------------------------------------------------------

create table term_clauses (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  template_id uuid not null references term_templates(id) on delete cascade,
  titulo text not null,
  conteudo text not null,
  posicao integer not null default 0,
  obrigatoria boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_term_clauses_template_id on term_clauses(template_id, posicao);

-- -----------------------------------------------------------------------------
-- TERM VERSIONS (versão publicada — IMUTÁVEL após publish)
-- -----------------------------------------------------------------------------

create table term_versions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  template_id uuid not null references term_templates(id) on delete cascade,
  versao text not null, -- ex: "1.0", "1.1", "2.0"
  titulo_snapshot text not null,
  status term_version_status not null default 'rascunho',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (template_id, versao)
);

create index idx_term_versions_template_id on term_versions(template_id);
create index idx_term_versions_trainer_id on term_versions(trainer_id);

-- -----------------------------------------------------------------------------
-- TERM VERSION CLAUSES (snapshot imutável das cláusulas no momento da publicação)
-- -----------------------------------------------------------------------------

create table term_version_clauses (
  id uuid primary key default gen_random_uuid(),
  term_version_id uuid not null references term_versions(id) on delete cascade,
  titulo text not null,
  conteudo text not null,
  posicao integer not null default 0,
  obrigatoria boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_term_version_clauses_version_id on term_version_clauses(term_version_id, posicao);

-- -----------------------------------------------------------------------------
-- TERM INVITATIONS (convites/links individuais enviados ao aluno)
-- document_snapshot guarda TUDO que foi/será apresentado ao aluno: dados do
-- personal, do aluno, do pacote e as cláusulas já com variáveis resolvidas —
-- não apenas IDs. Isso garante que o conteúdo exibido possa ser comprovado
-- mesmo que os dados de origem mudem depois.
-- -----------------------------------------------------------------------------

create table term_invitations (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete restrict,
  package_id uuid not null references packages(id) on delete restrict,
  student_package_id uuid references student_packages(id) on delete set null,
  term_version_id uuid not null references term_versions(id) on delete restrict,
  token text not null unique,
  data_inicio date,
  informacoes_adicionais text,
  document_snapshot jsonb not null,
  status invitation_status not null default 'pendente',
  expires_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_term_invitations_trainer_id on term_invitations(trainer_id);
create index idx_term_invitations_token on term_invitations(token);
create index idx_term_invitations_student_id on term_invitations(student_id);
create index idx_term_invitations_status on term_invitations(trainer_id, status);

-- -----------------------------------------------------------------------------
-- ACCEPTANCES (registro eletrônico do aceite — nunca apagado/alterado)
-- -----------------------------------------------------------------------------

create table acceptances (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references term_invitations(id) on delete restrict,
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete restrict,
  term_id uuid not null references term_templates(id) on delete restrict,
  term_version_id uuid not null references term_versions(id) on delete restrict,
  package_id uuid not null references packages(id) on delete restrict,
  protocolo text not null unique,
  document_snapshot jsonb not null,
  document_hash text not null,
  checkbox_confirmado boolean not null default false,
  accepted_at timestamptz not null default now(),
  timezone text not null default 'America/Sao_Paulo',
  ip_address text,
  user_agent text,
  status acceptance_status not null default 'ativo',
  created_at timestamptz not null default now()
);

create index idx_acceptances_trainer_id on acceptances(trainer_id);
create index idx_acceptances_student_id on acceptances(student_id);
create index idx_acceptances_protocolo on acceptances(protocolo);

-- -----------------------------------------------------------------------------
-- AUDIT LOGS (histórico — nunca apagar registros importantes)
-- -----------------------------------------------------------------------------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  event_type audit_event_type not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_trainer_id on audit_logs(trainer_id, created_at desc);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS (preparado para uso futuro: lembretes, avisos de renovação etc.)
-- -----------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_notifications_trainer_id on notifications(trainer_id, lida);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_trainer_profiles_updated_at before update on trainer_profiles
  for each row execute function set_updated_at();
create trigger trg_students_updated_at before update on students
  for each row execute function set_updated_at();
create trigger trg_packages_updated_at before update on packages
  for each row execute function set_updated_at();
create trigger trg_student_packages_updated_at before update on student_packages
  for each row execute function set_updated_at();
create trigger trg_term_templates_updated_at before update on term_templates
  for each row execute function set_updated_at();
create trigger trg_term_clauses_updated_at before update on term_clauses
  for each row execute function set_updated_at();
create trigger trg_term_invitations_updated_at before update on term_invitations
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Novo usuário autenticado -> cria trainer_profile automaticamente
-- -----------------------------------------------------------------------------

create or replace function handle_new_trainer_user()
returns trigger as $$
begin
  insert into trainer_profiles (id, nome_profissional, email_contato)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_profissional', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_trainer_user();
