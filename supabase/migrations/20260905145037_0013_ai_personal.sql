-- =============================================================================
-- 0013_ai_personal.sql
-- Log mínimo de uso da IA. Não persiste prompt nem resposta por padrão.
-- =============================================================================

create table ai_personal_logs (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  model text not null,
  request_type text not null default 'consulta',
  input_chars integer not null default 0,
  output_chars integer not null default 0,
  status text not null check (status in ('sucesso','erro')),
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_ai_personal_logs_trainer_created
  on ai_personal_logs(trainer_id, created_at desc);

alter table ai_personal_logs enable row level security;
grant select, insert on ai_personal_logs to authenticated, service_role;
revoke all on ai_personal_logs from anon;

create policy ai_personal_logs_trainer_access
  on ai_personal_logs for all to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));
