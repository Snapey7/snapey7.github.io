-- Store a provider marker per private media object so Supabase and R2 files can coexist.
alter table public.member_media
  drop constraint if exists member_media_bucket_check;

alter table public.member_media
  add constraint member_media_bucket_check
  check (bucket in ('member-media', 'member-media-r2'));
