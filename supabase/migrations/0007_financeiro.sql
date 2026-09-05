-- =============================================================================
-- 0007_financeiro.sql
-- Financeiro do personal: uma cobrança por pacote contratado, com valor
-- congelado, vencimento, pagamento e método utilizado.
-- =============================================================================

create type payment_status as enum ('pendente', 'pago', 'cancelado');
create type payment_method as enum ('pix', 'dinheiro', 'cartao', 'transferencia', 'outro');

create table payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete restrict,
  student_package_id uuid not null references student_packages(id) on delete restrict,
  valor_centavos bigint not null check (valor_centavos >= 0),
  data_vencimento date not null,
  data_pagamento date,
  status payment_status not null default 'pendente',
  metodo payment_method,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_package_id),
  check (
    (status = 'pago' and data_pagamento is not null and metodo is not null)
    or (status <> 'pago')
  )
);

comment on table payments is 'Cobranças financeiras vinculadas a pacotes contratados. O valor é congelado no momento da contratação.';

create index idx_payments_trainer_id on payments(trainer_id);
create index idx_payments_student_id on payments(student_id);
create index idx_payments_status on payments(trainer_id, status);
create index idx_payments_due_date on payments(trainer_id, data_vencimento);
create index idx_payments_payment_date on payments(trainer_id, data_pagamento);

create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS: mesmo isolamento multi-tenant do restante do SaaS e compatível com o
-- perfil administrativo criado em 0005_admin_access.sql.
-- -----------------------------------------------------------------------------

alter table payments enable row level security;

create policy payments_all_own on payments
  for all
  using (trainer_id = auth.uid() or is_managing_trainer(trainer_id))
  with check (trainer_id = auth.uid() or is_managing_trainer(trainer_id));

-- -----------------------------------------------------------------------------
-- PACOTE CONTRATADO -> COBRANÇA
-- Todo student_package novo gera uma cobrança pendente com o preço do pacote
-- naquele momento. O unique(student_package_id) torna a operação idempotente.
-- -----------------------------------------------------------------------------

create or replace function create_payment_after_student_package()
returns trigger as $$
declare
  v_valor_centavos bigint;
  v_data_vencimento date;
begin
  select valor_centavos
    into v_valor_centavos
    from packages
   where id = new.package_id
     and trainer_id = new.trainer_id;

  if v_valor_centavos is null then
    raise exception 'Pacote da contratação não encontrado para gerar cobrança.';
  end if;

  v_data_vencimento := coalesce(new.data_inicio, current_date);

  insert into payments (
    trainer_id,
    student_id,
    student_package_id,
    valor_centavos,
    data_vencimento,
    status
  ) values (
    new.trainer_id,
    new.student_id,
    new.id,
    v_valor_centavos,
    v_data_vencimento,
    'pendente'
  )
  on conflict (student_package_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_create_payment_after_student_package on student_packages;
create trigger trg_create_payment_after_student_package
  after insert on student_packages
  for each row execute function create_payment_after_student_package();

-- -----------------------------------------------------------------------------
-- BACKFILL
-- Pacotes contratados antes deste módulo também recebem uma cobrança pendente
-- para que o personal revise e marque como pago/cancelado conforme a realidade.
-- -----------------------------------------------------------------------------

insert into payments (
  trainer_id,
  student_id,
  student_package_id,
  valor_centavos,
  data_vencimento,
  status,
  observacoes
)
select
  sp.trainer_id,
  sp.student_id,
  sp.id,
  p.valor_centavos,
  coalesce(sp.data_inicio, sp.created_at::date),
  'pendente'::payment_status,
  'Cobrança criada automaticamente na ativação do módulo financeiro. Revise o status deste pagamento.'
from student_packages sp
join packages p on p.id = sp.package_id
left join payments pay on pay.student_package_id = sp.id
where pay.id is null;
