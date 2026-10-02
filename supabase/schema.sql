-- Jalankan seluruh isi file ini di Supabase > SQL Editor > New query

create extension if not exists "pgcrypto";

-- ========== ADMIN ==========
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security; -- tanpa policy: tidak bisa diakses langsung dari browser

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;

grant execute on function public.is_admin() to anon, authenticated;

-- ========== TABEL ==========
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text default '',
  price numeric(12,0) not null default 0 check (price >= 0),
  discount_percent int not null default 0 check (discount_percent between 0 and 100),
  stock int not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- ========== RLS ==========
alter table public.categories enable row level security;
alter table public.products   enable row level security;

drop policy if exists "publik lihat kategori" on public.categories;
drop policy if exists "admin kelola kategori" on public.categories;
drop policy if exists "publik lihat produk aktif" on public.products;
drop policy if exists "admin kelola produk" on public.products;

create policy "publik lihat kategori" on public.categories for select using (true);
create policy "admin kelola kategori" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "publik lihat produk aktif" on public.products for select using (is_active = true);
create policy "admin kelola produk" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- ========== REALTIME ==========
--alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.products;

-- ========== STORAGE (foto produk) ==========
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "publik lihat foto" on storage.objects;
drop policy if exists "admin upload foto" on storage.objects;
drop policy if exists "admin ubah foto" on storage.objects;
drop policy if exists "admin hapus foto" on storage.objects;

create policy "publik lihat foto" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin upload foto" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin ubah foto" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admin hapus foto" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ========== CONTOH KATEGORI (boleh dihapus) ==========
insert into public.categories (name, description, sort_order) values
  ('Dress', 'Dress untuk pesta, kondangan, dan harian dengan potongan yang jatuh dan nyaman.', 1),
  ('Blouse', 'Blouse dengan bahan adem dan jahitan rapi, mudah dipadukan.', 2),
  ('Hijab', 'Hijab dengan bahan lembut dan warna yang mudah dipadankan.', 3)
on conflict (name) do nothing;
