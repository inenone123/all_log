create table public.contents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  type          text not null check (type in ('book','manga','movie','anime','other')),
  title         text not null,
  cover_url     text,
  description   text,
  external_id   text,
  external_src  text,
  metadata      jsonb default '{}',
  status        text check (status in ('want','reading','completed','dropped')),
  rating        int  check (rating between 1 and 5),
  memo          text,
  tags          text[] default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  completed_at  timestamptz
);

alter table public.contents enable row level security;

create policy "Users can view own contents"
  on public.contents for select
  using (auth.uid() = user_id);

create policy "Users can insert own contents"
  on public.contents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contents"
  on public.contents for update
  using (auth.uid() = user_id);

create policy "Users can delete own contents"
  on public.contents for delete
  using (auth.uid() = user_id);
