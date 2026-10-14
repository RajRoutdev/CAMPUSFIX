import type { IssueWithRelations, Location } from '@/types/models';
import { formatLocationString } from '@/lib/locations/data';

export const DEFAULT_DUPLICATE_THRESHOLD = 0.80;

export interface DuplicateInput {
  title: string;
  description: string;
  category: string;
  location_id: string;
  college_id?: string;
  location?: Location | null;
}

export interface SignalScore {
  score: number; // 0.0 to 1.0
  weight: number; // e.g. 0.40
  contribution: number; // score * weight
  reason: string;
}

export interface MatchBreakdown {
  location: SignalScore;
  category: SignalScore;
  semantic: SignalScore;
  time: SignalScore;
}

export interface DuplicateCandidate {
  issue_id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  location_id: string;
  location_label: string;
  location?: Location | null;
  created_at: string;
  score: number; // 0.0 to 1.0
  percentage: number; // 0 to 100
  breakdown: MatchBreakdown;
  reasons: string[];
}

export interface DuplicateMatchResult {
  has_match: boolean;
  threshold: number;
  best_match: DuplicateCandidate | null;
  candidates: DuplicateCandidate[];
}

// Stop words for clean semantic normalization
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'please', 'help', 'urgently', 'kindly',
  // Campus location and generic status tokens (prevent false semantic inflation)
  'room', 'block', 'floor', 'building', 'campus', 'wing', 'hall', 'area',
  'problem', 'problems', 'issue', 'issues', 'broken', 'damaged', 'faulty', 'defect',
  'need', 'needs', 'require', 'repair', 'fixed', 'urgent', 'reported', 'found', 'observed'
]);

// Physical campus assets and symptoms keywords
const FACILITY_KEYWORDS = new Set([
  'fan', 'ceiling', 'blade', 'blades', 'wobble', 'wobbling', 'rattle', 'rattling', 'motor',
  'light', 'tube', 'bulb', 'flicker', 'flickering', 'switch', 'socket', 'plug', 'spark', 'sparking', 'wire', 'wiring',
  'pipe', 'tap', 'faucet', 'leak', 'leaking', 'drip', 'dripping', 'water', 'sink', 'washbasin', 'drain', 'flush', 'toilet',
  'projector', 'screen', 'hdmi', 'display', 'speaker', 'mic', 'audio',
  'ac', 'aircon', 'cooling', 'heater', 'hvac', 'vent',
  'door', 'lock', 'handle', 'hinge', 'latch', 'window', 'glass', 'shattered', 'crack',
  'desk', 'chair', 'table', 'bench', 'board', 'blackboard', 'whiteboard', 'podium',
  'wifi', 'internet', 'router', 'lan', 'ethernet', 'network',
  'elevator', 'lift', 'stairs', 'railing', 'tiles', 'floor', 'wall', 'paint'
]);

// Stemming/normalizer helper
function normalizeWord(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('es')) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  else if (w.endsWith('ed')) w = w.slice(0, -2);
  return w;
}

// Tokenize text into normalized tokens
function tokenize(text: string): { tokens: string[]; keywords: Set<string> } {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];
  const keywords = new Set<string>();

  for (const raw of rawWords) {
    if (!STOP_WORDS.has(raw) && raw.length > 1 && !/^\d+$/.test(raw)) {
      const stem = normalizeWord(raw);
      tokens.push(stem);
      if (FACILITY_KEYWORDS.has(stem) || FACILITY_KEYWORDS.has(raw)) {
        keywords.add(stem);
      }
    }
  }

  return { tokens, keywords };
}

// Dice coefficient on n-grams
function calculateDiceSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }

  const dice = (2 * intersection) / (setA.size + setB.size);
  return Math.min(1.0, dice);
}

