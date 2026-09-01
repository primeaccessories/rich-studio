import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Rich Colvill Studio | Branding & Creative Production',
  description: 'High-end branding, design, and creative production studio. Specializing in luxury brand identity and creative storytelling.',
  openGraph: {
    title: 'Rich Colvill Studio',
    description: 'High-end branding, design, and creative production studio.',
    type: 'website',
    url: 'https://richcolvill.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
