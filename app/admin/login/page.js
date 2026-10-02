'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr('Email atau kata sandi salah.');
      setBusy(false);
      return;
    }
    const { data: ok } = await supabase.rpc('is_admin');
    if (!ok) {
      await supabase.auth.signOut();
      setErr('Akun ini tidak memiliki akses admin.');
      setBusy(false);
      return;
    }
    router.replace('/admin');
  };

  return (
    <div className="login">
      <form onSubmit={submit}>
        <span className="login-mark">D&apos;Flara Boutique</span>
        <h1>Masuk Admin</h1>
        <p>Kelola stok, harga, diskon, dan warna produk.</p>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>Kata sandi
          <div className="pw">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{show ? 'Sembunyi' : 'Lihat'}</button>
          </div>
        </label>
        {err && <span className="err" role="alert">{err}</span>}
        <button className="btn" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
        <a className="back" href="/">← Kembali ke katalog</a>
      </form>
    </div>
  );
}