// 1. Location similarity (Weight: 40%)
export function evaluateLocationSimilarity(
  incomingLocId: string,
  incomingLoc: Location | null | undefined,
  existingLocId: string,
  existingLoc: Location | null | undefined
): SignalScore {
  const weight = 0.40;

  // Exact location ID match (same room/area)
  if (incomingLocId && existingLocId && incomingLocId === existingLocId) {
    const label = existingLoc ? formatLocationString(existingLoc) : 'Same room';
    return {
      score: 1.0,
      weight,
      contribution: Number((1.0 * weight).toFixed(3)),
      reason: `Same location: ${label}`,
    };
  }

  // If detailed location objects exist, check building and floor
  if (incomingLoc && existingLoc) {
    if (incomingLoc.building === existingLoc.building && incomingLoc.floor === existingLoc.floor) {
      // If both explicitly specify different rooms, reduce score to avoid false positive matches between separate rooms
      if (
        incomingLoc.room &&
        existingLoc.room &&
        incomingLoc.room.trim().toLowerCase() !== existingLoc.room.trim().toLowerCase()
      ) {
        return {
          score: 0.20,
          weight,
          contribution: Number((0.20 * weight).toFixed(3)),
          reason: `Different room on same floor (${existingLoc.building}, ${existingLoc.floor})`,
        };
      }

      return {
        score: 0.65,
        weight,
        contribution: Number((0.65 * weight).toFixed(3)),
        reason: `Same floor: ${existingLoc.building}, ${existingLoc.floor}`,
      };
    }

    if (incomingLoc.building === existingLoc.building) {
      return {
        score: 0.35,
        weight,
        contribution: Number((0.35 * weight).toFixed(3)),
        reason: `Same building: ${existingLoc.building}`,
      };
    }
  }

  return {
    score: 0.0,
    weight,
    contribution: 0.0,
    reason: 'Different building or area',
  };
}

// 2. Category similarity (Weight: 25%)
export function evaluateCategorySimilarity(
  incomingCat: string,
  existingCat: string
): SignalScore {
  const weight = 0.25;
  const a = incomingCat.trim().toLowerCase();
  const b = existingCat.trim().toLowerCase();

  if (a && b && a === b) {
    return {
      score: 1.0,
      weight,
      contribution: Number((1.0 * weight).toFixed(3)),
      reason: `Identical category: ${existingCat}`,
    };
  }

  // Related category pairs
  const relatedGroups = [
    ['electrical', 'classroom equipment', 'it'],
    ['plumbing', 'civil/infrastructure', 'maintenance'],
    ['furniture', 'civil/infrastructure'],
    ['internet', 'it', 'classroom equipment'],
  ];

  for (const group of relatedGroups) {
    if (group.includes(a) && group.includes(b)) {
      return {
        score: 0.40,
        weight,
        contribution: Number((0.40 * weight).toFixed(3)),
        reason: `Related category: ${existingCat} & ${incomingCat}`,
      };
    }
  }

  return {
    score: 0.0,
    weight,
    contribution: 0.0,
    reason: `Different category (${incomingCat} vs ${existingCat})`,
  };
}

// 3. Semantic similarity (Weight: 25%)
export function evaluateSemanticSimilarity(
  incomingTitle: string,
  incomingDesc: string,
  existingTitle: string,
  existingDesc: string
): SignalScore {
  const weight = 0.25;

  const textA = `${incomingTitle} ${incomingDesc}`;
  const textB = `${existingTitle} ${existingDesc}`;

  const parsedA = tokenize(textA);
  const parsedB = tokenize(textB);

  const dice = calculateDiceSimilarity(parsedA.tokens, parsedB.tokens);

  // Check shared facility keywords
  let sharedKeywords: string[] = [];
  for (const kw of parsedA.keywords) {
    if (parsedB.keywords.has(kw)) {
      sharedKeywords.push(kw);
    }
  }

  let finalScore = dice;
  let reason = 'Low description similarity';

  if (sharedKeywords.length > 0) {
    // If they share key physical equipment (e.g. 'fan', 'pipe', 'projector'), boost confidence
    const kwBoost = Math.min(1.0, sharedKeywords.length * 0.4);
    finalScore = Math.min(1.0, (dice * 0.6) + (kwBoost * 0.4));
    reason = `Matches specific equipment: ${sharedKeywords.join(', ')}`;
  } else if (dice >= 0.5) {
    reason = 'Highly similar phrasing in issue description';
  } else if (dice >= 0.25) {
    reason = 'Partially overlapping description terms';
  }

  return {
    score: Number(finalScore.toFixed(3)),
    weight,
    contribution: Number((finalScore * weight).toFixed(3)),
    reason,
  };
}

