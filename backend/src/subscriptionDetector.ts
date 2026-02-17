/**
 * Subscription Detection Algorithm
 *
 * Detects recurring transactions by:
 * 1. Grouping transactions by merchant name similarity (fuzzy matching)
 * 2. Checking for same/near-same amount patterns
 * 3. Detecting interval patterns: 28-31 days = monthly, 365 days = yearly, 7 days = weekly
 * 4. Requiring at least 3 recurring occurrences to mark as subscription
 */

export interface ParsedTransaction {
  id: string;
  date: string; // ISO date
  merchant: string;
  amount: number; // always positive, credit = negative in source
  rawDescription?: string;
}

export interface DetectedSubscription {
  merchantName: string;
  normalizedMerchant: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  intervalDays: number;
  occurrences: number;
  lastChargeDate: string;
  nextExpectedCharge: string;
  transactionIds: string[];
  monthlyEquivalent: number; // for display: weekly*4.33, yearly/12
}

const FUZZY_THRESHOLD = 0.75; // similarity 0-1
const AMOUNT_TOLERANCE_PERCENT = 0.02; // 2% variance allowed
const MIN_RECURRING_OCCURRENCES = 3;

// Weekly: 6-8 days, Monthly: 28-33 days, Yearly: 355-375 days
const INTERVAL_RANGES = {
  weekly: { min: 6, max: 8 },
  monthly: { min: 28, max: 33 },
  yearly: { min: 355, max: 375 },
} as const;

/**
 * Normalize merchant name for grouping: lowercase, remove extra spaces/symbols
 */
export function normalizeMerchantName(name: string): string {
  return name
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Levenshtein-based similarity (0-1). Used for fuzzy merchant matching.
 */
function stringSimilarity(a: string, b: string): number {
  const na = normalizeMerchantName(a);
  const nb = normalizeMerchantName(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= na.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= nb.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= na.length; i++) {
    for (let j = 1; j <= nb.length; j++) {
      const cost = na[i - 1] === nb[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const maxLen = Math.max(na.length, nb.length);
  return 1 - matrix[na.length][nb.length] / maxLen;
}

/**
 * Check if two amounts are "same" within tolerance (e.g. 2%)
 */
function amountsMatch(a: number, b: number): boolean {
  if (a === 0 && b === 0) return true;
  const max = Math.max(Math.abs(a), Math.abs(b));
  const diff = Math.abs(a - b);
  return diff <= max * AMOUNT_TOLERANCE_PERCENT;
}

/**
 * Classify interval in days into frequency
 */
function classifyInterval(days: number): 'weekly' | 'monthly' | 'yearly' | null {
  if (days >= INTERVAL_RANGES.weekly.min && days <= INTERVAL_RANGES.weekly.max)
    return 'weekly';
  if (days >= INTERVAL_RANGES.monthly.min && days <= INTERVAL_RANGES.monthly.max)
    return 'monthly';
  if (days >= INTERVAL_RANGES.yearly.min && days <= INTERVAL_RANGES.yearly.max)
    return 'yearly';
  return null;
}

/**
 * Compute monthly equivalent for display
 */
function monthlyEquivalent(amount: number, frequency: 'weekly' | 'monthly' | 'yearly'): number {
  switch (frequency) {
    case 'weekly':
      return amount * (52 / 12);
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

/**
 * Add days to ISO date string
 */
function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Group transactions by merchant similarity (fuzzy).
 * Returns array of groups; each group is array of ParsedTransaction with similar merchant.
 */
function groupByMerchant(transactions: ParsedTransaction[]): ParsedTransaction[][] {
  const groups: ParsedTransaction[][] = [];
  const used = new Set<string>();

  for (const t of transactions) {
    if (used.has(t.id)) continue;

    const group = [t];
    used.add(t.id);

    for (const other of transactions) {
      if (used.has(other.id)) continue;
      const sim = stringSimilarity(t.merchant, other.merchant);
      if (sim >= FUZZY_THRESHOLD) {
        group.push(other);
        used.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * For a group of transactions (same merchant), detect if they form a recurring pattern.
 * Returns DetectedSubscription or null.
 */
function detectRecurrenceInGroup(
  group: ParsedTransaction[],
  merchantDisplayName: string
): DetectedSubscription | null {
  if (group.length < MIN_RECURRING_OCCURRENCES) return null;

  // Sort by date
  const sorted = [...group].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Try to find a common amount (within tolerance)
  const amountCounts = new Map<number, number>();
  for (const t of sorted) {
    const amt = Math.round(t.amount * 100) / 100;
    let found = false;
    for (const [existing] of amountCounts) {
      if (amountsMatch(amt, existing)) {
        amountCounts.set(existing, (amountCounts.get(existing) ?? 0) + 1);
        found = true;
        break;
      }
    }
    if (!found) amountCounts.set(amt, 1);
  }

  // Get the most common amount bucket
  let bestAmount = 0;
  let bestCount = 0;
  for (const [amt, count] of amountCounts) {
    if (count >= MIN_RECURRING_OCCURRENCES && count > bestCount) {
      bestCount = count;
      bestAmount = amt;
    }
  }
  if (bestCount < MIN_RECURRING_OCCURRENCES) return null;

  // Filter to transactions with that amount
  const recurring = sorted.filter((t) => amountsMatch(t.amount, bestAmount));
  if (recurring.length < MIN_RECURRING_OCCURRENCES) return null;

  // Compute intervals between consecutive dates
  const intervals: number[] = [];
  for (let i = 1; i < recurring.length; i++) {
    const prev = new Date(recurring[i - 1].date).getTime();
    const curr = new Date(recurring[i].date).getTime();
    intervals.push(Math.round((curr - prev) / (24 * 60 * 60 * 1000)));
  }

  // Check if intervals are consistent (all same frequency)
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const freq = classifyInterval(avgInterval);
  if (!freq) return null;

  const range = INTERVAL_RANGES[freq];
  const allInRange = intervals.every((d) => d >= range.min && d <= range.max);
  if (!allInRange) return null;

  const lastCharge = recurring[recurring.length - 1].date;
  const nextExpected = addDays(lastCharge, Math.round(avgInterval));

  return {
    merchantName: merchantDisplayName,
    normalizedMerchant: normalizeMerchantName(merchantDisplayName),
    amount: bestAmount,
    frequency: freq,
    intervalDays: Math.round(avgInterval),
    occurrences: recurring.length,
    lastChargeDate: lastCharge,
    nextExpectedCharge: nextExpected,
    transactionIds: recurring.map((t) => t.id),
    monthlyEquivalent: monthlyEquivalent(bestAmount, freq),
  };
}

/**
 * Main entry: from parsed transactions, return list of detected subscriptions.
 */
export function detectRecurringSubscriptions(
  transactions: ParsedTransaction[]
): DetectedSubscription[] {
  if (transactions.length < MIN_RECURRING_OCCURRENCES) return [];

  const groups = groupByMerchant(transactions);
  const results: DetectedSubscription[] = [];

  for (const group of groups) {
    const displayName =
      group.reduce((best, t) => (t.merchant.length > best.length ? t.merchant : best), '') ||
      group[0]?.merchant ||
      'Unknown';
    const sub = detectRecurrenceInGroup(group, displayName);
    if (sub) results.push(sub);
  }

  return results;
}
