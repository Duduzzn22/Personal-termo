-- =============================================================================
-- 0008_avaliacao_fisica.sql
-- Histórico de avaliações físicas e evolução corporal por aluno.
-- =============================================================================

create table physical_assessments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  data_avaliacao date not null,
  peso_kg numeric(6,2),
  altura_cm numeric(6,2),
  percentual_gordura numeric(5,2),
  cintura_cm numeric(6,2),
  quadril_cm numeric(6,2),
  peito_cm numeric(6,2),
  braco_direito_cm numeric(6,2),
  braco_esquerdo_cm numeric(6,2),
  coxa_direita_cm numeric(6,2),
  coxa_esquerda_cm numeric(6,2),
  panturrilha_direita_cm numeric(6,2),
  panturrilha_esquerda_cm numeric(6,2),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (peso_kg is null or (peso_kg > 0 and peso_kg <= 500)),
  check (altura_cm is null or (altura_cm > 0 and altura_cm <= 300)),
  check (percentual_gordura is null or (percentual_gordura >= 0 and percentual_gordura <= 100)),
  check (cintura_cm is null or (cintura_cm > 0 and cintura_cm <= 500)),
  check (quadril_cm is null or (quadril_cm > 0 and quadril_cm <= 500)),
  check (peito_cm is null or (peito_cm > 0 and peito_cm <= 500)),
  check (braco_direito_cm is null or (braco_direito_cm > 0 and braco_direito_cm <= 500)),
  check (braco_esquerdo_cm is null or (braco_esquerdo_cm > 0 and braco_esquerdo_cm <= 500)),
  check (coxa_direita_cm is null or (coxa_direita_cm > 0 and coxa_direita_cm <= 500)),
  check (coxa_esquerda_cm is null or (coxa_esquerda_cm > 0 and coxa_esquerda_cm <= 500)),
  check (panturrilha_direita_cm is null or (panturrilha_direita_cm > 0 and panturrilha_direita_cm <= 500)),
  check (panturrilha_esquerda_cm is null or (panturrilha_esquerda_cm > 0 and panturrilha_esquerda_cm <= 500))
);

comment on table physical_assessments is 'Histórico de avaliações físicas do aluno. Cada linha representa uma fotografia dos indicadores corporais em uma data.';

create index idx_physical_assessments_trainer_id
  on physical_assessments(trainer_id);
create index idx_physical_assessments_student_date
  on physical_assessments(student_id, data_avaliacao desc, created_at desc);

create trigger trg_physical_assessments_updated_at
  before update on physical_assessments
  for each row execute function set_updated_at();

-- Impede vínculo entre uma avaliação e aluno de outro tenant, mesmo que IDs
-- sejam enviados manualmente à Data API.
create or replace function validate_physical_assessment_ownership()
returns trigger as $$
begin
  perform 1
    from students s
   where s.id = new.student_id
     and s.trainer_id = new.trainer_id;

  if not found then
    raise exception 'A avaliação física deve pertencer ao mesmo personal do aluno.';
  end if;

  return new;
end;
$$ language plpgsql;

revoke all on function validate_physical_assessment_ownership() from public, anon, authenticated;

create trigger trg_validate_physical_assessment_ownership
  before insert or update of trainer_id, student_id
  on physical_assessments
  for each row execute function validate_physical_assessment_ownership();

-- Data API: apenas usuários autenticados e service role; nunca acesso anônimo.
grant select, insert, update, delete on table physical_assessments to authenticated, service_role;
revoke all on table physical_assessments from anon;

alter table physical_assessments enable row level security;

create policy physical_assessments_all_own on physical_assessments
  for all
  to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));