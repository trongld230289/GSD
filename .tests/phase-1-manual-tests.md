# Phase 1 Manual Test Suite — Core Entry & Sync

**Version:** 1.0  
**Environment:** `https://trongld230289.github.io/GSD/`  
**Device:** iPhone (primary) + Desktop browser (secondary)  
**Prerequisites:** Logged in with Google account; at least 1 transaction in current month  

---

## How to Use This File

- Run through each section in order for a **full regression test**
- Mark each case: ✅ Pass | ❌ Fail (note what went wrong) | ⚠️ Partial
- After any code change, re-run the affected section at minimum

---

## AUTH — Authentication

### AUTH-01 · Google Sign In
| # | Step | Expected |
|---|---|---|
| 1 | Open `https://trongld230289.github.io/GSD/` (not logged in / incognito) | Redirected to `/GSD/login` — Login page shown |
| 2 | Tap **Sign in with Google** button | Google account picker appears |
| 3 | Select Google account | Redirected to home screen (`/GSD/`) — user avatar or name visible in header |
| 4 | Check that One Tap prompt appears automatically on load | Google One Tap popup shown within 1–2 seconds |

### AUTH-02 · Session Persistence
| # | Step | Expected |
|---|---|---|
| 1 | Log in successfully | Home screen visible |
| 2 | Close the browser tab completely | — |
| 3 | Re-open `https://trongld230289.github.io/GSD/` | Home screen loads directly — no login required |
| 4 | Hard-refresh the page (pull-to-refresh on iPhone) | Stays on home screen — does NOT redirect to login |

### AUTH-03 · Data Isolation
| # | Step | Expected |
|---|---|---|
| 1 | Log in as Account A, add a transaction "Test A" | Transaction appears in list |
| 2 | Log out, log in as Account B | Account B's transaction list is empty (or shows only Account B's data) |
| 3 | Log back in as Account A | "Test A" transaction is still visible |

### AUTH-04 · Sign Out
| # | Step | Expected |
|---|---|---|
| 1 | Tap the sign-out button (header) | Redirected to login page |
| 2 | Try to navigate to `https://trongld230289.github.io/GSD/` directly | Redirected back to login — cannot access home |

---

## TRANS-ADD — Adding Transactions

### TRANS-01 · Add Expense
| # | Step | Expected |
|---|---|---|
| 1 | Tap the green **＋** FAB button | Drawer slides up from bottom |
| 2 | Confirm **Expense** is selected by default | Expense tab is highlighted in red |
| 3 | Tap amount field, type `50000` | Shows `50.000` (formatted with dots) |
| 4 | Select category **Food & Dining** | Category highlighted with colored border |
| 5 | Date shows today's date | Date field pre-filled with today (e.g. `2026-04-11`) |
| 6 | Type note `lunch` | Note field shows "lunch" |
| 7 | Tap **Save** | Drawer closes; transaction appears at top of today's group |
| 8 | Check Google Sheet | New row added in Transactions tab with correct values |

### TRANS-02 · Add Income
| # | Step | Expected |
|---|---|---|
| 1 | Open drawer via FAB | Drawer shown |
| 2 | Tap **Income** tab | Toggle switches to green Income; category grid updates to income categories |
| 3 | Confirm income categories visible: Salary/Wages, Freelance, Gifts Received, Other Income | 4 categories shown |
| 4 | Enter amount `5000000`, select **Salary / Wages**, keep today's date | — |
| 5 | Tap **Save** | Drawer closes; income transaction appears with green amount |
| 6 | Check balance cards — Income total increased | Correct total shown |

### TRANS-03 · FAB Button
| # | Step | Expected |
|---|---|---|
| 1 | Scroll down the transaction list | FAB stays fixed at bottom-right corner |
| 2 | Tap FAB | Drawer opens |
| 3 | Tap the backdrop (dark overlay) | Drawer closes |
| 4 | Open drawer, tap **✕** button | Drawer closes |

### TRANS-04 · Amount Input
| # | Step | Expected |
|---|---|---|
| 1 | Open drawer, tap amount field | Numeric keyboard appears on mobile |
| 2 | Type `1234567` | Shows as `1.234.567` with VND formatting |
| 3 | Below input: formatted preview shows `1.234.567 ₫` | Preview text visible |
| 4 | Try typing letters (e.g. paste "abc") | Letters ignored — only digits accepted |
| 5 | Clear amount, leave at `0` or empty | Save blocked with "Please enter a valid amount" error |

