'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { rupiah, finalPrice, stockInfo } from '@/lib/format';
import { STORE, MAPS_LINK, MAPS_EMBED } from '@/lib/store';
import Swatches from '@/components/Swatches';

const WA = process.env.NEXT_PUBLIC_WA_NUMBER;

const Icon = ({ d, children }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);
const IgIcon = () => (<Icon><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" /></Icon>);
const TtIcon = () => (<Icon d="M16 3c.3 2.4 1.8 4 4 4.2v3.2c-1.5 0-2.9-.5-4-1.3v6.2a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3.3a2.6 2.6 0 1 0 1.7 2.4V3H16z" />);
const PinIcon = () => (<Icon><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Icon>);

function Price({ p }) {
  const hasDisc = p.discount_percent > 0;
  return (
    <div className="price">
      <b className={hasDisc ? 'sale' : ''}>{rupiah(finalPrice(p))}</b>
      {hasDisc && <s>{rupiah(p.price)}</s>}
    </div>
  );
}

function Photo({ p }) {
  return (
    <div className="ph">
      {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" /> : <div className="noimg">D&apos;Flara</div>}
      {p.discount_percent > 0 && <span className="tag">-{p.discount_percent}%</span>}
      {p.stock <= 0 && <span className="sold">Stok habis</span>}
    </div>
  );
}

export default function Catalog() {
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [active, setActive] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('baru');
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [selId, setSelId] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [c, p] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order').order('name'),
        supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      ]);
      if (!alive) return;
      setCats(c.data || []);
      setProds(p.data || []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel('katalog-publik')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, load)
      .subscribe((s) => setLive(s === 'SUBSCRIBED'));
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selId]);

  const activeCat = cats.find((c) => c.id === active);
  const sel = prods.find((p) => p.id === selId);
  const catName = (id) => cats.find((c) => c.id === id)?.name;

  const list = useMemo(() => {
    let r = prods.filter(
      (p) => (active === 'all' || p.category_id === active) && p.name.toLowerCase().includes(q.trim().toLowerCase())
    );
    if (sort === 'termurah') r = [...r].sort((a, b) => finalPrice(a) - finalPrice(b));
    if (sort === 'termahal') r = [...r].sort((a, b) => finalPrice(b) - finalPrice(a));
    if (sort === 'diskon') r = [...r].sort((a, b) => b.discount_percent - a.discount_percent);
    return r;
  }, [prods, active, q, sort]);

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <a className="mark" href="#atas">D&apos;Flara</a>
          <nav className="topnav" aria-label="Navigasi">
            <a href="#koleksi">Koleksi</a>
            <a href="#kunjungi">Kunjungi Toko</a>
          </nav>
          <span className={`live ${live ? 'on' : ''}`}>
            <i /> <em>{live ? 'Stok & harga diperbarui langsung' : 'Menyambungkan…'}</em>
          </span>
        </div>
      </header>

      <section className="hero" id="atas">
        <div className="wrap hero-in">
          <h1>D&apos;Flara Boutique</h1>
          <p>Koleksi pilihan dengan harga dan ketersediaan yang selalu terbaru.</p>
          <div className="hero-meta">
            <a href={MAPS_LINK} target="_blank" rel="noreferrer"><PinIcon /> Ungaran Timur, Kab. Semarang</a>
            <a href={STORE.instagram} target="_blank" rel="noreferrer"><IgIcon /> {STORE.instagramHandle}</a>
            <a href={STORE.tiktok} target="_blank" rel="noreferrer"><TtIcon /> {STORE.tiktokHandle}</a>
          </div>
        </div>
      </section>

      <main className="wrap" id="koleksi">
        <div className="tools">
          <div className="chips">
            <button className={`chip ${active === 'all' ? 'on' : ''}`} onClick={() => setActive('all')}>Semua</button>
            {cats.map((c) => (
              <button key={c.id} className={`chip ${active === c.id ? 'on' : ''}`} onClick={() => setActive(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="find">
            <input type="search" placeholder="Cari produk" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari produk" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Urutkan">
              <option value="baru">Terbaru</option>
              <option value="termurah">Harga terendah</option>
              <option value="termahal">Harga tertinggi</option>
              <option value="diskon">Diskon terbesar</option>
            </select>
          </div>
        </div>

        {activeCat?.description && (
          <p className="catdesc"><b>{activeCat.name}</b>{activeCat.description}</p>
        )}

        {loading ? (
          <div className="empty">Memuat koleksi…</div>
        ) : list.length === 0 ? (
          <div className="empty">Belum ada produk yang cocok. Coba kategori atau kata kunci lain.</div>
        ) : (
          <div className="grid">
            {list.map((p) => {
              const s = stockInfo(p.stock);
              return (
                <article key={p.id} className="card" tabIndex={0} onClick={() => setSelId(p.id)} onKeyDown={(e) => e.key === 'Enter' && setSelId(p.id)}>
                  <Photo p={p} />
                  <h3>{p.name}</h3>
                  <Price p={p} />
                  <Swatches colors={p.colors} />
                  <small className={`stk ${s.tone}`}>{s.label}</small>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <section className="visit" id="kunjungi">
        <div className="wrap visit-in">
          <div className="visit-txt">
            <h2>Kunjungi D&apos;Flara Boutique</h2>
            <p>Lihat dan coba langsung koleksi kami di toko.</p>
            <address>
              <PinIcon />
              <span>{STORE.address}</span>
            </address>
            <div className="visit-btns">
              <a className="btn" href={MAPS_LINK} target="_blank" rel="noreferrer">Buka di Google Maps</a>
              <a className="btn ghost light" href={STORE.instagram} target="_blank" rel="noreferrer"><IgIcon /> Instagram</a>
              <a className="btn ghost light" href={STORE.tiktok} target="_blank" rel="noreferrer"><TtIcon /> TikTok</a>
            </div>
          </div>
          <div className="visit-map">
            <iframe title="Lokasi D'Flara Boutique" src={MAPS_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </section>

      <footer className="foot">© {new Date().getFullYear()} D&apos;Flara Boutique · {STORE.address}</footer>

      {sel && (
        <div className="ov" onClick={() => setSelId(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={sel.name} onClick={(e) => e.stopPropagation()}>
            <Photo p={sel} />
            <div className="info">
              <button className="x" onClick={() => setSelId(null)} aria-label="Tutup">×</button>
              {catName(sel.category_id) && <span className="cat">{catName(sel.category_id)}</span>}
              <h2>{sel.name}</h2>
              <Price p={sel} />
              <small className={`stk ${stockInfo(sel.stock).tone}`}>{stockInfo(sel.stock).label}</small>
              <Swatches colors={sel.colors} named />
              {sel.description && <p className="desc">{sel.description}</p>}
              {WA && sel.stock > 0 && (
                <a
                  className="wa"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${WA}?text=${encodeURIComponent(`Halo D'Flara Boutique, saya tertarik dengan ${sel.name}`)}`}
                >
                  Tanya via WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
