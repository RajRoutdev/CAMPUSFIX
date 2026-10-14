import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'CampusFix — AI-Powered Campus Issue Management',
  description: 'See it. Report it. Route it. Resolve it. A structured, accountable campus facilities operations platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
          <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>CampusFix Platform &bull; Hackathon MVP Active</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>Next.js 14 App Router</span>
              <span>&bull;</span>
              <span>Gemini 1.5 Multimodal</span>
              <span>&bull;</span>
              <span>Supabase Multi-Tenant RLS</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
