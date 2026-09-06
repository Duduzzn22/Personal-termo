-- =============================================================================
-- 0016_google_auth_profile_metadata.sql
-- Improve new-user profile creation for OAuth providers such as Google.
-- =============================================================================

create or replace function public.handle_new_trainer_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  professional_name text;
  profile_photo text;
begin
  professional_name := coalesce(
    nullif(new.raw_user_meta_data->>'nome_profissional', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Personal'
  );

  profile_photo := coalesce(
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'picture', '')
  );

  insert into public.trainer_profiles (
    id,
    nome_profissional,
    email_contato,
    foto_url
  )
  values (
    new.id,
    professional_name,
    new.email,
    profile_photo
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- This helper is invoked only by the auth.users trigger, not as a public RPC.
revoke all on function public.handle_new_trainer_user() from public, anon, authenticated;