// 4. Time proximity (Weight: 10%)
export function evaluateTimeProximity(createdAtIso: string): SignalScore {
  const weight = 0.10;
  const createdTime = new Date(createdAtIso).getTime();
  const now = Date.now();
  const diffHours = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

  let score = 0.0;
  let reason = 'Reported more than 2 weeks ago';

  if (diffHours <= 24) {
    score = 1.0;
    reason = 'Reported recently (within last 24 hours)';
  } else if (diffHours <= 72) {
    score = 0.75;
    reason = 'Reported within the last 3 days';
  } else if (diffHours <= 168) {
    score = 0.50;
    reason = 'Reported within the last week';
  } else if (diffHours <= 336) {
    score = 0.25;
    reason = 'Reported within the last 2 weeks';
  }

  return {
    score,
    weight,
    contribution: Number((score * weight).toFixed(3)),
    reason,
  };
}

// Calculate total duplicate match score for a single candidate
export function scoreIssuePair(
  incoming: DuplicateInput,
  existing: IssueWithRelations
): DuplicateCandidate {
  const loc = evaluateLocationSimilarity(
    incoming.location_id,
    incoming.location,
    existing.location_id,
    existing.location
  );

  const cat = evaluateCategorySimilarity(incoming.category, existing.category);

  const sem = evaluateSemanticSimilarity(
    incoming.title,
    incoming.description,
    existing.title,
    existing.description
  );

  const time = evaluateTimeProximity(existing.created_at);

  const total = loc.contribution + cat.contribution + sem.contribution + time.contribution;
  const normalizedScore = Number(Math.min(1.0, Math.max(0.0, total)).toFixed(2));
  const percentage = Math.round(normalizedScore * 100);

  const breakdown: MatchBreakdown = {
    location: loc,
    category: cat,
    semantic: sem,
    time,
  };

  const reasons: string[] = [];
  if (loc.score > 0) reasons.push(loc.reason);
  if (cat.score > 0) reasons.push(cat.reason);
  if (sem.score >= 0.25) reasons.push(sem.reason);
  if (time.score >= 0.5) reasons.push(time.reason);

  const locationLabel = existing.location
    ? formatLocationString(existing.location)
    : 'Campus Location';

  return {
    issue_id: existing.id,
    ticket_number: existing.ticket_number,
    title: existing.title,
    description: existing.description,
    category: existing.category,
    severity: existing.severity,
    status: existing.status,
    location_id: existing.location_id,
    location_label: locationLabel,
    location: existing.location,
    created_at: existing.created_at,
    score: normalizedScore,
    percentage,
    breakdown,
    reasons,
  };
}

// Evaluate an incoming report against an array of existing issues
export function findDuplicateCandidates(
  incoming: DuplicateInput,
  existingIssues: IssueWithRelations[],
  threshold = DEFAULT_DUPLICATE_THRESHOLD
): DuplicateMatchResult {
  // Only evaluate active or recent issues
  // Avoid closed issues unless they were closed very recently (< 24h)
  const now = Date.now();
  const eligibleIssues = existingIssues.filter((issue) => {
    // Cross-college guard
    if (incoming.college_id && issue.college_id && incoming.college_id !== issue.college_id) {
      return false;
    }

    // Only evaluate currently active issues with pending repair or verification
    if (issue.status === 'CLOSED') return false;
    return true;
  });

  const candidates: DuplicateCandidate[] = [];

  for (const existing of eligibleIssues) {
    const candidate = scoreIssuePair(incoming, existing);
    candidates.push(candidate);
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  const bestMatch = candidates[0] || null;
  const hasMatch = Boolean(bestMatch && bestMatch.score >= threshold);

  return {
    has_match: hasMatch,
    threshold,
    best_match: hasMatch ? bestMatch : null,
    candidates: candidates.filter((c) => c.score >= 0.30).slice(0, 5), // top relevant candidates
  };
}
