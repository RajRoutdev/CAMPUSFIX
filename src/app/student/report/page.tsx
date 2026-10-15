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
  FileImage,
  Info,
  Clock,
  Layers,
  Check,
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
        setError('Image file size exceeds 5MB limit. Please select a smaller photo.');
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
      setError('Please take or upload a photo of the campus issue.');
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
      setError('Issue title cannot be blank.');
      return;
    }

    setDuplicateChecking(true);
    setError(null);

    try {
      const matchRes = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editableTitle,
          description: editableDescription,
          category: editableCategory,
          location_id: selectedLocationId,
        }),
      });

      if (matchRes.ok) {
        const matchData = await matchRes.json();
        const candidate = matchData.top_candidate || matchData.match || (matchData.candidates && matchData.candidates[0]);
        if (matchData.has_match && candidate) {
          setPotentialDuplicate(candidate);
          setShowDuplicateModal(true);
          setDuplicateChecking(false);
          return;
        }
      }
    } catch (checkErr) {
      // Per Rule: Duplicate service failure must not block reporting
    }

    setDuplicateChecking(false);
    await executeCreateTicket();
  };

  // User decision: Follow Existing Issue
  const handleFollowExistingIssue = async () => {
    if (!potentialDuplicate) return;
    setFollowingTicket(true);

    try {
      const res = await fetch(`/api/issues/${potentialDuplicate.ticket_number}/follow`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to follow existing issue');
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
    <div className="container max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb & Step Tracker */}
      <div className="space-y-4">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Student Dashboard
        </Link>

        {/* Visual Stepper */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-lg text-xs font-semibold">
          <div
            className={`flex items-center justify-center gap-2 py-1.5 rounded-md transition-all ${
              !analysisResult ? 'bg-white text-primary shadow-xs' : 'text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                !analysisResult ? 'bg-primary text-white' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {analysisResult ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span>Photo &amp; Location</span>
          </div>

          <div
            className={`flex items-center justify-center gap-2 py-1.5 rounded-md transition-all ${
              analysisResult ? 'bg-white text-primary shadow-xs' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                analysisResult ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </span>
            <span>AI Review &amp; Verify</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-rose-200 bg-rose-50/50">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <div className="flex-1 space-y-1">
            <AlertTitle className="text-xs font-bold">Action Notice</AlertTitle>
            <AlertDescription className="text-xs text-rose-700">{error}</AlertDescription>
            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualEntry}
                className="h-7 text-xs bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
              >
                Proceed with Manual Details
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* STEP 1: INITIAL REPORTING FORM */}
      {!analysisResult ? (
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
                1
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
                  Report a Campus Issue
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Upload a photo and location. Our AI assistant will automatically classify category, severity, and department.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <form id="report-form" onSubmit={handleAnalyze} className="space-y-6">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="issue-photo-input" className="text-xs font-semibold text-slate-700">
                    Photo of Issue <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">JPEG, PNG, WebP &bull; Max 5MB</span>
                </div>

                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Selected issue preview"
                      className="max-h-full object-contain mx-auto"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      title="Remove photo"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] font-mono backdrop-blur">
                      {imageFileName || 'Selected photo'}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 hover:border-primary/60 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all bg-slate-50/60 hover:bg-blue-50/20">
                    <input
                      id="issue-photo-input"
                      aria-label="Upload photo of campus issue"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    <div className="w-14 h-14 rounded-full bg-blue-100 text-primary flex items-center justify-center mb-3 shadow-xs">
                      <Camera className="w-7 h-7" />
                    </div>

                    <p className="text-sm font-bold text-slate-900 text-center">
                      Take a photo or upload from device
                    </p>
                    <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">
                      Capture the equipment, damage, or hazard clearly for accurate AI classification.
                    </p>

                    {/* Dual Mobile Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <label
                        htmlFor="issue-photo-input"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo / Browse
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Selector */}
              <div className="space-y-2">
                <Label htmlFor="location-select" className="text-xs font-semibold text-slate-700">
                  Campus Location <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="location-select"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-white pl-9 pr-3 text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
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
                  Pinpoints department crews to the exact classroom or laboratory.
                </p>
              </div>

              {/* Optional Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="student-desc" className="text-xs font-semibold text-slate-700">
                    Additional Context (Optional)
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    {studentDescription.length}/300 chars
                  </span>
                </div>
                <Textarea
                  id="student-desc"
                  placeholder="e.g., Ceiling fan vibrates violently at speeds above 3, rattling noises heard..."
                  value={studentDescription}
                  onChange={(e) => setStudentDescription(e.target.value.slice(0, 300))}
                  className="text-xs sm:text-sm min-h-[90px] resize-y"
                />
              </div>

              {/* Assistive AI Note */}
              <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">AI Automated Assistance:</span> You don&apos;t have to guess maintenance departments or severity codes. Gemini 1.5 will automatically structure them for your review.
                </div>
              </div>

              <Button
                type="submit"
                disabled={analyzing || !imagePreview}
                className="w-full h-11 font-semibold text-sm gap-2 shadow-sm bg-primary hover:bg-primary/95 text-white"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Analyzing Photo &amp; Location...
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
        /* STEP: DUPLICATE DETECTION TRANSPARENCY CARD */
        <Card className="border-amber-300 shadow-md bg-amber-50/25 overflow-hidden">
          <div className="h-1 bg-amber-500" />
          <CardHeader className="bg-amber-100/40 border-b border-amber-200/60 p-5 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                    Potential Duplicate Issue Detected
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-900">
                    A highly similar issue is already active for this room
                  </CardDescription>
                </div>
              </div>

              <Badge className="bg-amber-600 text-white text-xs font-bold">
                {Math.round(potentialDuplicate.score * 100)}% Match
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            {/* Existing Ticket Card */}
            <div className="p-3.5 rounded-lg bg-white border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {potentialDuplicate.ticket_number}
                  </span>
                  <StatusBadge status={potentialDuplicate.status} />
                </div>
                <span className="text-[11px] text-slate-400">Active Work Order</span>
              </div>

              <h3 className="font-bold text-sm text-slate-900">{potentialDuplicate.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{potentialDuplicate.description}</p>
            </div>

            {/* 4-Factor Weighted Breakdown Cards */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Why CampusFix flagged this match:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-start gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    40%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Location Signal</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.location.reason}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-start gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    25%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Category Signal</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.category.reason}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-start gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    25%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Semantic Signal</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.semantic.reason}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-start gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    10%
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Time Proximity</span>
                    <span className="text-slate-600 text-[11px]">{potentialDuplicate.breakdown.time.reason}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 leading-relaxed">
              <strong>Transparent Policy:</strong> CampusFix never silently merges or deletes your report. You can subscribe to the active repair work order, or file this as a distinct separate ticket.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t bg-slate-50/70 p-5">
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
              className="w-full sm:flex-1 font-semibold text-xs sm:text-sm gap-2 bg-amber-600 hover:bg-amber-700 text-white"
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
        <Card className="border-slate-200 shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  2
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
                  Review AI Suggestions
                </CardTitle>
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
            <CardDescription className="text-xs text-slate-500">
              Verify the suggested fields below. You can edit any field before official ticket creation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Automated Diagnostics Notice if live Gemini is offline */}
            {analysisResult.is_fallback && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Automated Facility Diagnostics:</span> Suggested classification generated from report context. All fields remain fully editable below.
                </div>
              </div>
            )}

            {/* Safety Risk Alert if flagged */}
            {analysisResult.safety_risk && (
              <Alert variant="destructive" className="border-rose-200 bg-rose-50/40">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Safety Risk Flagged
                </AlertTitle>
                <AlertDescription className="text-xs text-rose-700">
                  This report contains potential hazards requiring urgent technician attention.
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
                <Badge variant="outline" className="font-medium text-xs bg-white text-slate-800">
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
                  Assigned Crew
                </span>
                <span className="text-xs font-semibold text-slate-800 block">
                  {analysisResult.department}
                </span>
              </div>
            </div>

            {/* Location Display */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 block">Location</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
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
                className="text-xs sm:text-sm min-h-[90px]"
                required
              />
            </div>

            {/* AI Evidence Statements */}
            {analysisResult.evidence && analysisResult.evidence.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Observable Evidence Identified by AI:
                </span>
                <ul className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
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

          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t bg-slate-50/50 p-5">
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
              className="w-full sm:flex-1 font-semibold text-sm gap-2 h-10 bg-primary hover:bg-primary/95 text-white"
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
                  {'Confirm & Submit Ticket'}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
