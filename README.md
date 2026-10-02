# D'Flara Boutique — Katalog

Next.js 14 + Supabase (database, auth admin, storage foto, realtime). Deploy ke Vercel.

## 1. Siapkan Supabase
1. Buat project di https://supabase.com
2. SQL Editor → New query → tempel isi `supabase/schema.sql` → Run
3. Authentication → Users → Add user (email + password admin, centang Auto Confirm)
4. Authentication → Sign In / Providers → matikan "Allow new users to sign up"
5. SQL Editor → daftarkan akun tadi sebagai admin:

   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL_ADMIN_KAMU';

6. Project Settings → API → salin Project URL dan anon public key

## 2. Jalankan lokal (PowerShell)
    npm install
    Copy-Item .env.local.example .env.local
    notepad .env.local
    npm run dev

Katalog: http://localhost:3000 — Admin: http://localhost:3000/admin

## 3. Deploy ke Vercel (PowerShell)
    npm i -g vercel
    vercel
    vercel env add NEXT_PUBLIC_SUPABASE_URL
    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
    vercel env add NEXT_PUBLIC_WA_NUMBER
    vercel --prod
