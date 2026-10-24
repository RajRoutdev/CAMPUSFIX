'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface GoogleSignInButtonProps {
  label?: string;
  portal?: 'student' | 'staff' | 'admin';
  redirectTarget?: string;
  className?: string;
  onError?: (error: string) => void;
}

export function GoogleSignInButton({
  label = 'Continue with Google',
  portal = 'student',
  redirectTarget = '/student/dashboard',
  className = '',
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackUrl = new URL('/api/auth/callback', origin);
      callbackUrl.searchParams.set('portal', portal);
      if (redirectTarget) {
        callbackUrl.searchParams.set('next', redirectTarget);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setLoading(false);
        const message = error.message || 'Failed to initialize Google Sign-In.';
        if (onError) onError(message);
        return;
      }

      if (data?.url) {
        // Preflight probe to catch "Unsupported provider: provider is not enabled"
        // before navigating to Supabase's raw JSON error page
        try {
          const probe = await fetch(data.url, { method: 'GET' });
          if (!probe.ok) {
            const probeJson = await probe.json().catch(() => null);
            if (
              probeJson?.msg?.includes('provider is not enabled') ||
              probeJson?.error_code === 'validation_failed'
            ) {
              setLoading(false);
              const helpMsg =
                'Google Sign-In is not enabled in your Supabase project. In Supabase Dashboard, go to Authentication -> Providers -> Google, toggle it ON, and paste your Google Client ID & Secret.';
              if (onError) onError(helpMsg);
              return;
            }
          }
        } catch {
          // A CORS/network error during preflight indicates Supabase responded with
          // a 302 redirect to accounts.google.com, which is the expected OAuth behavior.
        }

        window.location.assign(data.url);
      }
    } catch (err: unknown) {
      setLoading(false);
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to connect to authentication service. Please try again.';
      if (onError) onError(message);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-3 h-10 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-xs transition-all ${className}`}
      aria-label={label}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          {/* Official Google 4-Color G Logo SVG */}
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
