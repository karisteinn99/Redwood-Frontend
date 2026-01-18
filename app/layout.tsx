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
      <body className="relative min-h-screen bg-gray-50">
        {/* Toast Provider - Layer 50 */}
        <ToastProvider />

        {/* Page Content - Layer 10 */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
