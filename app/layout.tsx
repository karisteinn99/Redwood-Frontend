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
      <body>{children}</body>
    </html>
  );
}
