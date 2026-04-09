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
