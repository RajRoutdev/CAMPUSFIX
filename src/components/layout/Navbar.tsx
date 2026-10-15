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
        return (
          trimmed.startsWith('campusfix_session=') ||
          trimmed.startsWith('campusfix_logged_in=') ||
          trimmed.startsWith('sb-')
        );
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
      document.cookie = 'campusfix_logged_in=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
          <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs">
            <Link href="/student/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 text-xs rounded-lg transition-all ${
                  pathname.startsWith('/student')
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Student
              </Button>
            </Link>
            <Link href="/staff/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 text-xs rounded-lg transition-all ${
                  pathname.startsWith('/staff')
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Staff
              </Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 text-xs rounded-lg transition-all ${
                  pathname === '/admin/dashboard' || pathname.startsWith('/admin/issues')
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                Admin
              </Button>
            </Link>

            <Link href="/admin/analytics">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 text-xs rounded-lg transition-all ${
                  pathname.startsWith('/admin/analytics')
                    ? 'bg-blue-600 text-white shadow-2xs font-bold hover:bg-blue-600'
                    : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50/70 font-semibold'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Intelligence
              </Button>
            </Link>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" aria-hidden="true" />

          {hasSession ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-8 gap-1.5 text-xs text-slate-600 hover:text-rose-600 hover:border-rose-200 border-slate-200 transition-colors shadow-2xs"
              aria-label="Sign out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold border-slate-200 shadow-2xs">
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
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-white/98 backdrop-blur px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Campus Portals
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/student/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith('/student') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-semibold gap-2 h-9 border-slate-200"
              >
                <GraduationCap className="w-4 h-4 text-blue-500" />
                Student
              </Button>
            </Link>
            <Link href="/staff/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith('/staff') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-semibold gap-2 h-9 border-slate-200"
              >
                <Wrench className="w-4 h-4 text-amber-500" />
                Staff
              </Button>
            </Link>
            <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname === '/admin/dashboard' || pathname.startsWith('/admin/issues') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-semibold gap-2 h-9 border-slate-200"
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                Admin
              </Button>
            </Link>
            <Link href="/admin/analytics" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith('/admin/analytics') ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs font-semibold gap-2 h-9 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Analytics
              </Button>
            </Link>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/student/report"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-primary flex items-center gap-1.5 py-1.5 px-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Report Issue Now
            </Link>

            {hasSession ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-rose-600 hover:bg-rose-50 gap-1.5 h-8"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 font-semibold">
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
