-- =============================================================================
-- 0005_admin_access.sql
-- Acesso administrativo: permite que uma conta separada (ex: quem desenvolve
-- e dá suporte ao sistema) gerencie os dados de um trainer específico sem
-- precisar logar com as credenciais dele.
--
-- Modelo: tabela admins vincula um auth.users (o administrador) a um
-- trainer_profiles específico (managed_trainer_id). A função
-- is_managing_trainer() é usada nas policies de RLS para liberar acesso.
--
-- Importante: todo novo usuário autenticado já ganha automaticamente um
-- trainer_profiles vazio (trigger trg_on_auth_user_created, ver 0001). Isso
-- vale também pro administrador — ele terá um perfil de trainer próprio (e
-- vazio) além de gerenciar o trainer real. A aplicação (requireTrainer) dá
-- prioridade ao vínculo de admin sobre o perfil próprio, então esse perfil
-- vazio simplesmente nunca é usado.
-- =============================================================================

create table admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  managed_trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table admins is 'Contas com acesso administrativo a um trainer específico (suporte/gestão do sistema).';

create index idx_admins_managed_trainer_id on admins(managed_trainer_id);

alter table admins enable row level security;

-- Um admin só pode ler o próprio vínculo (necessário pra requireTrainer()
-- descobrir qual trainer ele gerencia). Não há policy de insert/update/delete:
-- esse vínculo só é criado manualmente via SQL Editor (Service Role/dono do
-- projeto), nunca pela aplicação.
create policy admins_select_own on admins
  for select using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Função auxiliar: o usuário autenticado atualmente gerencia este trainer?
-- security definer pra poder consultar a tabela admins independente das
-- policies de RLS dela (evita recursão e funciona em qualquer contexto).
-- -----------------------------------------------------------------------------
create or replace function is_managing_trainer(target_trainer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins
    where user_id = auth.uid()
      and managed_trainer_id = target_trainer_id
  );
$$;

grant execute on function is_managing_trainer(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Atualiza as policies existentes pra também liberar o administrador do
-- trainer correspondente, mantendo o isolamento entre tenants para todos os
-- demais usuários.
-- -----------------------------------------------------------------------------

alter policy trainer_profiles_select_own on trainer_profiles
  using (id = auth.uid() or is_managing_trainer(id));
alter policy trainer_profiles_update_own on trainer_profiles
  using (id = auth.uid() or is_managing_trainer(id));

alter policy students_all_own on students
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy packages_all_own on packages
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy student_packages_all_own on student_packages
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy term_templates_all_own on term_templates
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy term_clauses_all_own on term_clauses
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy term_versions_all_own on term_versions
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy term_version_clauses_select_own on term_version_clauses
  using (
    exists (
      select 1 from term_versions tv
      where tv.id = term_version_clauses.term_version_id
        and (tv.trainer_id = auth.uid() or is_managing_trainer(tv.trainer_id))
    )
  );
alter policy term_version_clauses_insert_own on term_version_clauses
  with check (
    exists (
      select 1 from term_versions tv
      where tv.id = term_version_clauses.term_version_id
        and (tv.trainer_id = auth.uid() or is_managing_trainer(tv.trainer_id))
    )
  );

alter policy term_invitations_all_own on term_invitations
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy acceptances_select_own on acceptances
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy audit_logs_select_own on audit_logs
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id));
alter policy audit_logs_insert_own on audit_logs
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy notifications_all_own on notifications
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy training_schedules_all_own on training_schedules
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

alter policy training_sessions_all_own on training_sessions
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));
