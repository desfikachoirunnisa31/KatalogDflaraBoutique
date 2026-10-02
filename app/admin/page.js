'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { rupiah, finalPrice } from '@/lib/format';
import Swatches from '@/components/Swatches';

const PRESETS = [
  ['Hitam', '#1f1a1c'], ['Putih', '#ffffff'], ['Krem', '#efe3d0'], ['Cokelat', '#7b5a43'],
  ['Maroon', '#6a2b3e'], ['Merah', '#c0392b'], ['Pink', '#e8a6b6'], ['Navy', '#1f2a4d'],
  ['Hijau', '#3f6b4f'], ['Abu-abu', '#9a9396'],
];

/* ---------- Pilihan warna produk ---------- */
function ColorEditor({ value, onChange, notify }) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#6a2b3e');

  const add = (n = name, h = hex) => {
    const nm = n.trim();
    if (!nm) return notify('Gagal: isi nama warna dulu');
    if (value.some((c) => c.name.toLowerCase() === nm.toLowerCase())) return notify('Gagal: warna ini sudah ada');
    onChange([...value, { name: nm, hex: h }]);
    setName('');
  };

  return (
    <div className="colors">
      <span className="lbl">Warna tersedia</span>
      <div className="presets">
        {PRESETS.map(([n, h]) => (
          <button type="button" key={n} className="pre" onClick={() => add(n, h)} title={`Tambah ${n}`}>
            <i style={{ background: h }} />{n}
          </button>
        ))}
      </div>
      <div className="cadd">
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="Pilih warna" />
        <input type="text" placeholder="Nama warna, mis. Dusty Rose" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <button type="button" className="btn sm" onClick={() => add()}>Tambah</button>
      </div>
      {value.length > 0 && (
        <ul className="clist">
          {value.map((c) => (
            <li key={c.name}>
              <i style={{ background: c.hex }} />{c.name}
              <button type="button" aria-label={`Hapus ${c.name}`} onClick={() => onChange(value.filter((x) => x.name !== c.name))}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Baris produk: edit cepat harga, diskon, stok ---------- */
function QuickRow({ p, catName, onEdit, onDelete, notify }) {
  const [price, setPrice] = useState(p.price);
  const [disc, setDisc] = useState(p.discount_percent);
  const [stock, setStock] = useState(p.stock);

  useEffect(() => {
    setPrice(p.price);
    setDisc(p.discount_percent);
    setStock(p.stock);
  }, [p.price, p.discount_percent, p.stock]);

  const save = async (patch) => {
    const { error } = await supabase.from('products').update(patch).eq('id', p.id);
    notify(error ? 'Gagal menyimpan: ' + error.message : 'Perubahan tersimpan');
  };

  return (
    <tr className={p.is_active ? '' : 'off'}>
      <td>
        <div className="pr">
          {p.image_url ? <img src={p.image_url} alt="" /> : <div className="th" />}
          <div>
            <strong>{p.name}</strong>
            <small>{catName || 'Tanpa kategori'}</small>
            <Swatches colors={p.colors} />
          </div>
        </div>
      </td>
      <td data-label="Harga (Rp)">
        <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
          onBlur={() => Number(price) !== Number(p.price) && save({ price: Math.max(0, Number(price) || 0) })} />
        {p.discount_percent > 0 && <small className="after">Akhir: {rupiah(finalPrice(p))}</small>}
      </td>
      <td data-label="Diskon (%)" className="num-s">
        <input type="number" min="0" max="100" value={disc} onChange={(e) => setDisc(e.target.value)}
          onBlur={() => {
            const v = Math.min(100, Math.max(0, Number(disc) || 0));
            setDisc(v);
            if (v !== p.discount_percent) save({ discount_percent: v });
          }} />
      </td>
      <td data-label="Stok" className="num-s">
        <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
          onBlur={() => {
            const v = Math.max(0, Math.floor(Number(stock) || 0));
            setStock(v);
            if (v !== p.stock) save({ stock: v });
          }} />
      </td>
      <td data-label="Tampil">
        <label className="sw-toggle">
          <input type="checkbox" checked={p.is_active} onChange={(e) => save({ is_active: e.target.checked })} aria-label="Tampilkan di katalog" />
          <span />
        </label>
      </td>
      <td className="acts-td">
        <div className="acts">
          <button className="btn ghost sm" onClick={() => onEdit(p)}>Edit</button>
          <button className="btn danger sm" onClick={() => onDelete(p)}>Hapus</button>
        </div>
      </td>
    </tr>
  );
}

/* ---------- Form tambah / edit produk ---------- */
function ProductForm({ item, cats, onClose, notify }) {
  const isNew = !item.id;
  const [f, setF] = useState({
    name: item.name || '',
    category_id: item.category_id || '',
    description: item.description || '',
    price: item.price ?? '',
    discount_percent: item.discount_percent ?? 0,
    stock: item.stock ?? 0,
    is_active: item.is_active ?? true,
    colors: Array.isArray(item.colors) ? item.colors : [],
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : item.image_url || ''), [file, item.image_url]);
  const afterDisc = finalPrice({ price: f.price, discount_percent: f.discount_percent });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    let image_url = item.image_url || null;

    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: ue } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600' });
      if (ue) {
        notify('Gagal upload foto: ' + ue.message);
        setBusy(false);
        return;
      }
      image_url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      name: f.name.trim(),
      description: f.description,
      category_id: f.category_id || null,
      price: Math.max(0, Number(f.price) || 0),
      discount_percent: Math.min(100, Math.max(0, Number(f.discount_percent) || 0)),
      stock: Math.max(0, Math.floor(Number(f.stock) || 0)),
      is_active: f.is_active,
      colors: f.colors,
      image_url,
    };

    const { error } = isNew
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', item.id);

    setBusy(false);
    if (error) return notify('Gagal menyimpan: ' + error.message);
    notify(isNew ? 'Produk berhasil ditambahkan' : 'Produk berhasil diperbarui');
    onClose();
  };

  return (
    <div className="mbg" onClick={onClose}>
      <form className="form" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="form-h">
          <h2>{isNew ? 'Tambah produk' : 'Edit produk'}</h2>
          <button type="button" className="x" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <div className="form-b">
          <div className="form-l">
            <label className="upl">
              {preview ? <img src={preview} alt="Pratinjau foto" /> : <span>Pilih foto produk</span>}
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              Tampilkan di katalog
            </label>
          </div>
          <div className="form-r">
            <label>Nama produk
              <input type="text" value={f.name} onChange={(e) => set('name', e.target.value)} required />
            </label>
            <label>Kategori
              <select value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">Tanpa kategori</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="row2">
              <label>Harga (Rp)
                <input type="number" min="0" value={f.price} onChange={(e) => set('price', e.target.value)} required />
              </label>
              <label>Diskon (%)
                <input type="number" min="0" max="100" value={f.discount_percent} onChange={(e) => set('discount_percent', e.target.value)} />
              </label>
              <label>Stok
                <input type="number" min="0" value={f.stock} onChange={(e) => set('stock', e.target.value)} />
              </label>
            </div>
            {Number(f.discount_percent) > 0 && Number(f.price) > 0 && (
              <p className="hint">Harga setelah diskon: <b>{rupiah(afterDisc)}</b></p>
            )}
            <ColorEditor value={f.colors} onChange={(v) => set('colors', v)} notify={notify} />
            <label>Deskripsi
              <textarea rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} />
            </label>
          </div>
        </div>
        <div className="form-f">
          <button type="button" className="btn ghost" onClick={onClose}>Batal</button>
          <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan produk'}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Kartu kategori ---------- */
function CatBox({ c, notify, ask }) {
  const [name, setName] = useState(c.name);
  const [desc, setDesc] = useState(c.description || '');
  const [order, setOrder] = useState(c.sort_order);

  useEffect(() => {
    setName(c.name);
    setDesc(c.description || '');
    setOrder(c.sort_order);
  }, [c.name, c.description, c.sort_order]);

  const save = async () => {
    const { error } = await supabase.from('categories')
      .update({ name: name.trim(), description: desc, sort_order: Number(order) || 0 }).eq('id', c.id);
    notify(error ? 'Gagal menyimpan: ' + error.message : 'Kategori tersimpan');
  };
  const del = async () => {
    const ok = await ask({ title: 'Hapus kategori?', msg: `Kategori "${c.name}" akan dihapus. Produk di dalamnya menjadi tanpa kategori.`, okLabel: 'Hapus' });
    if (!ok) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    notify(error ? 'Gagal menghapus: ' + error.message : 'Kategori dihapus');
  };

  return (
    <div className="catbox">
      <label>Nama<input type="text" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Urutan<input type="number" value={order} onChange={(e) => setOrder(e.target.value)} title="Urutan tampil" /></label>
      <label className="full">Deskripsi kategori
        <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Tampil di katalog saat kategori dipilih" />
      </label>
      <div className="acts">
        <button className="btn danger sm" onClick={del}>Hapus</button>
        <button className="btn sm" onClick={save}>Simpan</button>
      </div>
    </div>
  );
}

/* ---------- Halaman admin ---------- */
export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('produk');
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  const notify = useCallback((m) => {
    setToast({ m, bad: /gagal|error/i.test(m) });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const ask = useCallback((o) => new Promise((res) => setDlg({ ...o, res })), []);
  const answer = (v) => { dlg.res(v); setDlg(null); };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/admin/login');
      const { data: ok } = await supabase.rpc('is_admin');
      if (!ok) {
        await supabase.auth.signOut();
        return router.replace('/admin/login');
      }
      setReady(true);
    })();
  }, [router]);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order').order('name'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    setCats(c.data || []);
    setProds(p.data || []);
  }, []);

  useEffect(() => {
    if (!ready) return;
    load();
    const ch = supabase
      .channel('admin-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [ready, load]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const delProduct = async (p) => {
    const ok = await ask({ title: 'Hapus produk?', msg: `"${p.name}" akan dihapus permanen dari katalog.`, okLabel: 'Hapus' });
    if (!ok) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    notify(error ? 'Gagal menghapus: ' + error.message : 'Produk dihapus');
  };

  const addCat = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('categories').insert({
      name: newCat.name.trim(),
      description: newCat.description,
      sort_order: cats.length + 1,
    });
    if (error) return notify('Gagal menambah: ' + error.message);
    setNewCat({ name: '', description: '' });
    notify('Kategori ditambahkan');
  };

  if (!ready) return <div className="adm-load">Memeriksa akses…</div>;

  const shown = prods.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const stats = [
    ['Total produk', prods.length],
    ['Tampil di katalog', prods.filter((p) => p.is_active).length],
    ['Stok menipis', prods.filter((p) => p.stock > 0 && p.stock <= 3).length],
    ['Stok habis', prods.filter((p) => p.stock <= 0).length],
  ];

  return (
    <div className="adm-page">
      <header className="adm-bar">
        <div className="adm-bar-in">
          <div className="adm-brand"><span>D&apos;Flara</span><em>Admin</em></div>
          <div className="adm-bar-r">
            <a className="btn ghost light sm" href="/" target="_blank" rel="noreferrer">Lihat katalog</a>
            <button className="btn ghost light sm" onClick={logout}>Keluar</button>
          </div>
        </div>
      </header>

      <div className="adm">
        <section className="stats">
          {stats.map(([l, v]) => (
            <div key={l} className="stat"><b>{v}</b><span>{l}</span></div>
          ))}
        </section>

        <nav className="tabs">
          <button className={tab === 'produk' ? 'on' : ''} onClick={() => setTab('produk')}>Produk ({prods.length})</button>
          <button className={tab === 'kategori' ? 'on' : ''} onClick={() => setTab('kategori')}>Kategori ({cats.length})</button>
        </nav>

        {tab === 'produk' && (
          <>
            <div className="bar">
              <input type="text" placeholder="Cari produk" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn" onClick={() => setEditing({})}>+ Tambah produk</button>
            </div>
            <div className="tw">
              <table>
                <thead>
                  <tr><th>Produk</th><th>Harga (Rp)</th><th>Diskon (%)</th><th>Stok</th><th>Tampil</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <QuickRow key={p.id} p={p} catName={cats.find((c) => c.id === p.category_id)?.name}
                      onEdit={setEditing} onDelete={delProduct} notify={notify} />
                  ))}
                  {shown.length === 0 && (
                    <tr className="none"><td colSpan={6}>Belum ada produk. Klik &quot;Tambah produk&quot; untuk memulai.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="note">Ubah harga, diskon, atau stok langsung di tabel; perubahan tersimpan otomatis saat kolom ditinggalkan.</p>
          </>
        )}

        {tab === 'kategori' && (
          <div className="cats">
            <form className="catbox new" onSubmit={addCat}>
              <label>Kategori baru<input type="text" placeholder="Nama kategori" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} required /></label>
              <span />
              <label className="full">Deskripsi kategori
                <textarea rows={2} placeholder="Tampil di katalog saat kategori dipilih" value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} />
              </label>
              <div className="acts"><button className="btn sm">Tambah kategori</button></div>
            </form>
            {cats.map((c) => <CatBox key={c.id} c={c} notify={notify} ask={ask} />)}
          </div>
        )}
      </div>

      {editing && <ProductForm item={editing} cats={cats} onClose={() => setEditing(null)} notify={notify} />}

      {dlg && (
        <div className="mbg" onClick={() => answer(false)}>
          <div className="dlg" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{dlg.title}</h3>
            <p>{dlg.msg}</p>
            <div className="acts">
              <button className="btn ghost" onClick={() => answer(false)}>Batal</button>
              <button className="btn danger solid" onClick={() => answer(true)}>{dlg.okLabel || 'Ya'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.bad ? 'bad' : 'ok'}`} role="status"><i>{toast.bad ? '!' : '✓'}</i>{toast.m}</div>}
    </div>
  );
}
