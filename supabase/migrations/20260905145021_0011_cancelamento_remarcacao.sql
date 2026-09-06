-- =============================================================================
-- 0011_cancelamento_remarcacao.sql
-- Solicitações do aluno para cancelar ou remarcar uma ocorrência da agenda.
-- =============================================================================

alter table trainer_profiles
  add column if not exists cancelamento_antecedencia_horas integer not null default 24
  check (cancelamento_antecedencia_horas between 0 and 720);

create table session_change_requests (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  schedule_id uuid references training_schedules(id) on delete set null,
  session_id uuid references training_sessions(id) on delete set null,
  occurrence_date date not null,
  occurrence_time time not null,
  request_type text not null check (request_type in ('cancelamento','remarcacao')),
  requested_date date,
  requested_time time,
  reason text,
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  result_session_id uuid references training_sessions(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (request_type = 'cancelamento' and requested_date is null and requested_time is null)
    or
    (request_type = 'remarcacao' and requested_date is not null and requested_time is not null)
  )
);

create index idx_session_change_requests_trainer_status
  on session_change_requests(trainer_id, status, created_at desc);
create index idx_session_change_requests_student
  on session_change_requests(student_id, created_at desc);
create unique index idx_session_change_requests_one_pending_occurrence
  on session_change_requests(
    student_id,
    occurrence_date,
    coalesce(schedule_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) where status = 'pendente';

create trigger trg_session_change_requests_updated_at
  before update on session_change_requests
  for each row execute function set_updated_at();

create or replace function validate_session_change_request()
returns trigger as $$
declare
  v_notice_hours integer;
  v_occurrence_at timestamptz;
  v_requested_at timestamptz;
begin
  if not exists (
    select 1 from students s
     where s.id = new.student_id and s.trainer_id = new.trainer_id
  ) then
    raise exception 'Aluno e personal não correspondem.';
  end if;

  if new.schedule_id is not null and not exists (
    select 1 from training_schedules ts
     where ts.id = new.schedule_id
       and ts.student_id = new.student_id
       and ts.trainer_id = new.trainer_id
  ) then
    raise exception 'Horário não pertence ao aluno.';
  end if;

  if new.session_id is not null and not exists (
    select 1 from training_sessions ts
     where ts.id = new.session_id
       and ts.student_id = new.student_id
       and ts.trainer_id = new.trainer_id
  ) then
    raise exception 'Sessão não pertence ao aluno.';
  end if;

  select cancelamento_antecedencia_horas
    into v_notice_hours
    from trainer_profiles
   where id = new.trainer_id;

  v_occurrence_at := (new.occurrence_date + new.occurrence_time) at time zone 'America/Sao_Paulo';

  if tg_op = 'INSERT' and v_occurrence_at < now() + make_interval(hours => coalesce(v_notice_hours, 24)) then
    raise exception 'Prazo mínimo para alteração da aula não foi respeitado.';
  end if;

  if new.request_type = 'remarcacao' then
    v_requested_at := (new.requested_date + new.requested_time) at time zone 'America/Sao_Paulo';
    if v_requested_at <= now() then
      raise exception 'A nova data deve estar no futuro.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

revoke all on function validate_session_change_request() from public, anon, authenticated;

create trigger trg_validate_session_change_request
  before insert or update of trainer_id, student_id, schedule_id, session_id, occurrence_date, occurrence_time, request_type, requested_date, requested_time
  on session_change_requests
  for each row execute function validate_session_change_request();

grant select, insert, update, delete on table session_change_requests to authenticated, service_role;
revoke all on table session_change_requests from anon;

alter table session_change_requests enable row level security;

create policy session_change_requests_trainer_all
  on session_change_requests for all to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));

create policy session_change_requests_student_read
  on session_change_requests for select to authenticated
  using (student_id = (select private.current_student_id()));

create policy session_change_requests_student_insert
  on session_change_requests for insert to authenticated
  with check (
    student_id = (select private.current_student_id())
    and trainer_id = (select private.current_student_trainer_id())
    and status = 'pendente'
  );
