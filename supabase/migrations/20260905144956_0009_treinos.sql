-- =============================================================================
-- 0009_treinos.sql
-- Biblioteca de exercícios e planos de treino atribuídos aos alunos.
-- =============================================================================

create table exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  nome text not null,
  grupo_muscular text,
  equipamento text,
  instrucoes text,
  video_url text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(nome)) >= 2)
);

create unique index idx_exercises_unique_name_per_trainer
  on exercises(trainer_id, lower(trim(nome)));
create index idx_exercises_trainer_active
  on exercises(trainer_id, ativo, nome);

create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  nome text not null,
  objetivo text,
  data_inicio date,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo', 'arquivado')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(nome)) >= 2),
  check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);

create index idx_workout_plans_trainer_student
  on workout_plans(trainer_id, student_id, status, created_at desc);

create table workout_plan_items (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  workout_plan_id uuid not null references workout_plans(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  bloco text,
  ordem integer not null default 0 check (ordem >= 0),
  series integer check (series is null or series between 1 and 100),
  repeticoes text,
  carga text,
  descanso_segundos integer check (descanso_segundos is null or descanso_segundos between 0 and 7200),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workout_plan_items_plan_order
  on workout_plan_items(workout_plan_id, ordem, created_at);
create index idx_workout_plan_items_exercise
  on workout_plan_items(exercise_id);

create trigger trg_exercises_updated_at
  before update on exercises
  for each row execute function set_updated_at();

create trigger trg_workout_plans_updated_at
  before update on workout_plans
  for each row execute function set_updated_at();

create trigger trg_workout_plan_items_updated_at
  before update on workout_plan_items
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Ownership: evita associação de aluno, plano ou exercício de outro tenant.
-- -----------------------------------------------------------------------------

create or replace function validate_workout_plan_ownership()
returns trigger as $$
begin
  perform 1
    from students s
   where s.id = new.student_id
     and s.trainer_id = new.trainer_id;

  if not found then
    raise exception 'O plano de treino deve pertencer ao mesmo personal do aluno.';
  end if;

  return new;
end;
$$ language plpgsql;

revoke all on function validate_workout_plan_ownership() from public, anon, authenticated;

create trigger trg_validate_workout_plan_ownership
  before insert or update of trainer_id, student_id
  on workout_plans
  for each row execute function validate_workout_plan_ownership();

create or replace function validate_workout_plan_item_ownership()
returns trigger as $$
begin
  perform 1
    from workout_plans wp
    join exercises e on e.id = new.exercise_id
   where wp.id = new.workout_plan_id
     and wp.trainer_id = new.trainer_id
     and e.trainer_id = new.trainer_id;

  if not found then
    raise exception 'Exercício e plano de treino devem pertencer ao mesmo personal.';
  end if;

  return new;
end;
$$ language plpgsql;

revoke all on function validate_workout_plan_item_ownership() from public, anon, authenticated;

create trigger trg_validate_workout_plan_item_ownership
  before insert or update of trainer_id, workout_plan_id, exercise_id
  on workout_plan_items
  for each row execute function validate_workout_plan_item_ownership();

-- -----------------------------------------------------------------------------
-- Data API + RLS
-- -----------------------------------------------------------------------------

grant select, insert, update, delete on table exercises to authenticated, service_role;
grant select, insert, update, delete on table workout_plans to authenticated, service_role;
grant select, insert, update, delete on table workout_plan_items to authenticated, service_role;

revoke all on table exercises from anon;
revoke all on table workout_plans from anon;
revoke all on table workout_plan_items from anon;

alter table exercises enable row level security;
alter table workout_plans enable row level security;
alter table workout_plan_items enable row level security;

create policy exercises_all_own on exercises
  for all
  to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));

create policy workout_plans_all_own on workout_plans
  for all
  to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));

create policy workout_plan_items_all_own on workout_plan_items
  for all
  to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));