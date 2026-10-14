'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ArrowRight,
  MapPin,
  Calendar,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Building,
  User,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<IssueWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/issues?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load issues');
      }
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching issues';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssues();
    }, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, categoryFilter, search]);

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campus Issue Management</h1>
            <Badge variant="destructive">Admin Portal</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Search, triage, assign, and verify all issues across campus facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/analytics">
            <Button variant="default" size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <BarChart3 className="w-3.5 h-3.5" />
              Intelligence &amp; Analytics
            </Button>
          </Link>
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <Input
              placeholder="Search by ticket ID, title, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-white px-3 text-xs shadow-sm focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLUTION_SUBMITTED">Resolution Submitted</option>
            <option value="VERIFIED">Verified</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-white px-3 text-xs shadow-sm focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Furniture">Furniture</option>
            <option value="Cleanliness">Cleanliness</option>
            <option value="Internet/Network">Internet/Network</option>
          </select>
        </div>
      </div>

      {/* Issues Table / Cards */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Loading campus issues...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-rose-600 text-sm">{error}</div>
      ) : issues.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center space-y-2">
            <Building className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900">No Issues Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No tickets matched the current filter criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Ticket</th>
                <th className="p-3.5">Title &amp; Location</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned To</th>
                <th className="p-3.5 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((issue) => {
                const locationLabel = issue.location
                  ? formatLocationString(issue.location)
                  : 'Campus';

                return (
                  <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-bold text-primary">
                      {issue.ticket_number}
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">
                        {issue.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{locationLabel}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-medium text-slate-700">
                      {issue.category}
                    </td>

                    <td className="p-3.5">
                      <SeverityBadge severity={issue.severity} />
                    </td>

                    <td className="p-3.5">
                      <StatusBadge status={issue.status} />
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {issue.assignee?.name || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right pr-4">
                      <Link href={`/admin/issues/${issue.ticket_number}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          Manage
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
