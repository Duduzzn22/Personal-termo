-- =============================================================================
-- 0017_exercise_videos.sql
-- Vídeos próprios de exercícios em bucket privado do Supabase Storage.
-- =============================================================================

alter table public.exercises
  add column if not exists video_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-videos',
  'exercise-videos',
  false,
  52428800,
  array['video/mp4', 'video/webm']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Personal autenticado ou administrador vinculado pode ler os vídeos do personal.
drop policy if exists exercise_videos_trainer_select on storage.objects;
create policy exercise_videos_trainer_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'exercise-videos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.admins a
      where a.user_id = (select auth.uid())
        and a.managed_trainer_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Aluno pode ler apenas vídeos de exercícios presentes em um treino ativo dele.
drop policy if exists exercise_videos_student_select on storage.objects;
create policy exercise_videos_student_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'exercise-videos'
  and exists (
    select 1
    from public.student_portal_accounts spa
    join public.workout_plans wp
      on wp.student_id = spa.student_id
     and wp.status = 'ativo'
    join public.workout_plan_items wpi
      on wpi.workout_plan_id = wp.id
    where spa.auth_user_id = (select auth.uid())
      and spa.enabled = true
      and wp.trainer_id::text = (storage.foldername(name))[1]
      and wpi.exercise_id::text = (storage.foldername(name))[2]
  )
);

-- Uploads são feitos diretamente pelo navegador para a pasta do personal.
drop policy if exists exercise_videos_trainer_insert on storage.objects;
create policy exercise_videos_trainer_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'exercise-videos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.admins a
      where a.user_id = (select auth.uid())
        and a.managed_trainer_id::text = (storage.foldername(name))[1]
    )
  )
);

drop policy if exists exercise_videos_trainer_update on storage.objects;
create policy exercise_videos_trainer_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'exercise-videos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.admins a
      where a.user_id = (select auth.uid())
        and a.managed_trainer_id::text = (storage.foldername(name))[1]
    )
  )
)
with check (
  bucket_id = 'exercise-videos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.admins a
      where a.user_id = (select auth.uid())
        and a.managed_trainer_id::text = (storage.foldername(name))[1]
    )
  )
);

drop policy if exists exercise_videos_trainer_delete on storage.objects;
create policy exercise_videos_trainer_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'exercise-videos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.admins a
      where a.user_id = (select auth.uid())
        and a.managed_trainer_id::text = (storage.foldername(name))[1]
    )
  )
);