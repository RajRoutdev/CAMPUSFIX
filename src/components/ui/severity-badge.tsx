import React from 'react';
import { IssueSeverity } from '@/types/models';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Flame } from 'lucide-react';

interface SeverityBadgeProps {
  severity: IssueSeverity | string;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return (
        <Badge variant="destructive" className={`gap-1 font-semibold uppercase tracking-wider text-[10px] ${className || ''}`}>
          <Flame className="w-3 h-3 text-white animate-pulse" />
          Critical
        </Badge>
      );
    case 'high':
      return (
        <Badge className={`bg-rose-100 text-rose-800 border-rose-200 gap-1 font-medium ${className || ''}`}>
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          High
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="warning" className={`gap-1 font-medium ${className || ''}`}>
          <AlertCircle className="w-3 h-3 text-amber-600" />
          Medium
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className || ''}`}>
          <Info className="w-3 h-3 text-emerald-600" />
          Low
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {severity}
        </Badge>
      );
  }
}
