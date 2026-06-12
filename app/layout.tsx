import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CertIQ — AI exemption certificate review',
  description:
    'AI-powered exemption certificate intake with confidence-aware extraction and human-in-the-loop review.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
