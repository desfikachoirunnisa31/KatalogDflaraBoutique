export const STORE = {
  name: "D'Flara Boutique",
  address: 'Jl. Jati Raya No.1, Kalirejo, Ungaran Timur, Kab. Semarang',
  instagram: 'https://www.instagram.com/d_flaraboutique?stkn=MWt0cms0MGlqd29qZA%3D%3D&utm_source=qr',
  instagramHandle: '@d_flaraboutique',
  tiktok: 'https://www.tiktok.com/@dflarabutik?_r=1&_t=ZS-9ADIAvABM4Q',
  tiktokHandle: '@dflarabutik',
};

const q = encodeURIComponent(STORE.address);
export const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${q}`;
export const MAPS_EMBED = `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
