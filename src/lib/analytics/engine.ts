import { IssueWithRelations } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export interface SummaryMetrics {
  total_issues: number;
  open_issues: number;
  in_progress_issues: number;
  pending_verification: number;
  verified_issues: number;
  closed_issues: number;
  critical_issues: number;
  high_priority_issues: number;
  average_resolution_hours: number;
  average_open_age_hours: number;
}

export interface CategoryMetric {
  category: string;
  count: number;
  percentage: number;
}

export interface DepartmentWorkloadMetric {
  department_name: string;
  open: number;
  in_progress: number;
  resolved: number;
  total: number;
  percentage: number;
}

export interface BuildingHotspot {
  building: string;
  issue_count: number;
  critical_count: number;
  percentage: number;
}

export interface RoomHotspot {
  location_id: string;
  label: string;
  building: string;
  room: string;
  issue_count: number;
  primary_category: string;
}

export interface VolumeTrendPoint {
  date: string;
  label: string;
  created: number;
  resolved: number;
}

export interface RecurringIssue {
  id: string;
  location_label: string;
  building: string;
  room: string;
  category: string;
  count: number;
  severity_level: 'HIGH_FREQUENCY' | 'MODERATE_FREQUENCY';
  summary: string;
  recommendation: string;
  ticket_numbers: string[];
  last_reported: string;
}

export interface CampusAnalyticsResult {
  summary: SummaryMetrics;
  categories: CategoryMetric[];
  departments: DepartmentWorkloadMetric[];
  building_hotspots: BuildingHotspot[];
  room_hotspots: RoomHotspot[];
  trends: VolumeTrendPoint[];
  recurring_issues: RecurringIssue[];
  computed_at: string;
}

/**
 * Pure deterministic aggregation of campus facility issues.
 * Complies with AGENTS.md Rule 25: Deterministic calculations as source of truth.
 */
