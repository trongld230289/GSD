# Features Research — Personal Finance App (2025)

## Table Stakes (Must Have in v1)
*Without these, users will not adopt the app.*

| Feature | Why It's Table Stakes |
|---|---|
| Add expense transaction (amount + category + date) | Core action — every finance app starts here |
| Add income transaction | Can't show balance without income side |
| View transactions list by month | Users need to review what they entered |
| Edit / delete transactions | Data entry mistakes are common |
| Dashboard: total income, total expenses, net balance | The number users check most |
| Pre-built expense categories | Users shouldn't have to build from scratch |
| VND currency formatting | `85,000 ₫` not `85000` |
| Mobile-responsive UI | Primary usage is on phone |
| Persistent data (survives page reload) | Essential — no data loss |

## Differentiators (Set This App Apart)
*Features that make users prefer this over a spreadsheet.*

| Feature | User Value |
|---|---|
| Spending breakdown pie/bar chart by category | Visual "aha" moment — see what's eating budget |
| 6-month trend chart | Spot patterns: "I always overspend in December" |
| Google Sheets visibility | Power users can filter/export/formula directly in Sheets |
| PWA — installable on phone | Feels like a native app, home screen icon |
| Zero cost, zero ads | Use indefinitely without paying or seeing ads |
| CSV export | Personal records, accountant-ready |

## Nice-to-Have (v2 or Later)
| Feature | Notes |
|---|---|
| Monthly budget limits per category | Track against target, show warning at 80% |
| Recurring transactions | Auto-add monthly salary, rent, subscriptions |
| Multi-currency | VND + USD for those paid in USD |
| Summary notes (monthly reflection) | "This month I spent a lot on travel because..." |
| Dark mode | Cosmetic but appreciated |
| Custom categories | Users can add beyond the 12 defaults |
| Shared household tracking | Split expenses with a partner |

## Anti-Features (Avoid)
*What NOT to build — these hurt UX or add complexity without value.*

| Anti-Feature | Why to Avoid |
|---|---|
| Mandatory account creation flow | Adds friction; use Google Sign-In directly |
| Complex budget setup on first open | Kills activation; let users add data first |
| Bank account sync / Plaid integration | Very complex, security concerns, v2+ only |
| Ads or freemium upsell | Personal tool; no business model needed |
| Push notifications in v1 | Budget alerts require budgets (v2 feature) |
| Overly complex category hierarchy | Sub-categories add confusion for v1 |

---

## Category Set (Standard Financial Terminology)

### Expense Categories (12 defaults)
| # | Category Name | Icon | Color | Covers |
|---|---|---|---|---|
| 1 | Food & Dining | 🍜 | #F59E0B | Meals, groceries, coffee, delivery |
| 2 | Transportation | 🚗 | #3B82F6 | Fuel, Grab/Go, parking, motorbike maintenance |
| 3 | Shopping & Apparel | 👗 | #EC4899 | Clothing, accessories, household goods |
| 4 | Online Shopping | 📦 | #F97316 | Shopee, Lazada, Tiki, Amazon |
| 5 | Travel & Vacation | ✈️ | #06B6D4 | Flights, hotels, tours, overnight trips |
| 6 | Personal Development | 📚 | #8B5CF6 | Courses, books, workshops, certifications |
| 7 | Gifts & Celebrations | 🎁 | #EF4444 | Birthday gifts, wedding, party, flowers |
| 8 | Bills & Utilities | 💡 | #6B7280 | Phone, internet, electricity, water |
| 9 | Healthcare | 💊 | #10B981 | Medicine, doctor, dental, gym |
| 10 | Entertainment | 🎬 | #F43F5E | Movies, concerts, Netflix, Spotify |
| 11 | Savings / Investment | 💰 | #14B8A6 | Savings transfers, stock purchases |
| 12 | Other | 📝 | #9CA3AF | Anything that doesn't fit above |

### Income Categories (4 defaults)
| # | Category Name | Icon | Color | Covers |
|---|---|---|---|---|
| 1 | Salary / Wages | 💼 | #22C55E | Regular employment income |
| 2 | Freelance / Side Income | 🔧 | #84CC16 | Contract work, gigs, tutoring |
| 3 | Gifts Received | 🧧 | #FB923C | Money gifts from family/friends |
| 4 | Other Income | 📊 | #A3E635 | Dividends, cashback, misc |

---

## Competitive Analysis: Money Lover (Money Love)

Money Lover is the app the user referenced. Key patterns to adopt:

| Pattern | UX Detail | Should We Adopt? |
|---|---|---|
| Floating action button (FAB) | Tap `+` at bottom center to add transaction | ✅ Yes — standard mobile pattern |
| Bottom navigation bar | Home / Transactions / Add / Reports / Settings | ✅ Yes |
| Transaction form | Amount input first (numpad-like), then category, date, note | ✅ Yes |
| Category grid (emoji icons) | 4-per-row grid scrollable | ✅ Yes |
| Month selector | Swipe or arrow left/right to change month | ✅ Yes |
| Color-coded categories | Each category has distinct color | ✅ Yes |
| Pie chart on Reports | Shows % per category | ✅ Yes |

---
*Research date: 2026-04-07*
