'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Calendar,
  Filter,
  PlayCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export default function StaffDashboardPage() {
  const [issues, setIssues] = useState<IssueWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

      const res = await fetch(`/api/issues?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load work orders');
      }
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching tasks';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, categoryFilter]);

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle Quick Action: Start Work
  const handleStartWork = async (issueId: string) => {
    setActionLoading(issueId);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          notes: 'Technician accepted work order and commenced on-site diagnostic/repair.',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update status');
      }

      setActionFeedback({ type: 'success', message: 'Work commenced! Status updated to In Progress.' });
      await fetchIssues();
    } catch (err: unknown) {
      setActionFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setActionLoading(null);
    }
  };

  // Metrics calculation
  const assignedCount = issues.filter((i) => i.status === 'ASSIGNED').length;
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const criticalCount = issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length;
  const resolvedCount = issues.filter(
    (i) => i.status === 'RESOLUTION_SUBMITTED' || i.status === 'VERIFIED' || i.status === 'CLOSED'
  ).length;

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Operations Portal</h1>
            <Badge variant="warning">Technician Queue</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Assigned campus work orders, repair execution, and resolution proof submission.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchIssues()}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      {actionFeedback && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs hover:opacity-75 font-bold px-2 py-0.5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Assigned Work</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">{assignedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-blue-500" /> Awaiting start
          </CardContent>
        </Card>

        <Card className="hover:border-amber-300 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Active In-Progress</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{inProgressCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Under repair
          </CardContent>
        </Card>

        <Card className="hover:border-rose-300 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">High / Critical</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">{criticalCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Safety / Urgent
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Proof Submitted</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{resolvedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verification queue
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'All Tickets'
                : st === 'ASSIGNED'
                ? 'Assigned'
                : st === 'IN_PROGRESS'
                ? 'In Progress'
                : st === 'RESOLUTION_SUBMITTED'
                ? 'Proof Submitted'
                : 'Closed'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700 shrink-0">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded border border-slate-300 bg-white px-2 text-xs shadow-sm focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Furniture">Furniture</option>
            <option value="Cleanliness">Cleanliness</option>
            <option value="Internet/Network">Internet/Network</option>
          </select>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Loading department queue...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-sm">{error}</div>
        ) : issues.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-16 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-semibold text-slate-900">All Work Orders Handled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active tickets matching the current filter criteria. Campus facilities are fully operational.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => {
              const locationLabel = issue.location
                ? formatLocationString(issue.location)
                : 'Campus Location';
              const isAssigned = issue.status === 'ASSIGNED' || issue.status === 'NEW';
              const isInProgress = issue.status === 'IN_PROGRESS';

              return (
                <Card
                  key={issue.id}
                  className="border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {issue.ticket_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={issue.status} />
                        <SeverityBadge severity={issue.severity} />
                      </div>
                    </div>

                    <CardTitle className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {issue.title}
                    </CardTitle>

                    <CardDescription className="text-xs text-slate-600 line-clamp-2">
                      {issue.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{locationLabel}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t">
                      <span className="font-medium text-slate-600">{issue.category}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-3 border-t bg-slate-50/50 flex items-center justify-between gap-2">
                    {isAssigned && (
                      <Button
                        size="sm"
                        onClick={() => handleStartWork(issue.id)}
                        disabled={actionLoading === issue.id}
                        className="text-xs h-8 gap-1 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                      >
                        {actionLoading === issue.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlayCircle className="w-3.5 h-3.5" />
                        )}
                        Start Work
                      </Button>
                    )}

                    {isInProgress && (
                      <Link href={`/staff/issues/${issue.ticket_number}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full text-xs h-8 gap-1 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Submit Resolution
                        </Button>
                      </Link>
                    )}

                    {!isAssigned && !isInProgress && (
                      <Link href={`/staff/issues/${issue.ticket_number}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
                          View Work Order
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}

                    {isAssigned && (
                      <Link href={`/staff/issues/${issue.ticket_number}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-8">
                          Details
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
