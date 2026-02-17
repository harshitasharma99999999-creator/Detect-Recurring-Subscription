/**
 * Smart CSV parser for bank/credit card statements.
 * Supports common formats: Date, Description/Merchant, Amount, Debit/Credit.
 */

export interface RawParsedRow {
  date: string;
  description: string;
  amount: number; // positive = debit (money out), negative = credit (money in)
  raw?: string[];
}

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{2}-\d{2}-\d{4}$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{8}$/,
];

function parseDate(val: string): string | null {
  const v = (val || '').trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
    const [d, m, y] = v.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{8}$/.test(v)) {
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const d = v.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
  return null;
}

function parseAmount(val: string): number | null {
  const v = (val || '').replace(/,/g, '').trim();
  const match = v.replace(/[^\d.-]/g, '').match(/-?\d+\.?\d*/);
  if (!match) return null;
  return parseFloat(match[0]);
}

/**
 * Normalize merchant/description: remove extra symbols, trim, single spaces
 */
export function normalizeDescription(desc: string): string {
  return desc
    .replace(/[*#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-=]+|[-=]+\s*$/g, '')
    .trim();
}

/**
 * Auto-detect column indices from header row (case-insensitive).
 * Looks for: date, description/merchant/posted, amount/debit/credit
 */
function detectColumns(headerRow: string[]): { dateIdx: number; descIdx: number; amountIdx: number; creditDebitIdx: number | null } {
  const lower = headerRow.map((h) => h.toLowerCase().trim());
  let dateIdx = -1;
  let descIdx = -1;
  let amountIdx = -1;
  let creditDebitIdx: number | null = null;

  const dateKeywords = ['date', 'posting date', 'trans date', 'transaction date'];
  const descKeywords = ['description', 'merchant', 'posted description', 'details', 'memo', 'payee', 'name'];
  const amountKeywords = ['amount', 'debit', 'credit', 'transaction amount'];
  const cdKeywords = ['debit/credit', 'type', 'dr/cr', 'dc'];

  for (let i = 0; i < lower.length; i++) {
    const cell = lower[i];
    if (dateIdx === -1 && dateKeywords.some((k) => cell.includes(k))) dateIdx = i;
    if (descIdx === -1 && descKeywords.some((k) => cell.includes(k))) descIdx = i;
    if (amountIdx === -1 && amountKeywords.some((k) => cell.includes(k))) amountIdx = i;
    if (creditDebitIdx === null && cdKeywords.some((k) => cell.includes(k))) creditDebitIdx = i;
  }

  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;
  if (amountIdx === -1) amountIdx = lower.length - 1;

  return { dateIdx, descIdx, amountIdx, creditDebitIdx };
}

/**
 * Parse CSV string into raw rows. Handles quoted fields.
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' || c === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export interface ParseResult {
  rows: RawParsedRow[];
  errors: string[];
}

export function parseCSV(csvContent: string): ParseResult {
  const errors: string[] = [];
  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must have header and at least one data row'] };
  }

  const header = splitCSVLine(lines[0]);
  const cols = detectColumns(header);
  const rows: RawParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i]);
    const dateStr = cells[cols.dateIdx] ?? '';
    const descStr = cells[cols.descIdx] ?? '';
    const amountRaw = cells[cols.amountIdx] ?? '';
    const cdRaw = cols.creditDebitIdx != null ? cells[cols.creditDebitIdx] ?? '' : '';

    const date = parseDate(dateStr);
    const amount = parseAmount(amountRaw);
    const desc = normalizeDescription(descStr);

    if (!date) {
      errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
      continue;
    }
    if (amount === null || isNaN(amount)) {
      errors.push(`Row ${i + 1}: Invalid amount "${amountRaw}"`);
      continue;
    }

    let signedAmount = amount;
    const cd = (cdRaw || '').toLowerCase();
    if (cd.includes('credit') || cd.includes('cr') || amountRaw.startsWith('-')) {
      signedAmount = -Math.abs(amount);
    } else {
      signedAmount = Math.abs(amount);
    }

    rows.push({
      date,
      description: desc || 'Unknown',
      amount: signedAmount,
      raw: cells,
    });
  }

  return { rows, errors };
}
