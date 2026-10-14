import Link from 'next/link';
import { Camera, MapPin, ArrowLeft, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function StudentReportPlaceholderPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Report a Campus Issue</CardTitle>
          <CardDescription className="text-xs">
            Student reporting workflow foundation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="info">
            <Layers className="w-4 h-4" />
            <AlertTitle className="text-xs font-semibold">Phase 1 Foundation Active</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              Database schema, storage bucket <code>campusfix-images</code>, and RLS policies are set up.
              The full image upload, cascading location selector, and Gemini analysis flow will be unlocked in <strong>Phase 2</strong>.
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-2 bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">Photo & Location Staging Area</p>
            <p className="text-xs text-slate-500">
              Supabase Storage bucket <code>campusfix-images</code> ready for image ingestion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
