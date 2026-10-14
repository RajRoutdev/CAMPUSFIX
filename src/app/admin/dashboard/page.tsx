'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  BarChart3,
  AlertTriangle,
  Users,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  Loader2,
  RefreshCw,
  MapPin,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export default function AdminDashboardPage() {
  const [issues, setIssues] = useState<IssueWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) {
        throw new Error('Failed to load campus issues');
      }
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching operational data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Compute metrics
  const totalVolume = issues.length;
  const pendingVerification = issues.filter((i) => i.status === 'RESOLUTION_SUBMITTED');
  const openCount = issues.filter((i) => i.status === 'NEW' || i.status === 'ASSIGNED').length;
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const closedCount = issues.filter((i) => i.status === 'VERIFIED' || i.status === 'CLOSED').length;
  const criticalCount = issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length;

  // Department counts
  const electricalCount = issues.filter((i) => i.category === 'Electrical').length;
  const plumbingCount = issues.filter((i) => i.category === 'Plumbing').length;
  const itCount = issues.filter((i) => i.category === 'Internet/Network' || i.category === 'Classroom Equipment').length;
  const generalCount = issues.filter((i) => i.category !== 'Electrical' && i.category !== 'Plumbing' && i.category !== 'Internet/Network' && i.category !== 'Classroom Equipment').length;

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campus Administrator Portal</h1>
            <Badge variant="destructive">Admin Access</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            College-wide operational overview, resolution verification, and department workload.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/issues">
            <Button variant="outline" size="sm" className="gap-1.5">
              Manage All Issues
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIssues}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="hover:border-slate-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Campus Volume</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">{totalVolume}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-blue-500" /> Total college reports
          </CardContent>
        </Card>

        <Card className="hover:border-purple-300 transition-colors bg-purple-50/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-purple-900">Pending Verification</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-700">{pendingVerification.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-purple-700 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-purple-600" /> Awaiting admin review
          </CardContent>
        </Card>

        <Card className="hover:border-amber-300 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">In Progress</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{inProgressCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Under active repair
          </CardContent>
        </Card>

        <Card className="hover:border-rose-300 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Critical / High</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">{criticalCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Priority attention
          </CardContent>
        </Card>
      </div>

      {/* Verification Queue (Critical Hackathon Feature) */}
      <Card className="border-purple-200 bg-purple-50/10">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <CardTitle className="text-base text-slate-900">
                Resolution Verification Queue
              </CardTitle>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {pendingVerification.length} Needs Review
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-600">
            Work completed by technicians with repair photo evidence awaiting administrative sign-off.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-1">
          {pendingVerification.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              All submitted resolutions have been verified. No pending items in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVerification.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-lg bg-white border border-purple-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {ticket.ticket_number}
                      </span>
                      <StatusBadge status={ticket.status} />
                      <SeverityBadge severity={ticket.severity} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{ticket.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{formatLocationString(ticket.location)}</span>
                      <span>&bull;</span>
                      <Wrench className="w-3 h-3 text-slate-400" />
                      <span>{ticket.assignee?.name || 'Assigned Staff'}</span>
                    </div>
                  </div>

                  <Link href={`/admin/issues/${ticket.ticket_number}`}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1">
                      Inspect &amp; Verify
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Workload Summary Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Department Workload Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Electrical Department</CardDescription>
              <CardTitle className="text-xl font-bold">{electricalCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Power, lighting, fans &amp; fixtures
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Plumbing &amp; Sanitation</CardDescription>
              <CardTitle className="text-xl font-bold">{plumbingCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Water pipes, faucets, washbasins
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">IT &amp; Classroom Equipment</CardDescription>
              <CardTitle className="text-xl font-bold">{itCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Projectors, Wi-Fi, lab machines
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">General / Infrastructure</CardDescription>
              <CardTitle className="text-xl font-bold">{generalCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Civil, furniture, housekeeping
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
