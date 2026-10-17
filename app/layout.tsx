import ToastProvider from './components/ui/toast';
import './globals.css';

import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Fraunces, Gloock } from 'next/font/google';

// The house's three families (see the design system's Type): `read` for
// anything people read or type, `display` for warm headings, `logo` for the
// logo only. Exposed as CSS variables so Tailwind and globals.css share them.
const read = Atkinson_Hyperlegible({ subsets: ['latin', 'latin-ext'], weight: ['400', '700'], variable: '--font-read' });
const display = Fraunces({ subsets: ['latin', 'latin-ext'], weight: ['600', '800'], style: ['normal', 'italic'], variable: '--font-display' });
const logo = Gloock({ subsets: ['latin'], weight: '400', variable: '--font-logo' });

export const metadata: Metadata = {
  title: 'Go Home',
  description: 'Game night lives here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${read.variable} ${display.variable} ${logo.variable}`}>
      <body className="relative min-h-screen bg-gray-50">
        {/* Toast Provider - Layer 50 */}
        <ToastProvider />

        {/* Page Content - Layer 10 */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
