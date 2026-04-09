/** Format a number as VND currency: 1500000 → "1.500.000 ₫" */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Compact format for balance cards: 1500000 → "1,5M ₫" */
export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B ₫`
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ₫`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K ₫`
  }
  return `${amount} ₫`
}

/** Parse a VND input string (allows commas/dots as thousand separators) */
export function parseVNDInput(value: string): number {
  const cleaned = value.replace(/[.,\s]/g, '')
  const parsed = parseInt(cleaned, 10)
  return isNaN(parsed) ? 0 : parsed
}
