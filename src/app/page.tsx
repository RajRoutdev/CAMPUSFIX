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
  Sparkles,
  Flame,
  BarChart3,
  Search,
  Camera,
  Check,
  Building,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_ACCOUNTS } from '@/lib/auth/demo-accounts';

export default function HomePage() {
  const workflowSteps = [
    {
      num: '01',
      title: 'Student Photo Capture',
      desc: 'Student snaps a phone photo of broken fixtures, leaks, or hazards. No manual category selection needed.',
      icon: <Camera className="w-4 h-4 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50/30',
    },
    {
      num: '02',
      title: 'Gemini 1.5 Vision Analysis',
      desc: 'Server-side AI analyzes physical damage, suggesting structured title, severity, category, and department.',
      icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
      color: 'border-indigo-200 bg-indigo-50/30',
    },
    {
      num: '03',
      title: '4-Factor Duplicate Check',
      desc: 'Transparent algorithm scores Location (40%), Category (25%), Semantics (25%), and Time (10%). Never silently merges.',
      icon: <Search className="w-4 h-4 text-amber-600" />,
      color: 'border-amber-200 bg-amber-50/30',
    },
    {
      num: '04',
      title: 'Department Work Order',
      desc: 'Ticket dispatched directly to specialized maintenance crew (Electrical, Plumbing, IT, Housekeeping).',
      icon: <Wrench className="w-4 h-4 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50/30',
    },
    {
      num: '05',
      title: 'Resolution Proof Evidence',
      desc: 'Technicians execute physical repairs and upload verifiable photographic proof alongside completion notes.',
      icon: <CheckCircle2 className="w-4 h-4 text-purple-600" />,
      color: 'border-purple-200 bg-purple-50/30',
    },
    {
      num: '06',
      title: 'Admin Sign-Off & Close',
      desc: 'Administrators inspect evidence, verify repairs, and officially transition verified tickets to Closed.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      color: 'border-emerald-200 bg-emerald-50/30',
    },
    {
      num: '07',
      title: 'Deterministic Intelligence',
      desc: 'Facilities engine detects recurring failures (Room 204 electrical) and hotspots without AI numerical hallucination.',
      icon: <BarChart3 className="w-4 h-4 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50/30',
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Campus Facility Operations &bull; Intelligent Issue Resolution</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
          Campus<span className="text-primary">Fix</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 font-medium italic">
          &ldquo;See it. Report it. Route it. Resolve it.&rdquo;
        </p>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          An AI-assisted campus operations platform transforming unstructured student reports into
          accountable technician workflows, verified resolution evidence, and deterministic facility intelligence.
        </p>

        <div className="pt-3 flex flex-wrap gap-3.5 justify-center">
          <Link href="/student/report">
            <Button size="lg" className="font-bold text-sm gap-2 h-11 px-6 bg-primary hover:bg-primary/95 text-white shadow-sm transition-all hover:shadow">
              <Camera className="w-4 h-4" />
              Report Issue Now
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant="outline" size="lg" className="font-semibold text-sm gap-2 h-11 px-6 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all">
              <BarChart3 className="w-4 h-4 text-primary" />
              View Campus Intelligence
            </Button>
          </Link>
        </div>
      </section>

      {/* Role Portal Selection Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Role-Based Portals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Dedicated operational portals engineered for students, field maintenance technicians, and institutional facility administrators.
          </p>
        </div>

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

            const getLoginHref = () => {
              if (acc.role === 'student') return '/student/login';
              if (acc.role === 'staff') return '/staff/login';
              return '/admin/login';
            };

            const getSubtitle = () => {
              if (acc.role === 'student') return 'Students & Faculty Members';
              if (acc.role === 'staff') return 'Technician & Field Operations';
              return 'Facilities & Campus Administration';
            };

            return (
              <Card
                key={acc.role}
                className="flex flex-col justify-between hover:shadow-lg transition-all duration-200 border-slate-200/90 bg-white group hover:border-slate-300"
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200/70 transition-colors shadow-2xs">
                      {getIcon()}
                    </div>
                    <Badge variant={acc.role === 'student' ? 'info' : acc.role === 'staff' ? 'warning' : 'destructive'} className="font-semibold text-xs">
                      {acc.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{acc.label}</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">
                    {getSubtitle()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[48px]">
                    {acc.description}
                  </p>

                  <div className="pt-2 space-y-2">
                    <Link href={getHref()} className="block w-full">
                      <Button variant="default" className="w-full text-xs font-semibold gap-1.5 bg-slate-900 hover:bg-slate-800 text-white shadow-xs">
                        Open Portal
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Link href={getLoginHref()} className="block text-center text-[11px] text-slate-500 hover:text-slate-900 font-medium transition-colors">
                      Sign in directly &rarr;
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* End-to-End Operational Pipeline */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="outline" className="text-xs font-mono text-primary border-primary/20 bg-blue-50/50">
            End-to-End LifeCycle
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How CampusFix Solves the Broken Campus Loop
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A seamless bridge from casual photo reporting to verified physical resolution and administrative intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className={`p-4 rounded-xl border ${step.color} space-y-2 transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">{step.num}</span>
                <div className="p-1.5 rounded-lg bg-white shadow-2xs">
                  {step.icon}
                </div>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture & Engineering Standards Grid */}
      <section className="bg-slate-100/70 rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Architecture &amp; Engineering Guardrails</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Engineered with multi-tenant campus isolation, strict row-level security, and deterministic reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Database className="w-4 h-4 text-primary" />
              <span>Multi-Tenant Schema</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              8 normalized PostgreSQL tables scoped strictly by <code>college_id</code> for multi-campus isolation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Strict RLS &amp; RBAC</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforced at database and server-route layers. Browser roles are never trusted.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Assistive AI (Rule 25)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI suggests titles &amp; extracts evidence; deterministic queries remain the sole source of truth for numbers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Chronic Cluster Alerts</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic recurring failure warnings highlight rooms with &ge; 2 repeated complaints to stop chronic breakdowns.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
