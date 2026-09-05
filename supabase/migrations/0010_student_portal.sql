-- =============================================================================
-- 0010_student_portal.sql
-- Área do Aluno: login próprio, vínculo seguro auth.users -> students e
-- políticas somente leitura para o aluno acessar exclusivamente seus dados.
-- =============================================================================

create table student_portal_accounts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null unique references students(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_student_portal_accounts_trainer
  on student_portal_accounts(trainer_id, enabled);
create index idx_student_portal_accounts_auth_user
  on student_portal_accounts(auth_user_id);

create trigger trg_student_portal_accounts_updated_at
  before update on student_portal_accounts
  for each row execute function set_updated_at();

create or replace function validate_student_portal_account_ownership()
returns trigger as $$
begin
  perform 1
    from students s
   where s.id = new.student_id
     and s.trainer_id = new.trainer_id;

  if not found then
    raise exception 'A conta do portal deve pertencer ao mesmo personal do aluno.';
  end if;

  return new;
end;
$$ language plpgsql;

revoke all on function validate_student_portal_account_ownership() from public, anon, authenticated;

create trigger trg_validate_student_portal_account_ownership
  before insert or update of trainer_id, student_id
  on student_portal_accounts
  for each row execute function validate_student_portal_account_ownership();

-- Novo usuário Auth de aluno NÃO deve virar trainer automaticamente.
create or replace function handle_new_trainer_user()
returns trigger as $$
begin
  if coalesce(new.raw_app_meta_data->>'role', 'trainer') = 'student' then
    return new;
  end if;

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

revoke all on function handle_new_trainer_user() from public, anon, authenticated;

-- Helpers de policy em schema não exposto pela Data API.
create schema if not exists private;

grant usage on schema private to authenticated;

create or replace function private.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select spa.student_id
    from public.student_portal_accounts spa
   where spa.auth_user_id = (select auth.uid())
     and spa.enabled = true
   limit 1;
$$;

create or replace function private.current_student_trainer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select spa.trainer_id
    from public.student_portal_accounts spa
   where spa.auth_user_id = (select auth.uid())
     and spa.enabled = true
   limit 1;
$$;

revoke all on function private.current_student_id() from public, anon;
revoke all on function private.current_student_trainer_id() from public, anon;
grant execute on function private.current_student_id() to authenticated;
grant execute on function private.current_student_trainer_id() to authenticated;

-- Data API da tabela de vínculo.
grant select, insert, update, delete on table student_portal_accounts to authenticated, service_role;
revoke all on table student_portal_accounts from anon;

alter table student_portal_accounts enable row level security;

create policy student_portal_accounts_trainer_all
  on student_portal_accounts
  for all
  to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));

create policy student_portal_accounts_student_read
  on student_portal_accounts
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id and enabled = true);

-- Garante SELECT às tabelas que compõem o portal. RLS continua sendo a barreira.
grant select on table trainer_profiles to authenticated;
grant select on table students to authenticated;
grant select on table packages to authenticated;
grant select on table student_packages to authenticated;
grant select on table training_schedules to authenticated;
grant select on table training_sessions to authenticated;
grant select on table physical_assessments to authenticated;
grant select on table workout_plans to authenticated;
grant select on table workout_plan_items to authenticated;
grant select on table exercises to authenticated;
grant select on table payments to authenticated;
grant select on table acceptances to authenticated;

-- Policies adicionais somente leitura para contas de aluno.
create policy trainer_profiles_portal_read
  on trainer_profiles for select to authenticated
  using (id = (select private.current_student_trainer_id()));

create policy students_portal_read
  on students for select to authenticated
  using (id = (select private.current_student_id()));

create policy student_packages_portal_read
  on student_packages for select to authenticated
  using (student_id = (select private.current_student_id()));

create policy packages_portal_read
  on packages for select to authenticated
  using (
    trainer_id = (select private.current_student_trainer_id())
    and exists (
      select 1
        from student_packages sp
       where sp.package_id = packages.id
         and sp.student_id = (select private.current_student_id())
    )
  );

create policy training_schedules_portal_read
  on training_schedules for select to authenticated
  using (student_id = (select private.current_student_id()));

create policy training_sessions_portal_read
  on training_sessions for select to authenticated
  using (student_id = (select private.current_student_id()));

create policy physical_assessments_portal_read
  on physical_assessments for select to authenticated
  using (student_id = (select private.current_student_id()));

create policy workout_plans_portal_read
  on workout_plans for select to authenticated
  using (student_id = (select private.current_student_id()));

create policy workout_plan_items_portal_read
  on workout_plan_items for select to authenticated
  using (
    exists (
      select 1
        from workout_plans wp
       where wp.id = workout_plan_items.workout_plan_id
         and wp.student_id = (select private.current_student_id())
    )
  );

create policy exercises_portal_read
  on exercises for select to authenticated
  using (trainer_id = (select private.current_student_trainer_id()));

create policy payments_portal_read
  on payments for select to authenticated
  using (student_id = (select private.current_student_id()));

create policy acceptances_portal_read
  on acceptances for select to authenticated
  using (student_id = (select private.current_student_id()));
