export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const finalPrice = (p) =>
  Math.round((Number(p.price) * (100 - (Number(p.discount_percent) || 0))) / 100);

export const stockInfo = (n) =>
  n <= 0
    ? { label: 'Stok habis', tone: 'bad' }
    : n <= 3
    ? { label: `Tersisa ${n}`, tone: 'warn' }
    : { label: 'Tersedia', tone: 'ok' };
