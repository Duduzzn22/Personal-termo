-- =============================================================================
-- 0012_whatsapp_automation.sql
-- Preferências e logs do WhatsApp automático. Credenciais ficam em env vars.
-- =============================================================================

create table whatsapp_automation_settings (
  trainer_id uuid primary key references trainer_profiles(id) on delete cascade,
  enabled boolean not null default false,
  reminder_enabled boolean not null default true,
  reminder_template text,
  low_balance_enabled boolean not null default true,
  low_balance_template text,
  overdue_enabled boolean not null default true,
  overdue_template text,
  language_code text not null default 'pt_BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_whatsapp_automation_settings_updated_at
  before update on whatsapp_automation_settings
  for each row execute function set_updated_at();

create table whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainer_profiles(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  automation_type text not null check (automation_type in ('lembrete_aula','saldo_baixo','cobranca_atrasada')),
  template_name text,
  to_phone text,
  status text not null check (status in ('enviado','erro','ignorado')),
  provider_message_id text,
  error_message text,
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);

create index idx_whatsapp_logs_trainer_created
  on whatsapp_message_logs(trainer_id, created_at desc);

alter table whatsapp_automation_settings enable row level security;
alter table whatsapp_message_logs enable row level security;

grant select, insert, update, delete on whatsapp_automation_settings to authenticated, service_role;
grant select, insert, update, delete on whatsapp_message_logs to authenticated, service_role;
revoke all on whatsapp_automation_settings from anon;
revoke all on whatsapp_message_logs from anon;

create policy whatsapp_settings_trainer_all
  on whatsapp_automation_settings for all to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));

create policy whatsapp_logs_trainer_all
  on whatsapp_message_logs for all to authenticated
  using ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id))
  with check ((select auth.uid()) = trainer_id or is_managing_trainer(trainer_id));
