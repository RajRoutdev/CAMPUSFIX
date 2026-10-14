'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Building,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export default function StudentIssueDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [issue, setIssue] = useState<IssueWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIssue() {
      if (!id) return;
      try {
        const res = await fetch(`/api/issues/${id}`);
        if (!res.ok) {
          throw new Error('Ticket not found');
        }
        const data = await res.json();
        setIssue(data.issue);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load ticket';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchIssue();
  }, [id]);

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Ticket Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to locate the requested issue ticket.'}</p>
        <Link href="/student/dashboard">
          <Button variant="outline" size="sm" className="gap-1.5 mt-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const originalImage = issue.images?.find((img) => img.image_type === 'original') || issue.images?.[0];
  const activityLogs = issue.activity_logs || [];

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
            {issue.ticket_number}
          </span>
          <StatusBadge status={issue.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {originalImage && (
              <div className="w-full bg-slate-900 aspect-video max-h-80 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage.image_url}
                  alt={issue.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-medium text-xs">
                  {issue.category}
                </Badge>
                <SeverityBadge severity={issue.severity} />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                {issue.title}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Reported on {new Date(issue.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Description
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>

              {/* Evidence from metadata if available */}
              {(() => {
                const meta = activityLogs[0]?.metadata as { evidence?: string[] } | null;
                const evidenceList = Array.isArray(meta?.evidence) ? meta.evidence : [];
                if (evidenceList.length === 0) return null;

                return (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Observable Evidence:
                    </span>
                    <ul className="space-y-1">
                      {evidenceList.map((ev: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Ticket Activity Timeline
              </CardTitle>
              <CardDescription className="text-xs">
                Traceable operational audit log for CF-{issue.ticket_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white" />
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {log.action === 'CREATED' && 'Issue reported by student and ticket logged.'}
                          {log.action === 'ASSIGNED' && 'Ticket routed to department technician.'}
                          {log.action === 'STARTED_WORK' && 'Technician started physical repairs.'}
                          {log.action === 'RESOLUTION_SUBMITTED' && 'Resolution evidence uploaded for verification.'}
                          {log.action === 'VERIFIED' && 'Admin verified work completion.'}
                          {log.action === 'CLOSED' && 'Issue officially completed and closed.'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white" />
                    <div className="text-xs text-slate-700 font-medium">
                      Ticket Created &bull; Awaiting Department Assignment
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Meta & Location Info) */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-800">
                    {formatLocationString(issue.location)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {issue.location?.area || 'Campus Area'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Building:</span>
                  <span className="font-medium text-slate-800">{issue.location?.building || 'Main'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Floor:</span>
                  <span className="font-medium text-slate-800">{issue.location?.floor || 'Floor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-medium text-slate-800">{issue.location?.room || 'Room'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Department Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Department:</span>
                <span className="font-semibold text-slate-800">
                  {issue.department?.name || issue.category || 'Maintenance'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <StatusBadge status={issue.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority Level:</span>
                <SeverityBadge severity={issue.severity} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
