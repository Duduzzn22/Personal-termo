-- =============================================================================
-- 0006_package_session_tracking.sql
-- Liga sessões concluídas aos pacotes contratados pelos alunos e mantém
-- aulas_realizadas sincronizado a partir das próprias sessões (fonte de verdade).
-- Também cria automaticamente o student_package quando um termo é aceito.
-- =============================================================================

-- Cada sessão pode consumir exatamente um pacote contratado pelo aluno.
alter table training_sessions
  add column if not exists student_package_id uuid
  references student_packages(id) on delete restrict;

create index if not exists idx_training_sessions_student_package_id
  on training_sessions(student_package_id);

-- -----------------------------------------------------------------------------
-- ACEITE -> PACOTE CONTRATADO
-- Ao registrar um aceite, cria o vínculo concreto aluno+pacote caso ainda não
-- exista para aquele convite e grava o id em term_invitations.student_package_id.
-- -----------------------------------------------------------------------------

create or replace function create_student_package_after_acceptance()
returns trigger as $$
declare
  v_invitation term_invitations%rowtype;
  v_validade_dias integer;
  v_data_inicio date;
  v_student_package_id uuid;
begin
  select *
    into v_invitation
    from term_invitations
   where id = new.invitation_id
   for update;

  if not found then
    raise exception 'Convite do aceite não encontrado.';
  end if;

  -- Idempotência: se o convite já estiver ligado a um pacote contratado,
  -- não cria outro registro.
  if v_invitation.student_package_id is not null then
    return new;
  end if;

  select validade_dias
    into v_validade_dias
    from packages
   where id = new.package_id
     and trainer_id = new.trainer_id;

  if v_validade_dias is null then
    raise exception 'Pacote do aceite não encontrado.';
  end if;

  v_data_inicio := coalesce(v_invitation.data_inicio, new.accepted_at::date);

  insert into student_packages (
    trainer_id,
    student_id,
    package_id,
    data_inicio,
    data_validade_final,
    aulas_realizadas,
    status
  ) values (
    new.trainer_id,
    new.student_id,
    new.package_id,
    v_data_inicio,
    v_data_inicio + v_validade_dias,
    0,
    'ativo'
  )
  returning id into v_student_package_id;

  update term_invitations
     set student_package_id = v_student_package_id
   where id = new.invitation_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Função interna de trigger: nunca deve ser chamada diretamente via Data API/RPC.
revoke all on function create_student_package_after_acceptance() from public, anon, authenticated;

drop trigger if exists trg_create_student_package_after_acceptance on acceptances;
create trigger trg_create_student_package_after_acceptance
  after insert on acceptances
  for each row execute function create_student_package_after_acceptance();

-- Backfill dos aceites já existentes antes desta migration.
do $$
declare
  r record;
  v_student_package_id uuid;
  v_data_inicio date;
begin
  for r in
    select
      a.id as acceptance_id,
      a.trainer_id,
      a.student_id,
      a.package_id,
      a.accepted_at,
      ti.id as invitation_id,
      ti.data_inicio,
      p.validade_dias
    from acceptances a
    join term_invitations ti on ti.id = a.invitation_id
    join packages p on p.id = a.package_id
    where ti.student_package_id is null
  loop
    v_data_inicio := coalesce(r.data_inicio, r.accepted_at::date);

    insert into student_packages (
      trainer_id,
      student_id,
      package_id,
      data_inicio,
      data_validade_final,
      aulas_realizadas,
      status
    ) values (
      r.trainer_id,
      r.student_id,
      r.package_id,
      v_data_inicio,
      v_data_inicio + r.validade_dias,
      0,
      'ativo'
    )
    returning id into v_student_package_id;

    update term_invitations
       set student_package_id = v_student_package_id
     where id = r.invitation_id;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- SESSÃO CONCLUÍDA -> ESCOLHA AUTOMÁTICA DO PACOTE
-- Usa FIFO entre os pacotes ativos e válidos do aluno. O FOR UPDATE evita que
-- duas conclusões simultâneas consumam a última aula do mesmo pacote.
-- Também revalida saldo ao concluir novamente uma sessão que havia sido reaberta.
-- -----------------------------------------------------------------------------

create or replace function assign_student_package_to_completed_session()
returns trigger as $$
declare
  v_student_package_id uuid;
  v_quantidade_aulas integer;
  v_package_status student_package_status;
  v_data_inicio date;
  v_data_validade_final date;
  v_other_completed integer;
  v_is_new_consumption boolean;
