-- =============================================================================
-- 0018_workout_plan_weekdays.sql
-- Dias da semana de cada plano para destacar automaticamente o treino do dia.
-- 0 = domingo ... 6 = sábado.
-- =============================================================================

alter table public.workout_plans
  add column if not exists dias_semana smallint[] not null default '{}'::smallint[];

alter table public.workout_plans
  drop constraint if exists workout_plans_dias_semana_valid;

alter table public.workout_plans
  add constraint workout_plans_dias_semana_valid
  check (
    array_position(dias_semana, null) is null
    and dias_semana <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  );

comment on column public.workout_plans.dias_semana is
  'Dias da semana do plano: 0=domingo, 1=segunda, ..., 6=sábado.';
