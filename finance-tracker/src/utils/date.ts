import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'

export { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths }

/** Today as YYYY-MM-DD */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Format for display: "2026-04-09" → "Wed, Apr 9" */
export function formatDisplay(isoDate: string): string {
  return format(parseISO(isoDate), 'EEE, MMM d')
}

/** Month label: Date → "April 2026" */
export function formatMonth(date: Date): string {
  return format(date, 'MMMM yyyy')
}

/**
 * Normalize any date string from GAS/Sheets to YYYY-MM-DD.
 * Handles: "2026-04-10", "2026/04/10", "04/10/2026", full ISO timestamps.
 */
export function normalizeDate(raw: string): string {
  if (!raw) return ''
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // Full ISO timestamp: 2026-04-10T...
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10)
  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) return raw.replace(/\//g, '-')
  // MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [m, d, y] = raw.split('/')
    return `${y}-${m}-${d}`
  }
  // Fallback: try Date parse
  try {
    return format(new Date(raw), 'yyyy-MM-dd')
  } catch {
    return raw
  }
}

/** Get first and last day of a month as YYYY-MM-DD */
export function monthRange(date: Date): { start: string; end: string } {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

/** Group transactions by date for the list view */
export function groupByDate<T extends { date: string }>(
  items: T[]
): Array<{ date: string; items: T[] }> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const group = map.get(item.date) ?? []
    group.push(item)
    map.set(item.date, group)
  }
  return Array.from(map.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
