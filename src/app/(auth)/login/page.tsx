'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, GraduationCap, Wrench, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth/demo-accounts';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get('email') || 'student@campusfix.edu';

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTarget = searchParams.get('redirectTo');

    const navigateToRole = (role: string) => {
      if (redirectTarget && redirectTarget.startsWith(`/${role}`)) {
        router.push(redirectTarget);
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'staff') {
        router.push('/staff/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    };

    try {
      // 1. Try Live Supabase Auth
      try {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInError) {
          if (email.includes('admin')) {
            navigateToRole('admin');
          } else if (email.includes('staff')) {
            navigateToRole('staff');
          } else {
            navigateToRole('student');
          }
          return;
        }
      } catch {
        // Supabase offline or placeholder
      }

      // 2. Fallback to Demo Auth endpoint (ensures reliable testing & demo readiness)
      const demoRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (demoRes.ok) {
        const data = await demoRes.json();
        navigateToRole(data.role);
        return;
      }

      const failData = await demoRes.json().catch(() => ({}));
      setError(failData.error || 'Invalid email or password.');
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Sign In</CardTitle>
        <CardDescription className="text-xs">
          Authenticate to access your role-specific CampusFix portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Demo Switcher */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick Select Demo User
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemo(acc.email)}
                className={`p-2 rounded border text-xs font-medium text-center transition-all ${
                  email === acc.email
                    ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {acc.role === 'student' && <GraduationCap className="w-4 h-4 text-blue-600" />}
                  {acc.role === 'staff' && <Wrench className="w-4 h-4 text-amber-600" />}
                  {acc.role === 'admin' && <ShieldCheck className="w-4 h-4 text-rose-600" />}
                </div>
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-sm"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full text-sm mt-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-center text-xs text-slate-500 space-y-1 border-t bg-slate-50/50 pt-4">
        <div>Multi-College isolation enforced via Supabase RLS</div>
        <div className="text-[11px] text-slate-400">Server-side session validation active</div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Suspense fallback={
        <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading portal...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
