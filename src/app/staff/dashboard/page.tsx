import { Wrench, CheckCircle, Clock, AlertTriangle, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function StaffDashboardPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Operations Portal</h1>
            <Badge variant="warning">Staff Role</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Department work orders, task assignments, and resolution submission.
          </p>
        </div>
      </div>

      <Alert variant="info">
        <Layers className="w-4 h-4" />
        <AlertTitle className="text-xs font-semibold">Phase 1 Foundation Active</AlertTitle>
        <AlertDescription className="text-xs mt-1">
          Staff RLS policies enforce that technicians can only view tickets routed to their department or assigned to their user ID.
          Interactive status transitions and resolution photo upload will be implemented in <strong>Phase 4</strong>.
        </AlertDescription>
      </Alert>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Assigned Work</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" /> Direct assignments
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Department Queue</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Unclaimed tickets
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">High / Critical</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Urgent attention
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Resolved This Week</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Proof submitted
          </CardContent>
        </Card>
      </div>

      {/* Task Queue Shell */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Department Work Orders</CardTitle>
          <CardDescription className="text-xs">
            Queue filtered by your college and department permission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-slate-500 text-xs">
            No active work orders pending. All equipment operational.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
