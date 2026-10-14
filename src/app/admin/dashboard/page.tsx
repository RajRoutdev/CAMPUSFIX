import { ShieldCheck, BarChart3, AlertTriangle, Users, Layers, Building } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function AdminDashboardPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campus Administrator Portal</h1>
            <Badge variant="destructive">Admin Access</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            College-wide issue routing, resolution verification, and campus intelligence.
          </p>
        </div>
      </div>

      <Alert variant="info">
        <Layers className="w-4 h-4" />
        <AlertTitle className="text-xs font-semibold">Phase 1 Foundation Active</AlertTitle>
        <AlertDescription className="text-xs mt-1">
          Multi-college tenant boundaries are enforced at the database layer. Admins can view and manage issues belonging exclusively to their college.
          Advanced issue management, verification controls, and analytics aggregation will be implemented in <strong>Phase 4 &amp; Phase 6</strong>.
        </AlertDescription>
      </Alert>

      {/* Metrics Shell */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Campus Issues</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Building className="w-3.5 h-3.5" /> Total college volume
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Pending Verification</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">0</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Awaiting admin review
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Departments</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">4</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" /> Active routing targets
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Campuses Configured</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">2</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Isolated tenants
          </CardContent>
        </Card>
      </div>

      {/* Management Shell */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Campus Operations Overview</CardTitle>
          <CardDescription className="text-xs">
            College operational log and verification queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-slate-500 text-xs">
            No issues requiring verification. Campus operations running smoothly.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
