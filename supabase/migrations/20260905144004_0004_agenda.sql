-- =============================================================================
-- 0004_agenda.sql
-- Agenda do personal: horário fixo semanal por aluno + sessões avulsas/exceções
-- numa data específica (cancelamento, reagendamento de um dia ou treino extra).
--
-- Modelo: training_schedules guarda o PADRÃO semanal (ex.: "toda segunda às
-- 19h"), editável na aba do aluno. A agenda de um dia é computada combinando
-- esse padrão com training_sessions daquela data: uma sessão com schedule_id
-- preenchido é uma EXCEÇÃO daquela ocorrência específica (horário alterado ou
-- cancelamento); uma sessão com schedule_id nulo é uma sessão AVULSA, fora do
-- padrão semanal. Isso evita ter que pré-gerar linhas para todas as semanas
-- futuras — a camada de serviço (agenda.service.ts) faz esse merge em memória.
-- =============================================================================

create type training_session_status as enum ('agendado', 'concluido', 'cancelado');

-- Novos tipos de evento de auditoria usados pela agenda.
alter type audit_event_type add value if not exists 'horario_treino_criado';
alter type audit_event_type add value if not exists 'horario_treino_atualizado';
alter type audit_event_type add value if not exists 'horario_treino_removido';
alter type audit_event_type add value if not exists 'sessao_treino_registrada';
alter type audit_event_type add value if not exists 'sessao_treino_removida';

-- -----------------------------------------------------------------------------
-- TRAINING_SCHEDULES — padrão semanal fixo (ex.: "toda segunda às 19h")
-- -----------------------------------------------------------------------------

create table training_schedules (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6), -- 0=domingo ... 6=sábado
  horario time not null,
  ativo boolean not null default true,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table training_schedules is 'Padrão semanal fixo de treino de um aluno. Editável na aba do aluno; a agenda usa isso como base para gerar as ocorrências de cada dia.';

create index idx_training_schedules_trainer_id on training_schedules(trainer_id);
create index idx_training_schedules_student_id on training_schedules(student_id);
create index idx_training_schedules_dia_semana on training_schedules(trainer_id, dia_semana) where ativo;

-- -----------------------------------------------------------------------------
-- TRAINING_SESSIONS — sessões avulsas OU exceções de uma ocorrência semanal
-- -----------------------------------------------------------------------------

create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  schedule_id uuid references training_schedules(id) on delete set null,
  data date not null,
  horario time not null,
  status training_session_status not null default 'agendado',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, data)
);

comment on table training_sessions is 'Ocorrências concretas da agenda: sessões avulsas (schedule_id nulo) ou exceções de um horário fixo numa data específica (schedule_id preenchido — horário alterado ou cancelamento apenas daquele dia).';

create index idx_training_sessions_trainer_data on training_sessions(trainer_id, data);
create index idx_training_sessions_student_id on training_sessions(student_id);
create index idx_training_sessions_schedule_id on training_sessions(schedule_id);

create trigger trg_training_schedules_updated_at before update on training_schedules
  for each row execute function set_updated_at();
create trigger trg_training_sessions_updated_at before update on training_sessions
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — mesmo padrão multi-tenant do restante do sistema (trainer_id = auth.uid())
-- -----------------------------------------------------------------------------

alter table training_schedules enable row level security;
alter table training_sessions enable row level security;

create policy training_schedules_all_own on training_schedules
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy training_sessions_all_own on training_sessions
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
