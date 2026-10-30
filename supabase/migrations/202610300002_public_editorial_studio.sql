-- Public editorial stories are kept separate from paid Muse catalogue media.
create table if not exists public.editorial_stories (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  location text not null default '',
  model text not null default '',
  deck text not null default '',
  body text[] not null default '{}',
  photographer text not null default '',
  release_date text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editorial_images (
  id uuid primary key default gen_random_uuid(),
  editorial_slug text not null references public.editorial_stories(slug) on delete cascade,
  storage_path text unique,
  public_url text,
  alt_text text not null default '',
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (num_nonnulls(storage_path, public_url) = 1)
);

create index if not exists editorial_images_story_order_idx
  on public.editorial_images (editorial_slug, position, created_at);

alter table public.editorial_stories enable row level security;
alter table public.editorial_images enable row level security;

drop policy if exists "Published editorial stories are public" on public.editorial_stories;
create policy "Published editorial stories are public"
  on public.editorial_stories for select to anon, authenticated using (status = 'published');
drop policy if exists "Published editorial images are public" on public.editorial_images;
create policy "Published editorial images are public"
  on public.editorial_images for select to anon, authenticated using (published and
    exists (
      select 1 from public.editorial_stories s
      where s.slug = editorial_images.editorial_slug and s.status = 'published'
    )
  );
revoke insert, update, delete on public.editorial_stories, public.editorial_images from anon, authenticated;
grant select on public.editorial_stories, public.editorial_images to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('editorial-media', 'editorial-media', false, 20971520,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = false, file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

-- Seed Lucy's public story. The supplied photographs are deliberately public
-- editorial assets; future uploads use the private bucket above and the
-- published-story image route.
insert into public.editorial_stories
  (slug, title, location, model, deck, body, photographer, release_date, status)
values (
  'manzanillo-part-i-nothing-beyond-the-horizon',
  'LUCY — MANZANILLO PART I: NOTHING BEYOND THE HORIZON',
  'Manzanillo',
  'Lucy',
  'A portrait of Lucy where the jungle meets the Caribbean, and the day opens out.',
  array[
    $$At the edge of Manzanillo, the landscape seems to exhale. Green gives way to shoreline. The sea carries the eye out until there is almost nothing left to follow.$$,
    $$Lucy brings a human scale to that vastness. A glance, a gesture, the small distance between a person and the water. The photographs move between her presence and the place around her, allowing each to draw us towards the other.$$,
    $$Some of the best frames arrived without a fixed plan. We drove along the Costa Rican coast, stopping when the light or the landscape asked us to stay a little longer.$$,
    $$At Playa Hermosa, ocean mist drifted through the sunrays above the jungle and softened the view into something almost magical. Nearby, the waves met the rocks with such force and timing that the shoreline itself became part of the action.$$,
    $$The surfboard shop offered a different kind of composition: boards leaning together in a row, their colour and worn surfaces making a simple, beautiful frame. It was the kind of small discovery that feels especially at home on film, where texture and grain become part of the memory.$$,
    $$There is room here for a picture that does nothing except hold the afternoon: a stretch of coast, leaves meeting the light, the horizon again.$$,
    $$Stay a little longer. There is no next place to be.$$
  ],
  'Impura Vida', '', 'published'
)
on conflict (slug) do nothing;

insert into public.editorial_images (editorial_slug, public_url, alt_text, position, published)
values
  ('manzanillo-part-i-nothing-beyond-the-horizon', '/assets/lucy-manzanillo-01.jpg', 'Lucy reclining on the dark shore with jungle and sea mist behind her.', 0, true),
  ('manzanillo-part-i-nothing-beyond-the-horizon', '/assets/lucy-manzanillo-02.jpg', 'Lucy among the rocks as a wave breaks across the Playa Hermosa shoreline.', 1, true),
  ('manzanillo-part-i-nothing-beyond-the-horizon', '/assets/lucy-manzanillo-03.jpg', 'Lucy beside a row of surfboards at a Costa Rican surf shop.', 2, true),
  ('manzanillo-part-i-nothing-beyond-the-horizon', '/assets/lucy-manzanillo-04.jpg', 'Lucy in a sunlit portrait surrounded by the Costa Rican jungle.', 3, true)
on conflict do nothing;
