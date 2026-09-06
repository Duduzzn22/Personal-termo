-- =============================================================================
-- 0002_rls_policies.sql
-- Row Level Security — isolamento multi-tenant por trainer_id.
--
-- Um personal trainer autenticado (auth.uid()) só pode ler/escrever seus
-- próprios registros. A página pública de aceite (/aceite/[token]) NÃO usa
-- estas policies: ela acessa o banco por meio de rotas de servidor que usam a
-- service role key e validam o token manualmente (o token é o "segredo" que
-- autoriza o acesso, de forma equivalente a um link mágico).
-- =============================================================================

alter table trainer_profiles enable row level security;
alter table students enable row level security;
alter table packages enable row level security;
alter table student_packages enable row level security;
alter table term_templates enable row level security;
alter table term_clauses enable row level security;
alter table term_versions enable row level security;
alter table term_version_clauses enable row level security;
alter table term_invitations enable row level security;
alter table acceptances enable row level security;
alter table audit_logs enable row level security;
alter table notifications enable row level security;

-- trainer_profiles: cada trainer só vê/edita o próprio perfil
create policy trainer_profiles_select_own on trainer_profiles
  for select using (id = auth.uid());
create policy trainer_profiles_update_own on trainer_profiles
  for update using (id = auth.uid());
create policy trainer_profiles_insert_own on trainer_profiles
  for insert with check (id = auth.uid());

-- students
create policy students_all_own on students
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- packages
create policy packages_all_own on packages
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- student_packages
create policy student_packages_all_own on student_packages
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- term_templates
create policy term_templates_all_own on term_templates
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- term_clauses
create policy term_clauses_all_own on term_clauses
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- term_versions (imutável na prática via regras de aplicação; RLS apenas isola por tenant)
create policy term_versions_all_own on term_versions
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- term_version_clauses: acesso via join com term_versions
create policy term_version_clauses_select_own on term_version_clauses
  for select using (
    exists (
      select 1 from term_versions tv
      where tv.id = term_version_clauses.term_version_id
        and tv.trainer_id = auth.uid()
    )
  );
create policy term_version_clauses_insert_own on term_version_clauses
  for insert with check (
    exists (
      select 1 from term_versions tv
      where tv.id = term_version_clauses.term_version_id
        and tv.trainer_id = auth.uid()
    )
  );

-- term_invitations
create policy term_invitations_all_own on term_invitations
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- acceptances: trainer só pode SELECIONAR (nunca alterar/apagar um aceite)
create policy acceptances_select_own on acceptances
  for select using (trainer_id = auth.uid());

-- audit_logs: o trainer só lê e cria seus próprios registros. Não há policy
-- de update nem delete: o log é append-only (imutável) por design — a
-- aplicação grava uma entrada a cada ação relevante (criação de pacote,
-- aluno, termo, etc.) usando o client autenticado do próprio trainer.
create policy audit_logs_select_own on audit_logs
  for select using (trainer_id = auth.uid());
create policy audit_logs_insert_own on audit_logs
  for insert with check (trainer_id = auth.uid());

-- notifications
create policy notifications_all_own on notifications
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
