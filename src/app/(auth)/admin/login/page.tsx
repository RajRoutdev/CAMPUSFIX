'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('admin@campusfix.edu');
  const [password, setPassword] = useState('Password123!');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTarget = searchParams.get('redirectTo');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          portal: 'admin',
          accessCode,
        }),
      });

      if (res.ok) {
        if (redirectTarget && redirectTarget.startsWith('/admin')) {
          router.push(redirectTarget);
        } else {
          router.push('/admin/dashboard');
        }
        return;
      }

      const failData = await res.json().catch(() => ({}));
      setError(failData.error || 'Authentication failed.');
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
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-rose-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
        <CardDescription className="text-xs">
          Campus administration — verify resolutions, manage assignments, view analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="admin-email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-sm"
                placeholder="admin-email@college.edu"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="admin-password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-sm"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="admin-access-code" className="text-xs font-semibold text-rose-700">
              Admin Security Code
            </Label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-rose-500 absolute left-3 top-2.5" />
              <Input
                id="admin-access-code"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="pl-9 text-sm border-rose-200 focus:ring-rose-500"
                placeholder="Enter admin security code"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Issued by institutional IT governance
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full text-sm mt-2 bg-rose-600 hover:bg-rose-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying credentials & security code...
              </>
            ) : (
              <>
                Sign In to Admin Portal
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-2 border-t">
          <p className="text-xs text-slate-500 mb-2">Demo Credentials</p>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@campusfix.edu');
              setPassword('Password123!');
              setAccessCode('ADMIN-2024');
              setError(null);
            }}
            className="text-xs text-rose-600 hover:underline"
          >
            Use demo admin account & code
          </button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col text-center text-xs text-slate-500 space-y-1 border-t bg-slate-50/50 pt-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-rose-600" />
          Security code verified server-side
        </div>
        <div className="text-[11px] text-slate-400">
          Role verified from database — public registration is disabled
        </div>
      </CardFooter>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Suspense fallback={
        <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading portal...
        </div>
      }>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
