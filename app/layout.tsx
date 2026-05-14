import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Web3Provider from '@/src/providers/Web3Provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DAO Admin Panel',
  description: 'Decentralized administration panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
