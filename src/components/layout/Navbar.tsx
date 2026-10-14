'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wrench, ShieldCheck, GraduationCap, LogIn, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if session cookie is present in browser
    const checkSession = () => {
      const hasCookie = document.cookie.split(';').some((c) => {
        const trimmed = c.trim();
        return trimmed.startsWith('campusfix_session=') || trimmed.startsWith('sb-');
      });
      setHasSession(hasCookie);
    };

    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      document.cookie = 'campusfix_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setHasSession(false);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const getRoleBadge = () => {
    if (pathname.startsWith('/student')) {
      return (
        <Badge variant="info" className="flex items-center gap-1 font-medium">
          <GraduationCap className="w-3.5 h-3.5" />
          Student Portal
        </Badge>
      );
    }
    if (pathname.startsWith('/staff')) {
      return (
        <Badge variant="warning" className="flex items-center gap-1 font-medium">
          <Wrench className="w-3.5 h-3.5" />
          Staff Operations
        </Badge>
      );
    }
    if (pathname.startsWith('/admin')) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Campus Admin
        </Badge>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-lg text-primary">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
              CF
            </div>
            <span>CampusFix</span>
          </Link>

          {getRoleBadge()}
        </div>

        <nav className="flex items-center gap-3">
          <Link href="/student/dashboard">
            <Button variant={pathname.startsWith('/student') ? 'default' : 'ghost'} size="sm">
              Student
            </Button>
          </Link>
          <Link href="/staff/dashboard">
            <Button variant={pathname.startsWith('/staff') ? 'default' : 'ghost'} size="sm">
              Staff
            </Button>
          </Link>
          <Link href="/admin/dashboard">
            <Button variant={pathname === '/admin/dashboard' || pathname.startsWith('/admin/issues') ? 'default' : 'ghost'} size="sm">
              Admin
            </Button>
          </Link>
          {pathname.startsWith('/admin') && (
            <Link href="/admin/analytics">
              <Button variant={pathname.startsWith('/admin/analytics') ? 'default' : 'ghost'} size="sm">
                Analytics
              </Button>
            </Link>
          )}

          {hasSession ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-slate-600 hover:text-rose-600"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
