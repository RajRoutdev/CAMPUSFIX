import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'CampusFix — AI-Powered Campus Issue Management',
  description: 'See it. Report it. Route it. Resolve it. A structured, accountable campus operations platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-white py-4 text-center text-xs text-muted-foreground">
          CampusFix MVP &bull; Hackathon Foundation Phase Complete &bull; Multi-college Architecture
        </footer>
      </body>
    </html>
  );
}
