'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wrench, Mail, Lock, ArrowRight, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('staff@campusfix.edu');
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
          portal: 'staff',
          accessCode,
        }),
      });

      if (res.ok) {
        if (redirectTarget && redirectTarget.startsWith('/staff')) {
          router.push(redirectTarget);
        } else {
          router.push('/staff/dashboard');
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
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Staff Portal</CardTitle>
        <CardDescription className="text-xs">
          Sign in to manage assigned work orders and submit resolutions
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
            <Label htmlFor="staff-email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-sm"
                placeholder="staff-email@college.edu"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="staff-password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="staff-password"
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
            <Label htmlFor="staff-access-code" className="text-xs font-semibold text-amber-700">
              Staff Access Code
            </Label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
              <Input
                id="staff-access-code"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="pl-9 text-sm border-amber-200 focus:ring-amber-500"
                placeholder="Enter staff access code"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Provided by your campus administrator
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full text-sm mt-3 h-10 font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying credentials & access code...
              </>
            ) : (
              <>
                Sign In to Staff Portal
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-center text-xs text-slate-500 space-y-1 border-t bg-slate-50/50 pt-4">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          Apex Institute of Technology &bull; Staff Identity &amp; Authorization
        </div>
      </CardFooter>
    </Card>
  );
}

export default function StaffLoginPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Suspense fallback={
        <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading portal...
        </div>
      }>
        <StaffLoginForm />
      </Suspense>
    </div>
  );
}
