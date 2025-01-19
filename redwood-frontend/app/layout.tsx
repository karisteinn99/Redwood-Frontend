import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "It's over Anakin, I have the high ground",
  description:
    'This is a setup page to be used for multiple projects...hopefully',
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
