-- =============================================================================
-- 0014_security_hardening.sql
-- Hardening de funções, privilégios e integridade dos logs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECURITY DEFINER usado pelas policies administrativas.
-- A função não deve herdar um search_path mutável nem ficar executável por
-- PUBLIC/anon. As policies precisam dela apenas no papel authenticated.
-- -----------------------------------------------------------------------------
create or replace function public.is_managing_trainer(target_trainer_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
      from public.admins
     where user_id = (select auth.uid())
       and managed_trainer_id = target_trainer_id
  );
$$;

revoke all on function public.is_managing_trainer(uuid) from public, anon;
grant execute on function public.is_managing_trainer(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Trigger helpers não precisam ficar expostos como RPC e devem usar um
-- search_path fixo. Os validators já tinham EXECUTE revogado; mantemos isso e
-- endurecemos também o helper genérico de updated_at.
-- -----------------------------------------------------------------------------
alter function public.set_updated_at() set search_path = public;
revoke all on function public.set_updated_at() from public, anon, authenticated;

alter function public.assign_student_package_to_completed_session() set search_path = public;
alter function public.validate_payment_ownership() set search_path = public;
alter function public.validate_physical_assessment_ownership() set search_path = public;
alter function public.validate_workout_plan_ownership() set search_path = public;
alter function public.validate_workout_plan_item_ownership() set search_path = public;
alter function public.validate_student_portal_account_ownership() set search_path = public;
alter function public.validate_session_change_request() set search_path = public;

revoke all on function public.assign_student_package_to_completed_session() from public, anon, authenticated;
revoke all on function public.validate_payment_ownership() from public, anon, authenticated;
revoke all on function public.validate_physical_assessment_ownership() from public, anon, authenticated;
revoke all on function public.validate_workout_plan_ownership() from public, anon, authenticated;
revoke all on function public.validate_workout_plan_item_ownership() from public, anon, authenticated;
revoke all on function public.validate_student_portal_account_ownership() from public, anon, authenticated;
revoke all on function public.validate_session_change_request() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Logs do WhatsApp são evidência operacional. O personal só precisa lê-los;
-- inserção é feita pelo cron com service_role. Impede edição/exclusão manual
-- pela sessão autenticada do personal.
-- -----------------------------------------------------------------------------
revoke insert, update, delete on table public.whatsapp_message_logs from authenticated;
grant select on table public.whatsapp_message_logs to authenticated;
