'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  User,
  Wrench,
  Camera,
  Upload,
  PlayCircle,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export default function StaffIssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [issue, setIssue] = useState<IssueWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolution Form State
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImage, setResolutionImage] = useState<string | null>(null);
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [startingWork, setStartingWork] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchIssue = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/issues/${id}`);
      if (!res.ok) {
        throw new Error('Ticket not found or access forbidden');
      }
      const data = await res.json();
      setIssue(data.issue);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load ticket';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  // Handle Photo selection for resolution
  const handleResolutionPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Resolution image must be under 5MB');
        return;
      }
      setFormError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Action: Start Work (transitions to IN_PROGRESS)
  const handleStartWork = async () => {
    if (!issue) return;
    setStartingWork(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          notes: 'Technician arrived on-site and commenced repair operations.',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to start work');
      }

      await fetchIssue();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error starting work');
    } finally {
      setStartingWork(false);
    }
  };

  // Action: Submit Resolution
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;

    if (!resolutionNotes.trim()) {
      setFormError('Please enter detailed resolution notes describing the repair performed.');
      return;
    }

    if (!resolutionImage) {
      setFormError('Photo evidence of the completed repair is required.');
      return;
    }

    setSubmittingResolution(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: resolutionNotes.trim(),
          image_url: resolutionImage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit resolution');
      }

      await fetchIssue();
      setResolutionNotes('');
      setResolutionImage(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit resolution');
    } finally {
      setSubmittingResolution(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading work order details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Work Order Unavailable</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to locate ticket or insufficient technician permissions.'}</p>
        <Link href="/staff/dashboard">
          <Button variant="outline" size="sm" className="gap-1.5 mt-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  const originalImage = issue.images?.find((img) => img.image_type === 'original') || issue.images?.[0];
  const resolutionImg = issue.images?.find((img) => img.image_type === 'resolution');
  const activityLogs = issue.activity_logs || [];

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link
          href="/staff/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Work Orders
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
            {issue.ticket_number}
          </span>
          <StatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Issue details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>{issue.category}</span>
                <span>&bull;</span>
                <span>{formatLocationString(issue.location)}</span>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 leading-snug">
                {issue.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 pt-2 space-y-4">
              {/* Photo Display */}
              {originalImage ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalImage.image_url}
                    alt="Original reported issue"
                    className="max-h-full object-contain mx-auto"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[11px]">
                    Student Reported Photo
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border rounded-lg text-xs text-slate-400">
                  No original photo attached
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">Report Description</span>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-line leading-relaxed">
                  {issue.description}
                </p>
              </div>

              {/* Location details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Location</span>
                  <div className="flex items-center gap-1 font-medium text-slate-800 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{issue.location?.room || 'Room unassigned'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {issue.location?.building}, {issue.location?.floor}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Reported At</span>
                  <div className="flex items-center gap-1 font-medium text-slate-800 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="border-slate-200">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Clock className="w-4 h-4 text-slate-500" />
                Work Order History &amp; Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="space-y-3">
                {activityLogs.map((log, idx) => (
                  <div key={log.id || idx} className="flex items-start gap-3 text-xs pb-3 border-b last:border-b-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{log.action}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {typeof (log.metadata as any)?.notes === 'string' && (
                        <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2 rounded border border-slate-100">
                          &quot;{(log.metadata as any).notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Work Order Actions */}
        <div className="space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Step 1: Start Work */}
          {(issue.status === 'ASSIGNED' || issue.status === 'NEW') && (
            <Card className="border-amber-300 bg-amber-50/20 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <Badge variant="warning" className="w-fit mb-1">
                  Ready for Execution
                </Badge>
                <CardTitle className="text-base text-slate-900">Start On-Site Work</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Acknowledge this work order to let dispatch know you are on-site repairing the issue.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Button
                  onClick={handleStartWork}
                  disabled={startingWork}
                  className="w-full font-semibold gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {startingWork ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Commencing Work...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Start Work Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Submit Resolution */}
          {issue.status === 'IN_PROGRESS' && (
            <Card className="border-purple-200 bg-purple-50/20 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <Badge variant="secondary" className="w-fit mb-1 bg-purple-100 text-purple-800 border-purple-200">
                  Work in Progress
                </Badge>
                <CardTitle className="text-base text-slate-900">Submit Resolution Proof</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Upload photographic evidence of completed repair work and notes for admin verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <form onSubmit={handleSubmitResolution} className="space-y-4">
                  {/* Photo Input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Repair Photo Proof <span className="text-rose-500">*</span>
                    </Label>

                    {resolutionImage ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolutionImage}
                          alt="Resolution preview"
                          className="max-h-full object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setResolutionImage(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors shadow text-xs"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-purple-400 hover:bg-purple-50/40 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-white text-center">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleResolutionPhotoChange}
                          className="hidden"
                          required
                        />
                        <Camera className="w-6 h-6 text-purple-600 mb-1" />
                        <span className="text-xs font-semibold text-slate-800">Take or upload repair photo</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Required for admin verification</span>
                      </label>
                    )}
                  </div>

                  {/* Notes Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="res-notes" className="text-xs font-semibold text-slate-700">
                      Work Completion Notes <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="res-notes"
                      placeholder="e.g., Replaced broken fan regulator, tightened loose blade brackets, and verified smooth rotation without vibration."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="text-xs min-h-[90px]"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingResolution || !resolutionImage}
                    className="w-full font-semibold gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {submittingResolution ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Evidence...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Resolution for Verification
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Verified or Closed State */}
          {(issue.status === 'RESOLUTION_SUBMITTED' ||
            issue.status === 'VERIFIED' ||
            issue.status === 'CLOSED') && (
            <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <Badge variant="success" className="w-fit mb-1">
                  {issue.status === 'RESOLUTION_SUBMITTED'
                    ? 'Awaiting Admin Verification'
                    : issue.status === 'VERIFIED'
                    ? 'Verified by Administrator'
                    : 'Ticket Closed'}
                </Badge>
                <CardTitle className="text-base text-slate-900">Resolution Evidence</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                {resolutionImg ? (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolutionImg.image_url}
                      alt="Completed repair evidence"
                      className="max-h-full object-contain mx-auto"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[11px]">
                      Technician Repair Photo
                    </div>
                  </div>
                ) : null}

                <div className="p-3 bg-white border border-slate-200 rounded text-xs text-slate-700">
                  <span className="font-semibold block mb-0.5">Technician Resolution:</span>
                  Resolution proof submitted and forwarded to campus administrators for physical sign-off.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