begin
  if new.status <> 'concluido' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_is_new_consumption := true;
  else
    v_is_new_consumption :=
      old.status is distinct from 'concluido'
      or old.student_package_id is distinct from new.student_package_id;
  end if;

  -- Sessão já vinculada a um pacote: valida propriedade e, quando estiver
  -- consumindo a aula novamente, revalida status, validade e saldo disponível.
  if new.student_package_id is not null then
    select p.quantidade_aulas, sp.status, sp.data_inicio, sp.data_validade_final
      into v_quantidade_aulas, v_package_status, v_data_inicio, v_data_validade_final
      from student_packages sp
      join packages p on p.id = sp.package_id
     where sp.id = new.student_package_id
       and sp.trainer_id = new.trainer_id
       and sp.student_id = new.student_id
     for update of sp;

    if not found then
      raise exception 'O pacote selecionado não pertence a este aluno.';
    end if;

    if v_is_new_consumption then
      if v_package_status <> 'ativo' then
        raise exception 'O pacote desta aula não está ativo para novo consumo.';
      end if;

      if v_data_inicio is not null and v_data_inicio > new.data then
        raise exception 'O pacote ainda não estava válido na data desta aula.';
      end if;

      if v_data_validade_final is not null and v_data_validade_final < new.data then
        raise exception 'O pacote estava expirado na data desta aula.';
      end if;

      select count(*)::integer
        into v_other_completed
        from training_sessions ts
       where ts.student_package_id = new.student_package_id
         and ts.status = 'concluido'
         and (new.id is null or ts.id <> new.id);

      if v_other_completed >= v_quantidade_aulas then
        raise exception 'Este pacote não possui mais aulas disponíveis.';
      end if;
    end if;

    return new;
  end if;

  select sp.id
    into v_student_package_id
    from student_packages sp
    join packages p on p.id = sp.package_id
   where sp.trainer_id = new.trainer_id
     and sp.student_id = new.student_id
     and sp.status = 'ativo'
     and (sp.data_inicio is null or sp.data_inicio <= new.data)
     and (sp.data_validade_final is null or sp.data_validade_final >= new.data)
     and (
       select count(*)
         from training_sessions ts
        where ts.student_package_id = sp.id
          and ts.status = 'concluido'
     ) < p.quantidade_aulas
   order by coalesce(sp.data_inicio, sp.created_at::date), sp.created_at
   for update of sp
   limit 1;

  if v_student_package_id is null then
    raise exception 'Aluno não possui pacote ativo com aulas disponíveis para esta data.';
  end if;

  new.student_package_id := v_student_package_id;
  return new;
end;
$$ language plpgsql;

revoke all on function assign_student_package_to_completed_session() from public, anon, authenticated;

drop trigger if exists trg_assign_package_before_session_write on training_sessions;
drop trigger if exists trg_assign_package_before_session_insert on training_sessions;
drop trigger if exists trg_assign_package_before_session_update on training_sessions;

create trigger trg_assign_package_before_session_insert
  before insert on training_sessions
  for each row execute function assign_student_package_to_completed_session();

create trigger trg_assign_package_before_session_update
  before update of status, student_package_id, student_id, data on training_sessions
  for each row execute function assign_student_package_to_completed_session();

-- -----------------------------------------------------------------------------
-- CONTADOR DERIVADO DAS SESSÕES
-- aulas_realizadas deixa de depender de incremento/decremento manual: é sempre
-- recalculado pela quantidade de sessões concluídas ligadas ao pacote.
-- -----------------------------------------------------------------------------

create or replace function sync_student_package_usage(p_student_package_id uuid)
returns void as $$
declare
  v_aulas_realizadas integer;
  v_quantidade_aulas integer;
  v_status student_package_status;
begin
  if p_student_package_id is null then
    return;
  end if;

  select p.quantidade_aulas, sp.status
    into v_quantidade_aulas, v_status
    from student_packages sp
    join packages p on p.id = sp.package_id
   where sp.id = p_student_package_id
   for update of sp;

  if not found then
    return;
  end if;

  select count(*)::integer
    into v_aulas_realizadas
    from training_sessions
   where student_package_id = p_student_package_id
     and status = 'concluido';

  update student_packages
     set aulas_realizadas = v_aulas_realizadas,
         status = case
           when v_status in ('cancelado', 'expirado') then v_status
           when v_aulas_realizadas >= v_quantidade_aulas then 'concluido'::student_package_status
           else 'ativo'::student_package_status
         end
   where id = p_student_package_id;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function sync_student_package_usage(uuid) from public, anon, authenticated;

create or replace function sync_student_package_usage_from_session()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    perform sync_student_package_usage(old.student_package_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.student_package_id is distinct from new.student_package_id then
    perform sync_student_package_usage(old.student_package_id);
  end if;

  perform sync_student_package_usage(new.student_package_id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function sync_student_package_usage_from_session() from public, anon, authenticated;

drop trigger if exists trg_sync_package_after_session_write on training_sessions;
drop trigger if exists trg_sync_package_after_session_insert_delete on training_sessions;
drop trigger if exists trg_sync_package_after_session_update on training_sessions;

create trigger trg_sync_package_after_session_insert_delete
  after insert or delete on training_sessions
  for each row execute function sync_student_package_usage_from_session();

create trigger trg_sync_package_after_session_update
  after update of status, student_package_id on training_sessions
  for each row execute function sync_student_package_usage_from_session();