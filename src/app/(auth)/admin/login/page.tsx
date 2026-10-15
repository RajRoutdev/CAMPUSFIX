'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
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
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-password" className="text-xs">Password</Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10 text-sm"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-access-code" className="text-xs font-semibold text-rose-700">
                Admin Security Code
              </Label>
              <button
                type="button"
                onClick={() => setShowAccessCode(!showAccessCode)}
                className="text-[11px] text-rose-700 hover:text-rose-900 flex items-center gap-1 transition-colors"
                aria-label={showAccessCode ? 'Hide security code' : 'Show security code'}
              >
                {showAccessCode ? (
                  <>
                    <EyeOff className="w-3 h-3 text-rose-600" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-rose-600" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-rose-500 absolute left-3 top-2.5" />
              <Input
                id="admin-access-code"
                type={showAccessCode ? 'text' : 'password'}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="pl-9 pr-10 text-sm border-rose-200 focus:ring-rose-500"
                placeholder="Enter admin security code"
                required
              />
              <button
                type="button"
                onClick={() => setShowAccessCode(!showAccessCode)}
                className="absolute right-3 top-2.5 text-rose-600/70 hover:text-rose-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded p-0.5"
                aria-label={showAccessCode ? 'Hide security code' : 'Show security code'}
                title={showAccessCode ? 'Hide security code' : 'Show security code'}
              >
                {showAccessCode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Issued by institutional IT governance
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full text-sm mt-3 h-10 font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs">
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
      </CardContent>
      <CardFooter className="flex flex-col text-center text-xs text-slate-500 space-y-1 border-t bg-slate-50/50 pt-4">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
          Apex Institute of Technology &bull; Campus Administration
        </div>
        <div className="text-[11px] text-slate-400">
          Institutional access only — public registration is disabled
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