### TRANS-05 · Category Grid
| # | Step | Expected |
|---|---|---|
| 1 | Open drawer in Expense mode | 12 expense categories shown in 4-column grid |
| 2 | Switch to Income mode | Grid switches to 4 income categories |
| 3 | Switch back to Expense | 12 expense categories shown again; any previously selected income category is cleared |
| 4 | Tap a category | It shows a colored ring/border (selected state) |
| 5 | Try saving without selecting a category | Error: "Please select a category" |

### TRANS-06 · Default Date
| # | Step | Expected |
|---|---|---|
| 1 | Open drawer | Date field pre-filled with today's date |
| 2 | Change date to yesterday | Accepted |
| 3 | Try to pick a future date (tomorrow) | Future dates should be blocked (`max` = today) |

### TRANS-07 · Validation
| # | Step | Expected |
|---|---|---|
| 1 | Tap Save with empty amount | Error: "Please enter a valid amount" |
| 2 | Tap Save with amount but no category | Error: "Please select a category" |
| 3 | Tap Save with amount + category but date cleared | Error: "Please select a date" |
| 4 | Fill all required fields | Save succeeds, drawer closes |

---

## TRANS-VIEW — Viewing & Managing Transactions

### TRANS-08 · Transaction List
| # | Step | Expected |
|---|---|---|
| 1 | Home screen, current month selected | List shows all transactions for the month, grouped by date |
| 2 | Each date group has a header (e.g. "Friday, Apr 11") | Date headers visible and correct |
| 3 | Multiple transactions on same day | All grouped under the same date header |
| 4 | No transactions in month | Empty state message shown (not a blank white screen) |

### TRANS-09 · Month Navigation
| # | Step | Expected |
|---|---|---|
| 1 | Tap **‹** button | Month changes to previous (e.g. March 2026); transaction list updates |
| 2 | Navigate to a month with no transactions | Empty state shown |
| 3 | Tap **›** to go back to current month | Transactions reload and appear |
| 4 | When on current month, **›** is disabled | Right arrow is greyed out and non-tappable |
| 5 | Try tapping disabled **›** | Nothing happens |

### TRANS-10 · Transaction Row Display
| # | Step | Expected |
|---|---|---|
| 1 | Look at any expense transaction row | Shows: category emoji+icon, category name, note (if any), date, amount in red with `−` |
| 2 | Look at any income transaction row | Amount shown in green with `+` |
| 3 | Transaction with no note | Note area is empty / hidden (no blank space) |
| 4 | Transaction with long note | Note truncates with ellipsis — does not break layout |

### TRANS-11 · Delete Transaction
| # | Step | Expected |
|---|---|---|
| 1 | Swipe left on a transaction row | Row slides left, red **Delete** button revealed on the right |
| 2 | Swipe right while delete is revealed | Row slides back to original position — delete NOT triggered |
| 3 | Tap elsewhere (another row) after revealing delete | Delete button hides for previous row |
| 4 | Swipe left and tap **Delete** | Confirmation dialog: "Delete this transaction?" |
| 5 | Tap **Cancel** on dialog | Transaction remains; row resets to normal |
| 6 | Swipe + tap Delete + confirm | Transaction removed from list immediately |
| 7 | Check Google Sheet | Row deleted from Transactions tab |

### TRANS-12 · Edit Transaction
| # | Step | Expected |
|---|---|---|
| 1 | Tap on a transaction row (without swiping) | Drawer opens titled "Edit Transaction" |
| 2 | All fields pre-filled correctly | Type, category (highlighted), amount, date, note all match saved values |
| 3 | Change the amount | New amount shows |
| 4 | Change the category | New category selected |
| 5 | Change the date | New date accepted |
| 6 | Tap **Update** | Drawer closes; updated values visible in transaction row |
| 7 | Check Google Sheet | Row updated with new values |

---

## CAT — Categories

