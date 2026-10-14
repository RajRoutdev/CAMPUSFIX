'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  MapPin,
  Wrench,
  Flame,
  Layers,
  Calendar,
  AlertCircle,
  HelpCircle,
  Activity,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CampusAnalyticsResult } from '@/lib/analytics/engine';

interface InsightsResponse {
  success: boolean;
  insight: string;
  is_ai_generated: boolean;
  provider: string;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CampusAnalyticsResult | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, insightsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/insights'),
      ]);

      if (!analyticsRes.ok) {
        const errData = await analyticsRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch campus analytics');
      }

      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.analytics);

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading analytics intelligence';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating campus facilities intelligence &amp; running recurring pattern detection...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Card className="border-rose-200 bg-rose-50/20 max-w-lg mx-auto text-center p-6">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Unable to Load Intelligence</h2>
          <p className="text-xs text-slate-600 mt-1 mb-4">{error || 'Unknown error occurred while aggregating data.'}</p>
          <Button onClick={fetchAnalyticsData} size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const { summary, categories, departments, building_hotspots, room_hotspots, recurring_issues, trends } = analytics;
  const activePipeline = summary.open_issues + summary.in_progress_issues;
  const resolvedTotal = summary.verified_issues + summary.closed_issues;
  const resolutionRate = summary.total_issues > 0 ? Math.round((resolvedTotal / summary.total_issues) * 100) : 0;

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campus Intelligence &amp; Analytics</h1>
            <Badge variant="destructive" className="bg-blue-600 text-white">Phase 6 Engine</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic facility metrics, hotspot diagnostics, and recurring chronic failure detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/issues">
            <Button variant="outline" size="sm" className="gap-1.5">
              Manage Tickets
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Intelligence
          </Button>
        </div>
      </div>

      {/* AI Leadership Briefing / Executive Summary (Gemini Multimodal / Deterministic Fallback) */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-blue-50/30 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  AI Executive Facilities Briefing
                </CardTitle>
                <CardDescription className="text-xs text-indigo-700/80">
                  Deterministic database aggregation synthesized by server-side Gemini 1.5 Flash
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/80 text-indigo-900 border-indigo-200 text-[11px] font-mono">
                {insights?.provider || 'verified-baseline-summary'}
              </Badge>
              {insights?.is_ai_generated ? (
                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                  Live AI Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] text-slate-600">
                  Deterministic Baseline
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-1">
          <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white/70 p-3.5 rounded-lg border border-indigo-100 shadow-sm">
            &ldquo;{insights?.insight || 'Analysis in progress. Evaluating campus hot-spots and repeated maintenance requests...'}&rdquo;
          </p>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Strict Rule 25 compliant: AI assists with executive phrasing; deterministic database queries supply all numerical facts.</span>
          </p>
        </CardContent>
      </Card>

      {/* KPI Cards Row 1: High-Level Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-slate-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500">Total Campus Reports</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">{summary.total_issues}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-500" /> Across all departments &amp; blocks
          </CardContent>
        </Card>

        <Card className="hover:border-amber-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-amber-700">Active Work Pipeline</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{activePipeline}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-600 flex items-center gap-2">
            <span>{summary.open_issues} New/Assigned</span>
            <span>&bull;</span>
            <span>{summary.in_progress_issues} In Progress</span>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-emerald-700">Avg Resolution Speed</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{summary.average_resolution_hours} hrs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" /> {resolvedTotal} tickets resolved ({resolutionRate}%)
          </CardContent>
        </Card>

        <Card className="hover:border-rose-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-rose-700">Safety &amp; Critical Hazards</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">{summary.critical_issues}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> {summary.high_priority_issues} high or critical priority
          </CardContent>
        </Card>
      </div>

      {/* RECURRING ISSUE DETECTION (PRD Section 22 / Phase 6 Core Feature) */}
      <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Recurring Issue Detection &amp; Chronic Failures
                </CardTitle>
                <CardDescription className="text-xs text-amber-800">
                  Automated cluster detection flags locations experiencing repeated failures (&ge; 2 complaints)
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-900 bg-amber-100 font-medium">
              {recurring_issues.length} Chronic Clusters Identified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-1 space-y-3">
          {recurring_issues.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              No chronic recurring failure patterns detected. All locations have isolated single-incident tickets.
            </div>
          ) : (
            recurring_issues.map((pattern) => (
              <div
                key={pattern.id}
                className="p-4 rounded-lg bg-white border border-amber-200 shadow-sm space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {pattern.location_label}
                    </span>
                    <Badge variant="outline" className="text-xs border-slate-300">
                      {pattern.category}
                    </Badge>
                    <Badge
                      className={
                        pattern.severity_level === 'HIGH_FREQUENCY'
                          ? 'bg-rose-600 text-white text-[10px]'
                          : 'bg-amber-600 text-white text-[10px]'
                      }
                    >
                      {pattern.count} Repeat Incidents
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Last incident: {new Date(pattern.last_reported).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <p className="text-xs text-slate-700">
                  <span className="font-medium text-slate-900">Root Cause Finding: </span>
                  {pattern.summary}
                </p>

                <div className="p-2.5 rounded bg-amber-50 border border-amber-100 text-xs text-amber-900 flex items-start gap-2">
                  <Wrench className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">Preventive Maintenance Recommendation: </span>
                    {pattern.recommendation}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="text-[11px] font-medium text-slate-700">Associated Tickets:</span>
                    <div className="flex flex-wrap gap-1">
                      {pattern.ticket_numbers.map((tn) => (
                        <Link
                          key={tn}
                          href={`/admin/issues/${tn}`}
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        >
                          {tn}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link href={`/admin/issues?search=${encodeURIComponent(pattern.room)}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-700 hover:text-amber-800 gap-1 p-1">
                      Inspect Cluster Tickets
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* DEPARTMENT WORKLOAD CAPACITY (2-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload */}
        <Card className="border-slate-200">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-bold text-slate-900">Department Workload Distribution</CardTitle>
              </div>
              <span className="text-xs text-slate-500">{departments.length} Operating Crews</span>
            </div>
            <CardDescription className="text-xs">
              Staff allocation, active queues, and resolution progress by maintenance division.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-4">
            {departments.map((dept) => (
              <div key={dept.department_name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">{dept.department_name}</span>
                  <span className="text-slate-500 font-mono">
                    {dept.total} tickets ({dept.percentage}%)
                  </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                  <div
                    style={{ width: `${dept.total > 0 ? (dept.resolved / dept.total) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Resolved: ${dept.resolved}`}
                  />
                  <div
                    style={{ width: `${dept.total > 0 ? (dept.in_progress / dept.total) * 100 : 0}%` }}
                    className="bg-amber-500 h-full"
                    title={`In Progress: ${dept.in_progress}`}
                  />
                  <div
                    style={{ width: `${dept.total > 0 ? (dept.open / dept.total) * 100 : 0}%` }}
                    className="bg-blue-500 h-full"
                    title={`Open / Queued: ${dept.open}`}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> {dept.open} Queued
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> {dept.in_progress} In Progress
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {dept.resolved} Resolved
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-slate-200">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-bold text-slate-900">Issue Category Breakdown</CardTitle>
              </div>
              <span className="text-xs text-slate-500">{categories.length} Categories</span>
            </div>
            <CardDescription className="text-xs">
              Proportion of facility problems across campus functional categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-3.5">
            {categories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">{cat.category}</span>
                  <span className="text-slate-500 font-mono">
                    {cat.count} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* BUILDING & ROOM HOTSPOTS (2-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Building Hotspots */}
        <Card className="border-slate-200">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-bold text-slate-900">Building Hotspot Ranking</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">Infrastructure Analysis</Badge>
            </div>
            <CardDescription className="text-xs">
              Campus buildings ordered by cumulative ticket volume and critical risk frequency.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="divide-y divide-slate-100">
              {building_hotspots.map((b, idx) => (
                <div key={b.building} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-700 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800">{b.building}</span>
                      {b.critical_count > 0 && (
                        <span className="ml-2 text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                          {b.critical_count} Safety Hazard{b.critical_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-900 font-bold">{b.issue_count} tickets</span>
                    <span className="text-slate-400">({b.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Room / Specific Area Hotspots */}
        <Card className="border-slate-200">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-bold text-slate-900">Specific Room / Area Hotspots</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">Room-level Detail</Badge>
            </div>
            <CardDescription className="text-xs">
              Classrooms, laboratories, and halls exhibiting repeated maintenance demands.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-1">
            <div className="divide-y divide-slate-100">
              {room_hotspots.slice(0, 6).map((r) => (
                <div key={r.location_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{r.room}</span>
                    <span className="text-slate-400 ml-1.5">({r.building})</span>
                    <div className="text-[11px] text-slate-500">
                      Primary Issue Type: <span className="text-slate-700 font-medium">{r.primary_category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={r.issue_count >= 3 ? 'destructive' : r.issue_count >= 2 ? 'warning' : 'outline'}>
                      {r.issue_count} ticket{r.issue_count > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHRONOLOGICAL ACTIVITY TRENDS */}
      <Card className="border-slate-200">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-bold text-slate-900">Recent Campus Issue Activity Trends</CardTitle>
            </div>
            <span className="text-xs text-slate-500">Intake vs. Resolution Throughput</span>
          </div>
          <CardDescription className="text-xs">
            Daily comparison of new reports filed versus completed maintenance tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {trends.map((t) => (
              <div key={t.date} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-center space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">{t.label}</span>
                <div className="text-[11px] space-y-0.5">
                  <div className="text-blue-600 font-mono font-medium">+{t.created} New</div>
                  <div className="text-emerald-600 font-mono font-medium">-{t.resolved} Closed</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
