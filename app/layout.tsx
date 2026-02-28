import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Club Freja — Södra Sveriges hemligaste sällskap',
  description: 'Exklusivitet · Diskretion · Elegans',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
