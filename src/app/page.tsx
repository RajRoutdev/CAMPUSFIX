import Link from 'next/link';
import {
  GraduationCap,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Database,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_ACCOUNTS } from '@/lib/auth/demo-accounts';

export default function HomePage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Phase 1: Foundation Ready
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Campus<span className="text-primary">Fix</span>
        </h1>
        <p className="text-lg text-slate-600 italic font-medium">
          See it. Report it. Route it. Resolve it.
        </p>
        <p className="text-sm sm:text-base text-slate-600">
          An AI-assisted campus operations platform transforming unstructured complaints into
          verifiable workflows, department accountability, and operational campus intelligence.
        </p>
      </section>

      {/* Role Portal Selection */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center">
          Experience CampusFix by Role
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_ACCOUNTS.map((acc) => {
            const getIcon = () => {
              if (acc.role === 'student') return <GraduationCap className="w-6 h-6 text-blue-600" />;
              if (acc.role === 'staff') return <Wrench className="w-6 h-6 text-amber-600" />;
              return <ShieldCheck className="w-6 h-6 text-rose-600" />;
            };

            const getHref = () => {
              if (acc.role === 'student') return '/student/dashboard';
              if (acc.role === 'staff') return '/staff/dashboard';
              return '/admin/dashboard';
            };

            return (
              <Card key={acc.role} className="flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 rounded-lg bg-slate-100">
                      {getIcon()}
                    </div>
                    <Badge variant={acc.role === 'student' ? 'info' : acc.role === 'staff' ? 'warning' : 'destructive'}>
                      {acc.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{acc.label}</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {acc.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 min-h-[48px]">
                    {acc.description}
                  </p>
                  <div className="pt-2 flex gap-2">
                    <Link href={`/login?email=${encodeURIComponent(acc.email)}`} className="w-full">
                      <Button variant="outline" className="w-full text-xs">
                        Sign In as {acc.label}
                      </Button>
                    </Link>
                    <Link href={getHref()} className="w-full">
                      <Button variant="default" className="w-full text-xs gap-1">
                        Open Portal
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Phase 1 Deliverables Verification */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Phase 1: Foundation Implementation Scope</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Core architectural plumbing, data models, authentication guards, and database isolation are established.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Database className="w-4 h-4 text-primary" />
              <span>Database Schema</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              8 tables: colleges, profiles, departments, locations, issues, issue_images, issue_matches, activity_logs.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Row Level Security</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforced at the PostgreSQL level. Strict cross-college data isolation and role boundaries.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Storage Strategy</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Configured bucket <code>campusfix-images</code> for original student photos and staff resolution evidence.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Server-Side Guard</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Service-role key isolated from browser code. Client roles are never trusted.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
