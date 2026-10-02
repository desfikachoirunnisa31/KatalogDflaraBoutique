-- Jalankan sekali di Supabase > SQL Editor
alter table public.products
  add column if not exists colors jsonb not null default '[]'::jsonb;
