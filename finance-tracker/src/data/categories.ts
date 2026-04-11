// Static category metadata — descriptions shown in the picker as usage tips.
// Colors are deliberately distinct so the donut chart is always readable.
// These must match the IDs seeded in the Categories sheet via seedCategories().

export interface CategoryMeta {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  sort_order: number
  description: string
}

export const CATEGORY_META: CategoryMeta[] = [
  // ── Income ──────────────────────────────────────────────────────────────────
  {
    id: 'salary',
    name: 'Salary',
    type: 'income',
    icon: '💼',
    color: '#22C55E',   // green
    sort_order: 1,
    description: 'Regular monthly pay from your primary job.',
  },
  {
    id: 'bonus',
    name: 'Bonus',
    type: 'income',
    icon: '🎯',
    color: '#14B8A6',   // teal
    sort_order: 2,
    description: 'Extra pay for performance, commissions, or overtime.',
  },
  {
    id: 'side-income',
    name: 'Side Income',
    type: 'income',
    icon: '🔧',
    color: '#A855F7',   // purple
    sort_order: 3,
    description: 'Money earned from freelance work or secondary jobs.',
  },
  {
    id: 'gifts-received',
    name: 'Gifts',
    type: 'income',
    icon: '🧧',
    color: '#FB923C',   // light orange
    sort_order: 4,
    description: 'Money received from family, friends, or special occasions.',
  },

  // ── Expense ─────────────────────────────────────────────────────────────────
  {
    id: 'savings',
    name: 'Savings',
    type: 'expense',
    icon: '🏦',
    color: '#3B82F6',   // blue
    sort_order: 1,
    description: 'Money set aside for emergencies or future goals.',
  },
  {
    id: 'giving',
    name: 'Giving',
    type: 'expense',
    icon: '🙏',
    color: '#EC4899',   // hot pink
    sort_order: 2,
    description: 'Donations, charity, and gifts for special occasions.',
  },
  {
    id: 'housing',
    name: 'Housing',
    type: 'expense',
    icon: '🏠',
    color: '#7C3AED',   // violet
    sort_order: 3,
    description: 'Recurring costs: Rent/mortgage, utilities, and internet.',
  },
  {
    id: 'furniture',
    name: 'Furniture',
    type: 'expense',
    icon: '🪑',
    color: '#F59E0B',   // amber
    sort_order: 4,
    description: 'Big purchases: Furniture, home appliances, and decor.',
  },
  {
    id: 'transport',
    name: 'Transport',
    type: 'expense',
    icon: '🚗',
    color: '#06B6D4',   // cyan
    sort_order: 5,
    description: 'Fuel, parking, public transit, and vehicle maintenance.',
  },
  {
    id: 'food',
    name: 'Food & Drink',
    type: 'expense',
    icon: '🍜',
    color: '#F97316',   // orange
    sort_order: 6,
    description: 'Meals, snacks, cafes, and work lunches.',
  },
  {
    id: 'health',
    name: 'Health',
    type: 'expense',
    icon: '💊',
    color: '#EF4444',   // red
    sort_order: 7,
    description: 'Medical bills, medicine, and health insurance.',
  },
  {
    id: 'personal-dev',
    name: 'Personal Dev.',
    type: 'expense',
    icon: '📚',
    color: '#10B981',   // emerald
    sort_order: 8,
    description: 'Courses, books, workshops, and skill-building.',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    type: 'expense',
    icon: '🎭',
    color: '#84CC16',   // lime
    sort_order: 9,
    description: 'Personal spending: Shopping, travel, gym, and pets.',
  },
  {
    id: 'groceries',
    name: 'Groceries',
    type: 'expense',
    icon: '🛒',
    color: '#64748B',   // slate
    sort_order: 10,
    description: 'Supermarket trips, fresh food, and home supplies.',
  },
  {
    id: 'debt',
    name: 'Debt',
    type: 'expense',
    icon: '💳',
    color: '#78716C',   // stone/brown
    sort_order: 11,
    description: 'Repayments for loans, including principal and interest.',
  },
  {
    id: 'others',
    name: 'Others',
    type: 'expense',
    icon: '📝',
    color: '#9CA3AF',   // gray
    sort_order: 12,
    description: 'Any small or unexpected costs that don\'t fit elsewhere.',
  },
]

// Quick lookup by ID
export const CATEGORY_META_MAP: Record<string, CategoryMeta> =
  Object.fromEntries(CATEGORY_META.map((c) => [c.id, c]))
