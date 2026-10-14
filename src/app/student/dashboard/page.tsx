import Link from 'next/link';
import { PlusCircle, AlertCircle, Clock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function StudentDashboardPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Portal</h1>
            <Badge variant="info">Student Access</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Report campus issues, track your tickets, and review AI suggestions.
          </p>
        </div>

        <Link href="/student/report">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Summary Metrics Shell */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Total Reported</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> All time tickets
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Open / Pending</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Awaiting assignment
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">In Progress</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500" /> Technician working
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Resolved</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified & closed
          </CardContent>
        </Card>
      </div>

      {/* Tickets Shell */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Recent Tickets</CardTitle>
          <CardDescription className="text-xs">
            Issues submitted from your student account. Enforced by Supabase RLS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">No issues reported yet</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Spot a broken fan, leaking tap, or Wi-Fi outage? Report it to dispatch campus staff.
              </p>
            </div>
            <Link href="/student/report">
              <Button size="sm" variant="outline" className="gap-1.5 mt-2">
                <PlusCircle className="w-4 h-4" />
                Create First Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
