'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('student@campusfix.edu');
  const [password, setPassword] = useState('Password123!');
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
          portal: 'student',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (redirectTarget && redirectTarget.startsWith('/student')) {
          router.push(redirectTarget);
        } else {
          router.push('/student/dashboard');
        }
        return;
      }

      const failData = await res.json().catch(() => ({}));
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
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Student Portal</CardTitle>
        <CardDescription className="text-xs">
          Sign in to report campus issues and track your tickets
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
            <Label htmlFor="student-email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-sm"
                placeholder="your-email@college.edu"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="student-password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                id="student-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-sm"
                placeholder="Enter your password"
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

        <div className="text-center pt-2 border-t">
          <p className="text-xs text-slate-500 mb-2">Demo Credentials</p>
          <button
            type="button"
            onClick={() => {
              setEmail('student@campusfix.edu');
              setPassword('Password123!');
              setError(null);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Use demo student account
          </button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col text-center text-xs text-slate-500 space-y-1 border-t bg-slate-50/50 pt-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" />
          Student-only portal — no access code required
        </div>
        <div className="text-[11px] text-slate-400">Server-side session validation active</div>
      </CardFooter>
    </Card>
  );
}

export default function StudentLoginPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Suspense fallback={
        <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading portal...
        </div>
      }>
        <StudentLoginForm />
      </Suspense>
    </div>
  );
}