### CAT-01 · Expense Categories (12)
| # | Step | Expected |
|---|---|---|
| 1 | Open drawer in Expense mode, count categories | Exactly 12 categories visible |
| 2 | Verify each category present: Food & Dining 🍜, Transportation 🚗, Shopping & Apparel 👗, Online Shopping 📦, Travel & Vacation ✈️, Personal Development 📚, Gifts & Celebrations 🎁, Bills & Utilities 💡, Healthcare 💊, Entertainment 🎬, Savings / Investment 💰, Other 📝 | All 12 present with correct name and emoji |

### CAT-02 · Income Categories (4)
| # | Step | Expected |
|---|---|---|
| 1 | Open drawer in Income mode, count categories | Exactly 4 categories visible |
| 2 | Verify: Salary / Wages 💼, Freelance / Side Income 🔧, Gifts Received 🧧, Other Income 📊 | All 4 present |

### CAT-03 · Separation of Category Types
| # | Step | Expected |
|---|---|---|
| 1 | Open drawer in Expense mode | Only 12 expense categories shown |
| 2 | Switch to Income mode | Grid immediately switches to 4 income categories only — no mixing |

---

## DASH — Balance Summary (Phase 1 cards)

### DASH-01/02/03 · Balance Cards
| # | Step | Expected |
|---|---|---|
| 1 | On home screen, view the top cards | Shows 3 values: Income, Expense, Balance |
| 2 | Add a 50,000 expense | Expense total increases by 50,000; Balance decreases by 50,000 |
| 3 | Add a 1,000,000 income | Income total increases by 1,000,000; Balance increases by 1,000,000 |
| 4 | Check balance = income − expense | Arithmetic is correct |
| 5 | When balance is positive (income > expense) | Balance shown in **green** |
| 6 | When balance is negative (expense > income) | Balance shown in **red** |
| 7 | Navigate to a month with no transactions | All 3 cards show `0 ₫` |

---

## PWA — Responsive & Mobile

### PWA-01 · Mobile Layout
| # | Step | Expected |
|---|---|---|
| 1 | Open on iPhone (any recent model) | All content fits within screen — no horizontal scroll |
| 2 | Tap all interactive elements (buttons, FAB, drawer) | Touch targets large enough — no mis-taps needed |
| 3 | Open drawer | Drawer takes up reasonable height; content scrollable if needed |
| 4 | Category grid in drawer | 4 columns, all visible without scrolling horizontally |

### PWA-02 · Add to Home Screen
| # | Step | Expected |
|---|---|---|
| 1 | On iPhone Safari: tap Share → "Add to Home Screen" | Option available |
| 2 | Confirm add | App icon appears on home screen |
| 3 | Open from home screen icon | App opens full-screen (no browser chrome), correct icon shown |

---

## SYNC — Google Sheets Data Integrity

### SYNC-01 · Data persists after refresh
| # | Step | Expected |
|---|---|---|
| 1 | Add a transaction | Appears in list |
| 2 | Hard-refresh (pull down on iPhone Safari) | Transaction still visible after reload |
| 3 | Open in a different browser | Same transaction appears |

### SYNC-02 · Correct Sheet data
| # | Step | Expected |
|---|---|---|
| 1 | Add expense: 75,000 / Food & Dining / today / "coffee" | In Google Sheet row: type=expense, category_id matches Food & Dining, amount=75000, date=YYYY-MM-DD, note=coffee |
| 2 | Edit it to 80,000 / note="coffee and cake" | Sheet row updated — NOT a new row added |
| 3 | Delete it | Row removed from Sheet |

---

## Regression Checklist (Quick Run)

Use this for fast regression after a code change:

- [ ] Can log in with Google
- [ ] Home screen loads with correct month
- [ ] Balance cards show correct totals
- [ ] FAB opens drawer
- [ ] Can add expense — appears in list and Sheet
- [ ] Can add income — appears in list and Sheet
- [ ] Validation errors shown for missing fields
- [ ] Swipe left reveals Delete
- [ ] Swipe right closes Delete without deleting
- [ ] Delete with confirm removes transaction
- [ ] Tap row opens Edit drawer pre-filled (check date especially)
- [ ] Update saves correctly to Sheet
- [ ] ‹ / › month nav changes month and reloads list
- [ ] › is disabled on current month
- [ ] App usable on iPhone screen size

---

*Last updated: 2026-04-11*  
*Phase 2 test cases will be added in `.tests/phase-2-manual-tests.md` when Phase 2 is complete.*
