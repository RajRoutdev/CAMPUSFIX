'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck,
  User,
  Wrench,
  Building,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations, Department, Profile } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';
import { DEMO_ACCOUNTS } from '@/lib/auth/demo-accounts';

export default function AdminIssueDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [issue, setIssue] = useState<IssueWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campus configuration data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<(Profile & { departmentName?: string })[]>([]);

  // Admin action state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCampusData = async () => {
    try {
      const [deptRes, staffRes] = await Promise.all([
        fetch('/api/campus/departments'),
        fetch('/api/campus/staff'),
      ]);
      if (deptRes.ok) {
        const dData = await deptRes.json();
        if (Array.isArray(dData.departments)) setDepartments(dData.departments);
      }
      if (staffRes.ok) {
        const sData = await staffRes.json();
        if (Array.isArray(sData.staff)) setStaffList(sData.staff);
      }
    } catch {
      // Fallback
    }
  };

  const fetchIssue = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/issues/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Ticket not found or cross-college access forbidden');
      }
      const data = await res.json();
      setIssue(data.issue);
      if (data.issue?.assigned_to) {
        setSelectedStaffId(data.issue.assigned_to);
      }
      if (data.issue?.department_id) {
        setSelectedDepartmentId(data.issue.department_id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load ticket';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
    fetchCampusData();
  }, [id]);

  // Admin Verification Action (transitions RESOLUTION_SUBMITTED -> VERIFIED)
  const handleVerifyResolution = async () => {
    if (!issue) return;
    setUpdatingStatus(true);
    setActionMessage(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'VERIFIED',
          notes: 'Campus administrator inspected photo evidence and verified physical repair completion.',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to verify resolution');
      }

      setActionMessage('Resolution successfully verified.');
      await fetchIssue();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Admin Close Action (transitions VERIFIED -> CLOSED)
  const handleCloseIssue = async () => {
    if (!issue) return;
    setUpdatingStatus(true);
    setActionMessage(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
          notes: 'Work order officially closed and archived in college maintenance ledger.',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to close ticket');
      }

      setActionMessage('Ticket officially marked CLOSED.');
      await fetchIssue();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Close action failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Admin Assignment Action
  const handleAssignStaff = async () => {
    if (!issue) return;
    setAssigning(true);
    setActionMessage(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/assignment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: selectedStaffId || null,
          department_id: selectedDepartmentId || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update department or staff assignment');
      }

      setActionMessage('Department routing and staff assignment updated.');
      await fetchIssue();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Assignment update failed');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading issue inspector...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Issue Unavailable</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to locate ticket or cross-college access forbidden.'}</p>
        <Link href="/admin/issues">
          <Button variant="outline" size="sm" className="gap-1.5 mt-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Issues
          </Button>
        </Link>
      </div>
    );
  }

  const originalImage = issue.images?.find((img) => img.image_type === 'original') || issue.images?.[0];
  const resolutionImage = issue.images?.find((img) => img.image_type === 'resolution');
  const activityLogs = issue.activity_logs || [];
  const staffAccounts = DEMO_ACCOUNTS.filter((a) => a.role === 'staff');
  const displayStaff = staffList.length > 0 ? staffList : staffAccounts;

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link
          href="/admin/issues"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issue List
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
            {issue.ticket_number}
          </span>
          <StatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Evidence comparison & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Side-by-Side Photographic Evidence Comparison */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/70 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Resolution Evidence Comparison
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">Original vs. Repaired</span>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left: Original Reported Photo */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    1. Reported Issue (Before)
                  </span>
                  {originalImage ? (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={originalImage.image_url}
                        alt="Original report"
                        className="max-h-full object-contain mx-auto"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px]">
                        Student Upload
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      No original image
                    </div>
                  )}
                </div>

                {/* Right: Resolution Evidence Photo */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    2. Physical Resolution (After)
                  </span>
                  {resolutionImage ? (
                    <div className="rounded-lg overflow-hidden border border-emerald-300 bg-slate-900 aspect-video flex items-center justify-center relative ring-2 ring-emerald-500/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolutionImage.image_url}
                        alt="Completed repair"
                        className="max-h-full object-contain mx-auto"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">
                        Technician Proof
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                      <Clock className="w-5 h-5 text-slate-300 mb-1" />
                      <span>Resolution evidence pending technician completion</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Metadata Card */}
          <Card className="border-slate-200">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>{issue.category}</span>
                <span>&bull;</span>
                <span>{formatLocationString(issue.location)}</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {issue.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 pt-2 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">Description</span>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed">
                  {issue.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Location</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {issue.location?.room || 'Room unassigned'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {issue.location?.building}, {issue.location?.floor}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Reported Date</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log Audit Trail */}
          <Card className="border-slate-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Ticket Activity History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
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

        {/* Right Column: Admin Management Controls */}
        <div className="space-y-6">
          {/* Action 1: Verify Resolution */}
          {issue.status === 'RESOLUTION_SUBMITTED' && (
            <Card className="border-purple-300 bg-purple-50/20 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <Badge variant="secondary" className="w-fit mb-1 bg-purple-100 text-purple-800">
                  Awaiting Verification
                </Badge>
                <CardTitle className="text-base text-slate-900">Verify Resolution</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Confirm physical repair evidence meets campus standards.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Button
                  onClick={handleVerifyResolution}
                  disabled={updatingStatus}
                  className="w-full font-semibold gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Verify Resolution Proof
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action 2: Close Ticket */}
          {issue.status === 'VERIFIED' && (
            <Card className="border-emerald-300 bg-emerald-50/20 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <Badge variant="success" className="w-fit mb-1">
                  Verified by Admin
                </Badge>
                <CardTitle className="text-base text-slate-900">Close Ticket</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Officially close work order and record into historical campus analytics.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Button
                  onClick={handleCloseIssue}
                  disabled={updatingStatus}
                  className="w-full font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Closing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Close Work Order Officially
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assignment & Department Routing Panel (Feature 7) */}
          <Card className="border-slate-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                Department & Staff Routing
              </CardTitle>
              <CardDescription className="text-xs">
                Correct department routing or assign a technician.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {/* Department Assignment / Correction */}
              <div className="space-y-1">
                <Label htmlFor="assigned-department" className="text-xs text-slate-600">
                  Assigned Department
                </Label>
                <select
                  id="assigned-department"
                  aria-label="Assign department to ticket"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none"
                >
                  <option value="">No Department Assigned</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technician Assignment */}
              <div className="space-y-1">
                <Label htmlFor="assignee" className="text-xs text-slate-600">
                  Assigned Technician
                </Label>
                <select
                  id="assignee"
                  aria-label="Assign technician to ticket"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none"
                >
                  <option value="">Unassigned (Department Queue)</option>
                  {displayStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.departmentName || ('designation' in staff ? staff.designation : '') || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAssignStaff}
                disabled={assigning}
                className="w-full text-xs"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Routing & Assignment'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
