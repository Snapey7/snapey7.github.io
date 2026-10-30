-- Add an owner-controlled order to private catalogue photos and enforce upload
-- restrictions at the storage bucket as well as in the application.

alter table public.member_media
  add column if not exists position integer not null default 0;

with ranked_photos as (
  select id, row_number() over (
    partition by catalogue_id
    order by created_at, id
  ) - 1 as new_position
  from public.member_media
  where catalogue_id is not null
)
update public.member_media as media
set position = ranked_photos.new_position
from ranked_photos
where media.id = ranked_photos.id;

create unique index if not exists member_media_catalogue_position_uidx
  on public.member_media (catalogue_id, position)
  where catalogue_id is not null;

create or replace function public.move_catalogue_photo(
  p_catalogue_id uuid,
  p_photo_id uuid,
  p_direction text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_position integer;
  v_neighbor_id uuid;
  v_neighbor_position integer;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'Invalid photo direction';
  end if;

  perform catalogue.id
  from public.catalogues as catalogue
  where catalogue.id = p_catalogue_id
  for update;

  if not found then
    raise exception 'Catalogue not found';
  end if;

  -- Lock this catalogue's rows so simultaneous reorder requests cannot interleave.
  perform media.id
  from public.member_media as media
  where media.catalogue_id = p_catalogue_id
  for update;

  select media.position into v_position
  from public.member_media as media
  where media.id = p_photo_id and media.catalogue_id = p_catalogue_id;

  if not found then
    raise exception 'Photo not found in catalogue';
  end if;

  if p_direction = 'up' then
    select media.id, media.position into v_neighbor_id, v_neighbor_position
    from public.member_media as media
    where media.catalogue_id = p_catalogue_id and media.position < v_position
    order by media.position desc, media.created_at desc, media.id desc
    limit 1;
  else
    select media.id, media.position into v_neighbor_id, v_neighbor_position
    from public.member_media as media
    where media.catalogue_id = p_catalogue_id and media.position > v_position
    order by media.position asc, media.created_at asc, media.id asc
    limit 1;
  end if;

  if v_neighbor_id is null then
    return false;
  end if;

  -- The temporary value frees the unique position before swapping the rows.
  update public.member_media set position = -1 where id = p_photo_id and catalogue_id = p_catalogue_id;
  update public.member_media set position = v_position where id = v_neighbor_id and catalogue_id = p_catalogue_id;
  update public.member_media set position = v_neighbor_position where id = p_photo_id and catalogue_id = p_catalogue_id;
  return true;
end;
$$;

revoke all on function public.move_catalogue_photo(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.move_catalogue_photo(uuid, uuid, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-media',
  'member-media',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
