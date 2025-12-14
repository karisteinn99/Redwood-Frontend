import Image from 'next/image';
import ToastProvider from './components/toast';
import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Where?',
  description:
    'Where? - Seek. Locate. Conquer. Embark on an epic adventure in a vast open world filled with mysteries, challenges, and endless possibilities. Your journey begins here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload the Earth background image */}
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=2070&auto=format&fit=crop"
          fetchPriority="high"
        />
      </head>
      <body className="bg-space relative min-h-screen">
        {/* Global Earth Background - Layer 0 */}
        <div className="fixed inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=2070&auto=format&fit=crop"
            alt="Earth from space"
            fill
            className="h-full w-full object-cover opacity-80"
            style={
              {
                imageRendering: 'crisp-edges',
              } as React.CSSProperties
            }
            priority
            quality={80}
            sizes="100vw"
          />
        </div>

        {/* Dark overlay for better contrast - Layer 5 */}
        <div className="pointer-events-none fixed inset-0 z-5 bg-black/40" />

        {/* Toast Provider - Layer 50 */}
        <ToastProvider />

        {/* Page Content - Layer 10 */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
