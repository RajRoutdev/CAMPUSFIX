'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wrench,
  ShieldCheck,
  GraduationCap,
  LogIn,
  LogOut,
  BarChart3,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      document.cookie = 'campusfix_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setHasSession(false);
      setMobileMenuOpen(false);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const getRoleBadge = () => {
    if (pathname.startsWith('/student')) {
      return (
        <Badge variant="info" className="flex items-center gap-1 font-medium text-xs">
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Student Portal</span>
          <span className="sm:hidden">Student</span>
        </Badge>
      );
    }
    if (pathname.startsWith('/staff')) {
      return (
        <Badge variant="warning" className="flex items-center gap-1 font-medium text-xs">
          <Wrench className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Staff Operations</span>
          <span className="sm:hidden">Staff</span>
        </Badge>
      );
    }
    if (pathname.startsWith('/admin')) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 font-medium text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Campus Admin</span>
          <span className="sm:hidden">Admin</span>
        </Badge>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xs">
      <div className="container flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Active Role Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight text-lg text-primary hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label="CampusFix Home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
              CF
            </div>
            <span className="font-extrabold tracking-tight text-slate-900">
              Campus<span className="text-primary">Fix</span>
            </span>
          </Link>

          {getRoleBadge()}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
          <Link href="/student/dashboard">
            <Button
              variant={pathname.startsWith('/student') ? 'default' : 'ghost'}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student
            </Button>
          </Link>
          <Link href="/staff/dashboard">
            <Button
              variant={pathname.startsWith('/staff') ? 'default' : 'ghost'}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              Staff
            </Button>
          </Link>
          <Link href="/admin/dashboard">
            <Button
              variant={pathname === '/admin/dashboard' || pathname.startsWith('/admin/issues') ? 'default' : 'ghost'}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Button>
          </Link>

          <Link href="/admin/analytics">
            <Button
              variant={pathname.startsWith('/admin/analytics') ? 'default' : 'ghost'}
              size="sm"
              className={`text-xs font-semibold gap-1.5 ${
                pathname.startsWith('/admin/analytics')
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-blue-700 hover:text-blue-800 hover:bg-blue-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Intelligence
            </Button>
          </Link>

          <div className="h-4 w-px bg-slate-200 mx-1" aria-hidden="true" />

          {hasSession ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors"
              aria-label="Sign out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-white px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 pt-1">
            Role Portals
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/student/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith('/student') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-medium gap-2"
              >
                <GraduationCap className="w-4 h-4 text-blue-500" />
                Student
              </Button>
            </Link>
            <Link href="/staff/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith('/staff') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-medium gap-2"
              >
                <Wrench className="w-4 h-4 text-amber-500" />
                Staff
              </Button>
            </Link>
            <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname === '/admin/dashboard' || pathname.startsWith('/admin/issues') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-medium gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                Admin
              </Button>
            </Link>
            <Link href="/admin/analytics" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith('/admin/analytics') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-medium gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Analytics
              </Button>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/student/report"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-primary flex items-center gap-1 p-2 hover:bg-blue-50 rounded"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Report Issue Now
            </Link>

            {hasSession ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-rose-600 hover:bg-rose-50 gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
