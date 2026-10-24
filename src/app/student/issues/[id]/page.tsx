'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
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
  Check,
  Bell,
  Eye,
  Camera,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

function StudentIssueDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const isSubscribed = searchParams.get('subscribed') === 'true';

  const [issue, setIssue] = useState<IssueWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIssue() {
      if (!id) return;
      try {
        const res = await fetch(`/api/issues/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Ticket not found or cross-college access forbidden');
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
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-medium">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Ticket Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          {error || 'Unable to locate the requested issue ticket in your college repository.'}
        </p>
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
  const resolutionImage = issue.images?.find((img) => img.image_type === 'resolution');
  const activityLogs = issue.activity_logs || [];

  // Determine stage progression index (0: NEW, 1: ASSIGNED, 2: IN_PROGRESS, 3: RESOLUTION_SUBMITTED, 4: VERIFIED, 5: CLOSED)
  const getStageIndex = () => {
    switch (issue.status) {
      case 'NEW':
        return 0;
      case 'ASSIGNED':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'RESOLUTION_SUBMITTED':
        return 3;
      case 'VERIFIED':
        return 4;
      case 'CLOSED':
        return 5;
      default:
        return 0;
    }
  };

  const stageIndex = getStageIndex();
  const stages = [
    { label: 'Reported', index: 0 },
    { label: 'Assigned', index: 1 },
    { label: 'In Progress', index: 2 },
    { label: 'Resolution Submitted', index: 3 },
    { label: 'Verified & Closed', index: 4 },
  ];

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Follow / Subscription Success Alert */}
      {isSubscribed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-950">Subscribed to Updates</div>
            <p className="leading-relaxed">
              You are now tracking ticket <span className="font-mono font-bold">{issue.ticket_number}</span>. Instead of filing duplicate complaints, you will receive real-time updates as maintenance progresses.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
            {issue.ticket_number}
          </span>
          <StatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
        </div>
      </div>

      {/* Visual Lifecycle Stepper */}
      <Card className="border-slate-200 bg-white p-4 shadow-xs">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Resolution Lifecycle
        </div>
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {stages.map((stg) => {
            const isCompleted = stageIndex > stg.index || (stg.index === 4 && stageIndex >= 4);
            const isCurrent = stageIndex === stg.index || (stg.index === 4 && (stageIndex === 4 || stageIndex === 5));

            return (
              <div key={stg.label} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted && !isCurrent
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : stg.index + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium line-clamp-1 ${
                    isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {stg.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Details & Evidence) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Issue Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            {originalImage && (
              <div className="w-full bg-slate-950 aspect-video max-h-80 flex items-center justify-center overflow-hidden border-b border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage.image_url}
                  alt={issue.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <CardHeader className="p-5 sm:p-6 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-medium text-xs text-slate-800">
                  {issue.category}
                </Badge>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-600 font-medium">
                  {issue.department?.name || 'General Maintenance'}
                </span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {issue.title}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Reported on {new Date(issue.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Description
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>

              {/* AI Evidence Statements */}
              {(() => {
                const meta = activityLogs[0]?.metadata as { evidence?: string[] } | null;
                const evidenceList = Array.isArray(meta?.evidence) ? meta.evidence : [];
                if (evidenceList.length === 0) return null;

                return (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
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

          {/* Before & After Photo Comparison Card (If resolution evidence exists) */}
          {resolutionImage && (
            <Card className="border-purple-200 bg-purple-50/15 shadow-sm overflow-hidden">
              <div className="h-1 bg-purple-600" />
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Resolution Evidence Photo
                    </CardTitle>
                    <CardDescription className="text-xs text-purple-900">
                      Submitted by technician on work completion
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="relative rounded-lg overflow-hidden bg-slate-950 aspect-video max-h-72 border border-purple-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolutionImage.image_url}
                    alt="Resolution evidence"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 text-white text-[11px] font-mono backdrop-blur">
                    Physical Repair Evidence
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Ticket Activity Timeline
              </CardTitle>
              <CardDescription className="text-xs">
                Traceable operational audit log for {issue.ticket_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white" />
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {log.action === 'CREATED' && 'Issue reported by student and ticket logged.'}
                          {log.action === 'ASSIGNED' && 'Ticket routed to department technician.'}
                          {log.action === 'STARTED_WORK' && 'Technician started physical repairs.'}
                          {log.action === 'RESOLUTION_SUBMITTED' && 'Resolution evidence uploaded for administrative sign-off.'}
                          {log.action === 'VERIFIED' && 'Campus administrator verified work completion.'}
                          {log.action === 'CLOSED' && 'Issue officially completed and closed.'}
                          {log.action === 'SUBSCRIBED' && 'Student subscribed to follow resolution updates.'}
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

        {/* Right Column (Location & Assignment Details) */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900">
                    {formatLocationString(issue.location)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {issue.location?.area || 'Campus Facility'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Building:</span>
                  <span className="font-medium text-slate-900">{issue.location?.building || 'Main'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Floor:</span>
                  <span className="font-medium text-slate-900">{issue.location?.floor || 'Floor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-medium text-slate-900">{issue.location?.room || 'Room'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department & Assignment Card */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Assignment &amp; Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Department</span>
                  <span className="font-bold text-slate-900">{issue.department?.name || 'Facilities Maintenance'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Technician</span>
                  <span className="font-bold text-slate-900">
                    {issue.assignee?.name || 'Pending assignment'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function StudentIssueDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Loading ticket...</p>
        </div>
      }
    >
      <StudentIssueDetailContent />
    </Suspense>
  );
}