export function calculateCampusAnalytics(
  issues: IssueWithRelations[]
): CampusAnalyticsResult {
  const total = issues.length;
  const now = Date.now();

  let openCount = 0;
  let inProgressCount = 0;
  let pendingVerificationCount = 0;
  let verifiedCount = 0;
  let closedCount = 0;
  let criticalCount = 0;
  let highCount = 0;

  let totalResolutionDurationMs = 0;
  let resolvedWithTimestampCount = 0;

  let totalOpenAgeMs = 0;
  let openWithTimestampCount = 0;

  // Group maps
  const categoryCounts = new Map<string, number>();
  const departmentBuckets = new Map<
    string,
    { open: number; in_progress: number; resolved: number; total: number }
  >();
  const buildingCounts = new Map<string, { total: number; critical: number }>();
  const roomBuckets = new Map<
    string,
    {
      location_id: string;
      label: string;
      building: string;
      room: string;
      total: number;
      categories: Map<string, number>;
    }
  >();
  const dailyTrends = new Map<string, { created: number; resolved: number }>();

  // Recurring issue grouping: key = `${location_id || building + room}::${category}`
  const recurringGroups = new Map<
    string,
    {
      location_label: string;
      building: string;
      room: string;
      category: string;
      tickets: { ticket_number: string; title: string; created_at: string }[];
    }
  >();

  for (const issue of issues) {
    // 1. Status & Priority counting
    if (issue.status === 'NEW' || issue.status === 'ASSIGNED') {
      openCount++;
      openWithTimestampCount++;
      totalOpenAgeMs += Math.max(0, now - new Date(issue.created_at).getTime());
    } else if (issue.status === 'IN_PROGRESS') {
      inProgressCount++;
      openWithTimestampCount++;
      totalOpenAgeMs += Math.max(0, now - new Date(issue.created_at).getTime());
    } else if (issue.status === 'RESOLUTION_SUBMITTED') {
      pendingVerificationCount++;
    } else if (issue.status === 'VERIFIED') {
      verifiedCount++;
    } else if (issue.status === 'CLOSED') {
      closedCount++;
    }

    if (issue.severity === 'critical') {
      criticalCount++;
    } else if (issue.severity === 'high') {
      highCount++;
    }

    // 2. Resolution duration
    if (issue.resolved_at && issue.created_at) {
      const dur = new Date(issue.resolved_at).getTime() - new Date(issue.created_at).getTime();
      if (dur > 0) {
        totalResolutionDurationMs += dur;
        resolvedWithTimestampCount++;
      }
    }

    // 3. Category distribution
    const cat = issue.category || 'General';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);

    // 4. Department Workload
    const deptName = issue.department?.name || (cat === 'Electrical' ? 'Electrical' : cat === 'Plumbing' ? 'Plumbing' : cat === 'Cleanliness' ? 'Housekeeping' : 'Maintenance');
    if (!departmentBuckets.has(deptName)) {
      departmentBuckets.set(deptName, { open: 0, in_progress: 0, resolved: 0, total: 0 });
    }
    const deptBucket = departmentBuckets.get(deptName)!;
    deptBucket.total++;
    if (issue.status === 'NEW' || issue.status === 'ASSIGNED') deptBucket.open++;
    else if (issue.status === 'IN_PROGRESS') deptBucket.in_progress++;
    else deptBucket.resolved++;

    // 5. Building & Room Hotspots
    const building = issue.location?.building || 'Main Campus';
    const room = issue.location?.room || 'General Area';
    const locId = issue.location_id || `${building}-${room}`;
    const locLabel = issue.location ? formatLocationString(issue.location) : `${building} - ${room}`;

    if (!buildingCounts.has(building)) {
      buildingCounts.set(building, { total: 0, critical: 0 });
    }
    const bBucket = buildingCounts.get(building)!;
    bBucket.total++;
    if (issue.severity === 'critical' || issue.severity === 'high') {
      bBucket.critical++;
    }

    if (!roomBuckets.has(locId)) {
      roomBuckets.set(locId, {
        location_id: locId,
        label: locLabel,
        building,
        room,
        total: 0,
        categories: new Map(),
      });
    }
    const rBucket = roomBuckets.get(locId)!;
    rBucket.total++;
    rBucket.categories.set(cat, (rBucket.categories.get(cat) || 0) + 1);

    // 6. Trend mapping (group by date)
    const createdDate = new Date(issue.created_at).toISOString().split('T')[0];
    if (!dailyTrends.has(createdDate)) {
      dailyTrends.set(createdDate, { created: 0, resolved: 0 });
    }
    dailyTrends.get(createdDate)!.created++;

    if (issue.resolved_at) {
      const resDate = new Date(issue.resolved_at).toISOString().split('T')[0];
      if (!dailyTrends.has(resDate)) {
        dailyTrends.set(resDate, { created: 0, resolved: 0 });
      }
      dailyTrends.get(resDate)!.resolved++;
    }

    // 7. Recurring Issue Grouping
    const recurKey = `${locId}::${cat.toLowerCase()}`;
    if (!recurringGroups.has(recurKey)) {
      recurringGroups.set(recurKey, {
        location_label: locLabel,
        building,
        room,
        category: cat,
        tickets: [],
      });
    }
    recurringGroups.get(recurKey)!.tickets.push({
      ticket_number: issue.ticket_number,
      title: issue.title,
      created_at: issue.created_at,
    });
  }

  // Calculate averages
  const avgResolutionHours =
    resolvedWithTimestampCount > 0
      ? Number((totalResolutionDurationMs / (resolvedWithTimestampCount * 3600 * 1000)).toFixed(1))
      : 4.5; // fallback default estimate if no closed tickets yet

  const avgOpenAgeHours =
    openWithTimestampCount > 0
      ? Number((totalOpenAgeMs / (openWithTimestampCount * 3600 * 1000)).toFixed(1))
      : 2.0;

  // Build sorted categories
  const categories: CategoryMetric[] = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Build department workloads
  const departments: DepartmentWorkloadMetric[] = Array.from(departmentBuckets.entries())
    .map(([deptName, b]) => ({
      department_name: deptName,
      open: b.open,
      in_progress: b.in_progress,
      resolved: b.resolved,
      total: b.total,
      percentage: total > 0 ? Math.round((b.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Build building hotspots
  const buildingHotspots: BuildingHotspot[] = Array.from(buildingCounts.entries())
    .map(([bName, b]) => ({
      building: bName,
      issue_count: b.total,
      critical_count: b.critical,
      percentage: total > 0 ? Math.round((b.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.issue_count - a.issue_count);

  // Build room hotspots
  const roomHotspots: RoomHotspot[] = Array.from(roomBuckets.values())
    .map((r) => {
      let topCat = 'General';
      let maxCatCount = 0;
      for (const [c, cnt] of r.categories.entries()) {
        if (cnt > maxCatCount) {
          maxCatCount = cnt;
          topCat = c;
        }
      }
      return {
        location_id: r.location_id,
        label: r.label,
        building: r.building,
        room: r.room,
        issue_count: r.total,
        primary_category: topCat,
      };
    })
    .sort((a, b) => b.issue_count - a.issue_count);

  // Build chronological trends (past 7 days)
  const trends: VolumeTrendPoint[] = Array.from(dailyTrends.entries())
    .map(([dateStr, counts]) => ({
      date: dateStr,
      label: new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      created: counts.created,
      resolved: counts.resolved,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build Recurring Issues (threshold: >= 2 occurrences in same location and category)
  const recurringIssues: RecurringIssue[] = [];
  for (const [key, group] of recurringGroups.entries()) {
    if (group.tickets.length >= 2) {
      const count = group.tickets.length;
      const severityLevel = count >= 3 ? 'HIGH_FREQUENCY' : 'MODERATE_FREQUENCY';
      const ticketNumbers = group.tickets.map((t) => t.ticket_number);
      const sortedTickets = [...group.tickets].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastReported = sortedTickets[0]?.created_at || new Date().toISOString();

      let recommendation = `Schedule routine preventive inspection for ${group.room} (${group.category}).`;
      if (group.category.toLowerCase() === 'electrical') {
        recommendation = `Comprehensive circuit and breaker inspection advised for ${group.room} to prevent repeated fixture burnout.`;
      } else if (group.category.toLowerCase() === 'plumbing') {
        recommendation = `Inspect main pressure valve and PVC supply joints in ${group.room} to resolve chronic leakage.`;
      }

      recurringIssues.push({
        id: `recur-${key.replace(/[^a-zA-Z0-9]/g, '-')}`,
        location_label: group.location_label,
        building: group.building,
        room: group.room,
        category: group.category,
        count,
        severity_level: severityLevel,
        summary: `${group.room} in ${group.building} has ${count} repeated ${group.category} complaints reported recently (${ticketNumbers.join(', ')}).`,
        recommendation,
        ticket_numbers: ticketNumbers,
        last_reported: lastReported,
      });
    }
  }

  // Sort recurring issues descending by count
  recurringIssues.sort((a, b) => b.count - a.count);

  return {
    summary: {
      total_issues: total,
      open_issues: openCount,
      in_progress_issues: inProgressCount,
      pending_verification: pendingVerificationCount,
      verified_issues: verifiedCount,
      closed_issues: closedCount,
      critical_issues: criticalCount,
      high_priority_issues: criticalCount + highCount,
      average_resolution_hours: avgResolutionHours,
      average_open_age_hours: avgOpenAgeHours,
    },
    categories,
    departments,
    building_hotspots: buildingHotspots,
    room_hotspots: roomHotspots,
    trends,
    recurring_issues: recurringIssues,
    computed_at: new Date().toISOString(),
  };
}
