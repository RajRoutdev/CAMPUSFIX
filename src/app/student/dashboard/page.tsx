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
  Inbox,
  Filter,
  RefreshCw,
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
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const fetchIssues = async () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const totalCount = issues.length;
  const openCount = issues.filter((i) => i.status === 'NEW' || i.status === 'ASSIGNED').length;
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount = issues.filter(
    (i) => i.status === 'RESOLUTION_SUBMITTED' || i.status === 'VERIFIED' || i.status === 'CLOSED'
  ).length;

  const filteredIssues = issues.filter((i) => {
    if (filter === 'ACTIVE') {
      return i.status === 'NEW' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS';
    }
    if (filter === 'RESOLVED') {
      return i.status === 'RESOLUTION_SUBMITTED' || i.status === 'VERIFIED' || i.status === 'CLOSED';
    }
    return true;
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header with CTA - Mobile friendly stacked or row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 sm:pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Student Portal
            </h1>
            <Badge variant="info" className="text-xs font-semibold">
              Student Access
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Report facility faults with a single photo, track technician repairs in real time, and follow existing tickets.
          </p>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <Link href="/student/report" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2 shadow-sm font-semibold text-sm bg-primary hover:bg-primary/95 text-white h-10 px-5">
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIssues}
            disabled={loading}
            className="h-10 px-3 text-slate-600 hover:text-slate-900"
            aria-label="Refresh student issues"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500">Total Reported</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" /> All-time submissions
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-amber-300 transition-colors shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-amber-700">Open / Pending</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{openCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Assigned or pending
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-blue-300 transition-colors shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-blue-700">In Progress</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{inProgressCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-500" /> Technician on-site
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-emerald-300 transition-colors shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-emerald-700">Resolved</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{resolvedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified &amp; closed
          </CardContent>
        </Card>
      </div>

      {/* Ticket List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Reported Issues</h2>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {filteredIssues.length} of {issues.length}
            </Badge>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('ACTIVE')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filter === 'ACTIVE'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({openCount + inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('RESOLVED')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filter === 'RESOLVED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true" aria-label="Loading your tickets...">
            <span className="sr-only">Loading your tickets...</span>
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} className="border-slate-200 animate-pulse p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-20 bg-slate-200 rounded" />
                  <div className="h-5 w-16 bg-slate-200 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <Card className="border-slate-200 border-dashed bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800">
                  {filter === 'ALL'
                    ? 'No issues found. Your campus is looking good!'
                    : filter === 'ACTIVE'
                    ? 'No active issues in your queue.'
                    : 'No resolved tickets found.'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Notice a broken ceiling fan, leaking washroom tap, or projector failure? Report it here for swift resolution.
                </p>
              </div>
              <Link href="/student/report">
                <Button size="sm" className="gap-1.5 mt-2 bg-primary hover:bg-primary/95 text-white">
                  <PlusCircle className="w-4 h-4" />
                  Report Issue Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/student/issues/${issue.ticket_number || issue.id}`}
                className="block group"
              >
                <Card className="h-full border-slate-200 group-hover:border-primary/50 group-hover:shadow-md transition-all duration-200">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {issue.ticket_number}
                        </span>
                        <StatusBadge status={issue.status} />
                      </div>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1 text-slate-900 font-bold">
                      {issue.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{formatLocationString(issue.location)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(issue.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
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
