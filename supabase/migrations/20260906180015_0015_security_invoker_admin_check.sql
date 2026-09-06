-- =============================================================================
-- 0015_security_invoker_admin_check.sql
-- Remove SECURITY DEFINER from the admin helper used by RLS policies.
-- The function now runs with the authenticated caller's privileges and relies
-- on the admins table RLS policy (user_id = auth.uid()) to expose only the
-- caller's own admin relationship.
-- =============================================================================

create or replace function public.is_managing_trainer(target_trainer_id uuid)
returns boolean
language sql
security invoker
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

-- Explicit table privilege required for SECURITY INVOKER. Row Level Security on
-- public.admins still limits an authenticated user to their own row.
grant select on table public.admins to authenticated;
