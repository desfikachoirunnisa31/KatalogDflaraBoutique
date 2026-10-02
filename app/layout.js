import { Bodoni_Moda, Jost } from 'next/font/google';
import './globals.css';

const serif = Bodoni_Moda({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-serif' });
const sans = Jost({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-sans' });

export const metadata = {
  title: "D'Flara Boutique — Katalog",
  description: "Katalog koleksi D'Flara Boutique dengan harga dan ketersediaan stok yang selalu terbaru.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
