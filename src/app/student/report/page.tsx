'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  MapPin,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PREDEFINED_LOCATIONS, formatLocationString } from '@/lib/locations/data';
import { AnalyzeResult } from '@/lib/gemini/schema';
import type { DuplicateCandidate } from '@/lib/duplicates/detector';

export default function StudentReportPage() {
  const router = useRouter();

  // Form State
  const [selectedLocationId, setSelectedLocationId] = useState(PREDEFINED_LOCATIONS[0].id);
  const [studentDescription, setStudentDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');

  // Workflow State
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [followingTicket, setFollowingTicket] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);
  const [potentialDuplicate, setPotentialDuplicate] = useState<DuplicateCandidate | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields in review step
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableCategory, setEditableCategory] = useState('');
  const [editableSeverity, setEditableSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size exceeds 5MB limit');
        return;
      }
      setImageFileName(file.name);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFileName('');
  };

  // Step 1 -> Step 2: Trigger AI Analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      setError('Please take or upload a photo of the issue');
      return;
    }

    setAnalyzing(true);
    setError(null);

    const locationObj = PREDEFINED_LOCATIONS.find((l) => l.id === selectedLocationId);
    const locationText = locationObj ? formatLocationString(locationObj) : '';

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: studentDescription,
          locationText,
          imageFileName,
          imageData: imagePreview,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI analysis request failed');
      }

      const data: AnalyzeResult = await res.json();
      setAnalysisResult(data);
      setEditableTitle(data.issue_title);
      setEditableDescription(data.description);
      setEditableCategory(data.category);
      setEditableSeverity(data.severity);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(`${msg}. You can retry or proceed with manual entry.`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualEntry = () => {
    const fallbackTitle = studentDescription ? studentDescription.slice(0, 45) : 'Campus Facility Issue';
    setAnalysisResult({
      issue_title: fallbackTitle,
      category: 'Other',
      severity: 'medium',
      department: 'Maintenance',
      description: studentDescription || 'Reported facility problem requiring staff inspection.',
      safety_risk: false,
      evidence: ['Directly observed and reported by student'],
      is_fallback: true,
      provider: 'fallback-diagnostics',
    });
    setEditableTitle(fallbackTitle);
    setEditableDescription(studentDescription || '');
    setEditableCategory('Other');
    setEditableSeverity('medium');
    setError(null);
  };

  // Execute actual issue creation in API
  const executeCreateTicket = async (matchLink?: {
    matched_issue_id: string;
    match_score: number;
    match_reason: string;
  }) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        title: editableTitle,
        description: editableDescription,
        category: editableCategory,
        severity: editableSeverity,
        location_id: selectedLocationId,
        image_url: imagePreview,
        evidence: analysisResult?.evidence || [],
      };

      if (matchLink) {
        payload.matched_issue_id = matchLink.matched_issue_id;
        payload.match_score = matchLink.match_score;
        payload.match_reason = matchLink.match_reason;
      }

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      const ticketRef = data.issue.ticket_number || data.issue.id;
      router.push(`/student/issues/${ticketRef}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
      setSubmitting(false);
    }
  };

  // Step 2 -> Submit: First perform duplicate detection
  const handleSubmitTicket = async () => {
    if (!editableTitle.trim()) {
      setError('Issue title cannot be blank');
      return;
    }

    setDuplicateChecking(true);
    setError(null);

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: selectedLocationId,
          category: editableCategory,
          title: editableTitle,
          description: editableDescription,
          threshold: 0.80,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.has_match && data.match) {
          setPotentialDuplicate(data.match);
          setShowDuplicateModal(true);
          setDuplicateChecking(false);
          return;
        }
      }
    } catch (checkErr) {
      // Graceful fallback: If duplicate detection fails, user can still submit
      console.warn('Duplicate detection call failed, proceeding to submit directly', checkErr);
    } finally {
      setDuplicateChecking(false);
    }

    // No duplicate found or duplicate check errored: proceed directly
    await executeCreateTicket();
  };

  // User decision: Follow Existing Issue
  const handleFollowExistingIssue = async () => {
    if (!potentialDuplicate) return;
    setFollowingTicket(true);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${potentialDuplicate.ticket_number}/follow`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to subscribe to ticket');
      }

      router.push(`/student/issues/${potentialDuplicate.ticket_number}?subscribed=true`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to follow issue';
      setError(msg);
      setFollowingTicket(false);
    }
  };

  // User decision: Create New Report Anyway
  const handleCreateAnyway = async () => {
    if (!potentialDuplicate) return;
    setShowDuplicateModal(false);
    await executeCreateTicket({
      matched_issue_id: potentialDuplicate.issue_id,
      match_score: potentialDuplicate.score,
      match_reason: potentialDuplicate.reasons.join('; '),
    });
  };

  const currentLocation = PREDEFINED_LOCATIONS.find((l) => l.id === selectedLocationId);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <AlertTitle className="text-xs font-semibold">Analysis Notice</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualEntry}
                className="h-7 text-xs bg-white text-slate-800 border-slate-300"
              >
                Proceed with Manual Details
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* STEP 1: INITIAL REPORTING FORM */}
      {!analysisResult ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                1
              </span>
              <CardTitle className="text-xl">Report a Campus Issue</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Upload a photo and location. Our AI assistant will automatically classify the category, department, and severity for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form id="report-form" onSubmit={handleAnalyze} className="space-y-6">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Photo of Issue <span className="text-rose-500">*</span>
                </Label>

                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Issue preview"
                      className="max-h-full object-contain mx-auto"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors shadow"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-[11px] font-medium backdrop-blur">
                      {imageFileName || 'Selected photo'}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="issue-photo-input"
                    className="border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-blue-50/30 rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50"
                  >
                    <input
                      id="issue-photo-input"
                      aria-label="Upload photo of campus issue"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Take a photo or upload from device
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      JPEG, PNG, or WebP &bull; Max 5MB
                    </p>
                    <Button type="button" variant="outline" size="sm" className="mt-4 gap-1.5 pointer-events-none">
                      <Upload className="w-3.5 h-3.5" />
                      Browse Files
                    </Button>
                  </label>
                )}
              </div>

              {/* Location Selector */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-semibold text-slate-700">
                  Campus Location <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="location"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  >
                    {PREDEFINED_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.building} &bull; {loc.floor} &bull; {loc.room} {loc.area ? `(${loc.area})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select where on campus the problem is located.
                </p>
              </div>

              {/* Optional Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="desc" className="text-xs font-semibold text-slate-700">
                    Additional Details (Optional)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Helps AI understand context</span>
                </div>
                <Textarea
                  id="desc"
                  placeholder="e.g., The ceiling fan is making screeching noises and blades are vibrating..."
                  value={studentDescription}
                  onChange={(e) => setStudentDescription(e.target.value)}
                  className="text-sm min-h-[90px]"
                />
              </div>

              {/* AI Auto-Structure Banner */}
              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">AI Auto-Classification:</span> You do not need to manually select category, severity, or department. AI will suggest these for your review on the next screen.
                </div>
              </div>

              <Button
                type="submit"
                disabled={analyzing || !imagePreview}
                className="w-full font-semibold gap-2 shadow-sm"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Analyzing Photo & Location...
                  </>
                ) : (
                  <>
                    Analyze Issue with AI
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : showDuplicateModal && potentialDuplicate ? (
        /* POTENTIAL DUPLICATE DETECTED VIEW */
        <Card className="border-amber-300 shadow-md bg-amber-50/20">
          <CardHeader className="border-b border-amber-100 bg-amber-50/50 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="warning" className="gap-1.5 text-xs py-1 px-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Potential Duplicate Issue Detected
              </Badge>
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                {potentialDuplicate.percentage}% Match
              </span>
            </div>
            <CardTitle className="text-xl text-slate-900 mt-2">
              Similar Issue Already Exists
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              CampusFix identified an active ticket reported for this location and equipment.
              To avoid duplicate tickets, you can follow this ticket to get live resolution updates, or file a separate report.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* Existing Ticket Summary Card */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {potentialDuplicate.ticket_number}
                  </span>
                  <StatusBadge status={potentialDuplicate.status} />
                </div>
                <SeverityBadge severity={potentialDuplicate.severity} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {potentialDuplicate.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {potentialDuplicate.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{potentialDuplicate.location_label}</span>
              </div>
            </div>

            {/* Match Scoring & Reasons Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Why CampusFix flagged this match:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-white border border-slate-200 text-xs flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    40%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Location Signal</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.location.reason}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-white border border-slate-200 text-xs flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    25%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Category Signal</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.category.reason}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-white border border-slate-200 text-xs flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    25%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Semantic Signal</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.semantic.reason}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-white border border-slate-200 text-xs flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    10%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Time Proximity</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.time.reason}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900">
              <strong>Transparent Policy:</strong> CampusFix never silently merges or suppresses your report. You can subscribe to the active repair work order, or file this as a separate ticket.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t bg-slate-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDuplicateModal(false)}
              className="w-full sm:w-auto text-xs"
            >
              Back &amp; Edit Report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateAnyway}
              disabled={submitting}
              className="w-full sm:w-auto text-xs border-slate-300"
            >
              {submitting ? 'Creating Ticket...' : 'Create New Report Anyway'}
            </Button>
            <Button
              type="button"
              onClick={handleFollowExistingIssue}
              disabled={followingTicket}
              className="w-full sm:flex-1 font-semibold text-sm gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {followingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subscribing to Updates...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Follow Existing Ticket ({potentialDuplicate.ticket_number})
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* STEP 2: REVIEW & EDIT AI SUGGESTIONS */
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <CardTitle className="text-lg">Review AI Suggestions</CardTitle>
              </div>
              {analysisResult.is_fallback ? (
                <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-800 border-amber-200 text-xs">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Diagnostic Fallback
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Gemini 1.5 Analysis
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Verify the suggested fields below. You can edit any field before official ticket creation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Transparent Fallback Notice if live Gemini is offline */}
            {analysisResult.is_fallback && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Demo Diagnostics Active:</span> Live Gemini key is offline or unconfigured. Diagnostic fallback generated these suggestions. All fields remain fully editable below.
                </div>
              </div>
            )}
            {/* Safety Risk Alert if flagged */}
            {analysisResult.safety_risk && (
              <Alert variant="destructive">
                <ShieldAlert className="w-4 h-4" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">Safety Risk Flagged</AlertTitle>
                <AlertDescription className="text-xs">
                  This report contains potential hazards requiring immediate technician priority.
                </AlertDescription>
              </Alert>
            )}

            {/* Editable Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-title" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-slate-400" />
                  Issue Title
                </Label>
                <span className="text-[11px] text-muted-foreground">AI suggested &bull; Editable</span>
              </div>
              <Input
                id="edit-title"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="font-medium text-sm"
                required
              />
            </div>

            {/* Classification Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Category
                </span>
                <Badge variant="outline" className="font-medium text-xs bg-white">
                  {editableCategory}
                </Badge>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Severity
                </span>
                <SeverityBadge severity={editableSeverity} />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Department Route
                </span>
                <span className="text-xs font-semibold text-slate-800 block">
                  {analysisResult.department}
                </span>
              </div>
            </div>

            {/* Location Display */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 block">Location</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{formatLocationString(currentLocation)}</span>
              </div>
            </div>

            {/* Editable Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-desc" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-slate-400" />
                  Description
                </Label>
                <span className="text-[11px] text-muted-foreground">Editable</span>
              </div>
              <Textarea
                id="edit-desc"
                value={editableDescription}
                onChange={(e) => setEditableDescription(e.target.value)}
                className="text-sm min-h-[90px]"
                required
              />
            </div>

            {/* AI Evidence Statements */}
            {analysisResult.evidence && analysisResult.evidence.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Observable Evidence Identified by AI:
                </span>
                <ul className="space-y-1.5">
                  {analysisResult.evidence.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t bg-slate-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnalysisResult(null)}
              className="w-full sm:w-auto text-xs"
            >
              Modify Photo / Location
            </Button>
            <Button
              type="button"
              onClick={handleSubmitTicket}
              disabled={submitting || duplicateChecking}
              className="w-full sm:flex-1 font-semibold text-sm gap-2"
            >
              {duplicateChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking for Duplicates...
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Submit Ticket
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
