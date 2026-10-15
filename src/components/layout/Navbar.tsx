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
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'staff' | 'admin' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Instant synchronous check from client cookies
    const checkCookies = () => {
      const cookies = document.cookie.split(';');
      let roleFromCookie: 'student' | 'staff' | 'admin' | null = null;
      let loggedIn = false;

      for (const c of cookies) {
        const trimmed = c.trim();
        if (trimmed.startsWith('campusfix_role=')) {
          const val = trimmed.substring('campusfix_role='.length);
          if (val === 'student' || val === 'staff' || val === 'admin') {
            roleFromCookie = val;
          }
        }
        if (
          trimmed.startsWith('campusfix_session=') ||
          trimmed.startsWith('campusfix_logged_in=') ||
          trimmed.startsWith('sb-')
        ) {
          loggedIn = true;
        }
      }

      // If on role-specific path, fallback role hint if cookie is pending
      if (!roleFromCookie) {
        if (pathname.startsWith('/student')) roleFromCookie = 'student';
        else if (pathname.startsWith('/staff')) roleFromCookie = 'staff';
        else if (pathname.startsWith('/admin')) roleFromCookie = 'admin';
      }

      setHasSession(loggedIn || !!roleFromCookie);
      setUserRole(roleFromCookie);
    };

    checkCookies();

    // 2. Verified async session check from /api/auth/me
    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.role) {
            setUserRole(data.role);
            setHasSession(true);
            return;
          }
        }
        // If unauthenticated on non-public page, reset
        if (!pathname.startsWith('/student') && !pathname.startsWith('/staff') && !pathname.startsWith('/admin')) {
          setUserRole(null);
          setHasSession(false);
        }
      } catch {
        // network or server error
      }
    };

    verifySession();
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
      document.cookie = 'campusfix_role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setHasSession(false);
      setUserRole(null);
      setMobileMenuOpen(false);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const getRoleBadge = () => {
    const effectiveRole = userRole || (pathname.startsWith('/student') ? 'student' : pathname.startsWith('/staff') ? 'staff' : pathname.startsWith('/admin') ? 'admin' : null);

    if (effectiveRole === 'student') {
      return (
        <Badge variant="info" className="flex items-center gap-1 font-medium text-xs">
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Student Portal</span>
          <span className="sm:hidden">Student</span>
        </Badge>
      );
    }
    if (effectiveRole === 'staff') {
      return (
        <Badge variant="warning" className="flex items-center gap-1 font-medium text-xs">
          <Wrench className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Staff Operations</span>
          <span className="sm:hidden">Staff</span>
        </Badge>
      );
    }
    if (effectiveRole === 'admin') {
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

        {/* Desktop Navigation — strictly scoped to authenticated user role */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
          {hasSession && userRole === 'student' && (
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs">
              <Link href="/student/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 text-xs rounded-lg transition-all ${
                    pathname === '/student/dashboard'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  My Issues
                </Button>
              </Link>
              <Link href="/student/report">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 text-xs rounded-lg transition-all ${
                    pathname === '/student/report'
                      ? 'bg-primary text-white shadow-2xs font-bold hover:bg-primary'
                      : 'text-primary hover:text-primary hover:bg-blue-50/70 font-semibold'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  Report Issue
                </Button>
              </Link>
            </div>
          )}

          {hasSession && userRole === 'staff' && (
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs">
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
                  Work Orders
                </Button>
              </Link>
            </div>
          )}

          {hasSession && userRole === 'admin' && (
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs">
              <Link href="/admin/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 text-xs rounded-lg transition-all ${
                    pathname === '/admin/dashboard'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/issues">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 text-xs rounded-lg transition-all ${
                    pathname.startsWith('/admin/issues')
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                  Manage Issues
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
          )}

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

      {/* Mobile Dropdown Menu — strictly filtered by user role */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-white/98 backdrop-blur px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          {hasSession && userRole === 'student' && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Student Menu
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/student/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === '/student/dashboard' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs font-semibold gap-2 h-9 border-slate-200"
                  >
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    My Issues
                  </Button>
                </Link>
                <Link href="/student/report" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === '/student/report' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs font-semibold gap-2 h-9 border-blue-200 text-blue-700 bg-blue-50/50"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    Report Issue Now
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {hasSession && userRole === 'staff' && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Technician Queue
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/staff/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname.startsWith('/staff') ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs font-semibold gap-2 h-9 border-slate-200"
                  >
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Work Orders
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {hasSession && userRole === 'admin' && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Campus Admin
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === '/admin/dashboard' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs font-semibold gap-2 h-9 border-slate-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    Overview
                  </Button>
                </Link>
                <Link href="/admin/issues" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname.startsWith('/admin/issues') ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs font-semibold gap-2 h-9 border-slate-200"
                  >
                    <Building className="w-4 h-4 text-slate-600" />
                    Manage Issues
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
            </div>
          )}

          {!hasSession && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Campus Portals
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/student/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-medium gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    Student
                  </Button>
                </Link>
                <Link href="/staff/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-medium gap-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Staff
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
            {hasSession ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-rose-600 hover:bg-rose-50 gap-1.5 h-8 w-full justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 font-semibold w-full justify-center">
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
