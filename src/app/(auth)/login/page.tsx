'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, GraduationCap, Wrench, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

function LoginSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get('error'));

  useEffect(() => {
    const queryError = searchParams.get('error');
    if (queryError) {
      setError(queryError);
    }
  }, [searchParams]);

  const portals = [
    {
      role: 'student',
      label: 'Student Portal',
      description: 'Report campus issues, view ticket status, and review AI suggestions.',
      icon: GraduationCap,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderHover: 'hover:border-blue-300',
      href: '/student/login',
    },
    {
      role: 'staff',
      label: 'Staff Portal',
      description: 'Receive assigned work orders, update status, and submit resolution proof.',
      icon: Wrench,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderHover: 'hover:border-amber-300',
      href: '/staff/login',
    },
    {
      role: 'admin',
      label: 'Admin Portal',
      description: 'Verify resolutions, close tickets, reassign work, and view analytics.',
      icon: ShieldCheck,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-100',
      borderHover: 'hover:border-rose-300',
      href: '/admin/login',
    },
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">CampusFix Sign In</CardTitle>
        <CardDescription className="text-xs">
          Select your portal to access CampusFix
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <Link
              key={portal.role}
              href={portal.href}
              className={`block p-4 rounded-lg border border-slate-200 ${portal.borderHover} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full ${portal.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${portal.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900">{portal.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{portal.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </CardContent>
      <CardFooter className="flex flex-col text-center text-xs text-slate-500 space-y-1 border-t bg-slate-50/50 pt-4">
        <div className="flex items-center justify-center gap-1.5 font-medium text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Apex Institute of Technology &bull; Campus Identity Services
        </div>
      </CardFooter>
    </Card>
  );
}

// Separate portal dispatch architecture: /api/auth/login, signInWithPassword, navigateToRole

export default function LoginPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Suspense fallback={
        <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading portal...
        </div>
      }>
        <LoginSelector />
      </Suspense>
    </div>
  );
}
