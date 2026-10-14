'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Clock,
  Wrench,
  CheckCircle2,
  FileText,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export default function StudentDashboardPage() {
  const [issues, setIssues] = useState<IssueWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIssues() {
      try {
        const res = await fetch('/api/issues');
        if (res.ok) {
          const data = await res.json();
          setIssues(data.issues || []);
        }
      } catch (err) {
        console.error('Failed to load issues', err);
      } finally {
        setLoading(false);
      }
    }

    loadIssues();
  }, []);

  const totalCount = issues.length;
  const openCount = issues.filter((i) => i.status === 'NEW' || i.status === 'ASSIGNED').length;
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount = issues.filter(
    (i) => i.status === 'RESOLUTION_SUBMITTED' || i.status === 'VERIFIED' || i.status === 'CLOSED'
  ).length;

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Portal</h1>
            <Badge variant="info">Student Access</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Report issues, track technician progress, and review AI suggestions.
          </p>
        </div>

        <Link href="/student/report">
          <Button className="gap-2 shadow-sm font-semibold">
            <PlusCircle className="w-4 h-4" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Total Reported</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> All time tickets
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Open / Pending</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{openCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Awaiting dispatch
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">In Progress</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{inProgressCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-blue-500" /> Technician working
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Resolved</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{resolvedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fixed & closed
          </CardContent>
        </Card>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Reported Issues</h2>
          <span className="text-xs text-muted-foreground">{issues.length} {issues.length === 1 ? 'ticket' : 'tickets'}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm">Loading your tickets...</p>
          </div>
        ) : issues.length === 0 ? (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800">No issues found. Your campus is looking good!</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Notice a broken ceiling fan, leaking washroom tap, or projector failure? Report it here for swift resolution.
                </p>
              </div>
              <Link href="/student/report">
                <Button size="sm" className="gap-1.5 mt-2">
                  <PlusCircle className="w-4 h-4" />
                  Report First Issue
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/student/issues/${issue.ticket_number || issue.id}`}
                className="block group"
              >
                <Card className="h-full border-slate-200 group-hover:border-primary/50 group-hover:shadow-md transition-all">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {issue.ticket_number}
                        </span>
                        <StatusBadge status={issue.status} />
                      </div>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
                      {issue.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 line-clamp-2">
                      {issue.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatLocationString(issue.location)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
