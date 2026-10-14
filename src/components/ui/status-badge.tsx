import React from 'react';
import { IssueStatus } from '@/types/models';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  UserCheck,
  Wrench,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface StatusBadgeProps {
  status: IssueStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case 'NEW':
      return (
        <Badge variant="outline" className={`bg-slate-100 text-slate-700 border-slate-300 gap-1 font-medium ${className || ''}`}>
          <Sparkles className="w-3 h-3 text-slate-500" />
          New
        </Badge>
      );
    case 'ASSIGNED':
      return (
        <Badge variant="info" className={`gap-1 font-medium ${className || ''}`}>
          <UserCheck className="w-3 h-3 text-blue-600" />
          Assigned
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="warning" className={`gap-1 font-medium ${className || ''}`}>
          <Wrench className="w-3 h-3 text-amber-600" />
          In Progress
        </Badge>
      );
    case 'RESOLUTION_SUBMITTED':
      return (
        <Badge variant="secondary" className={`bg-purple-100 text-purple-800 border-purple-200 gap-1 font-medium ${className || ''}`}>
          <FileCheck className="w-3 h-3 text-purple-600" />
          Resolution Submitted
        </Badge>
      );
    case 'VERIFIED':
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className || ''}`}>
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Verified
        </Badge>
      );
    case 'CLOSED':
      return (
        <Badge variant="outline" className={`bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 font-medium ${className || ''}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Closed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}
