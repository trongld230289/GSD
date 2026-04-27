// ============================================================
// Finance Tracker — Google Apps Script Backend
// ============================================================
// Phase history:
//   Phase 1: Transactions CRUD + Categories
//   Phase 2: getMonthlyTotals + auth/date bug fixes
//   Phase 4: getBudgets + setBudget (Budgets sheet)
// ============================================================

const CLIENT_ID = '993101146522-rn89slm3464o5d60qrq1hj5spf264vh8.apps.googleusercontent.com'

// ============================================================
// ENTRY POINTS
// ============================================================

function doGet(e) {
  const params = e.parameter
  try {
    const action = params.action

    // Actions that don't require auth
    if (action === 'ping') return respond({ ok: true, status: 'ok' })
    if (action === 'getCategories') return respond({ ok: true, data: getCategories() })

    // All other actions require token
    const token = params.token
    if (!token) return respond({ ok: false, error: 'Missing token' })
    const userEmail = verifyToken(token)

    switch (action) {
      case 'getTransactions': {
        const month = parseInt(params.month)
        const year = parseInt(params.year)
        return respond({ ok: true, data: getTransactions(month, year, userEmail) })
      }
      case 'getMonthlyTotals': {
        const monthsParam = params.months || ''
        const monthsArr = monthsParam.split(',').map(function(m) { return m.trim() }).filter(Boolean)
        if (!monthsArr.length) return respond({ ok: false, error: 'months param required' })
        return respond({ ok: true, data: getMonthlyTotals(monthsArr, userEmail) })
      }
      case 'getBudgets': {
        const month = params.month  // expects "YYYY-MM"
        if (!month) return respond({ ok: false, error: 'month param required' })
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Budgets')
        if (!sheet) return respond({ ok: false, error: 'Budgets sheet not found' })
        const lastRow = sheet.getLastRow()
        if (lastRow < 2) return respond({ ok: true, data: [] })
        const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues()
        const data = rows
          .filter(function(r) { return String(r[0]) === String(month) })
          .map(function(r) { return { category_id: String(r[1]), budgeted: Number(r[2]) } })
        return respond({ ok: true, data: data })
      }
      default:
        return respond({ ok: false, error: 'Unknown action: ' + action })
    }
  } catch (err) {
    return respond({ ok: false, error: err.message })
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const action = body.action

    // All POST actions require token
    const token = body.token
    if (!token) return respond({ ok: false, error: 'Missing token' })
    const userEmail = verifyToken(token)

    switch (action) {
      case 'addTransaction': {
        return respond({ ok: true, data: addTransaction(body, userEmail) })
      }
      case 'updateTransaction': {
        return respond({ ok: true, data: updateTransaction(body, userEmail) })
      }
      case 'deleteTransaction': {
        return respond({ ok: true, data: deleteTransaction(body.id, userEmail) })
      }
      case 'setBudget': {
        const month = body.month
        const category_id = body.category_id
        const budgeted = body.budgeted
        if (!month || !category_id || budgeted === undefined) {
          return respond({ ok: false, error: 'month, category_id, budgeted required' })
        }
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Budgets')
        if (!sheet) return respond({ ok: false, error: 'Budgets sheet not found' })
        const lastRow = sheet.getLastRow()
        var rowIndex = -1
        if (lastRow >= 2) {
          const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues()
          rowIndex = rows.findIndex(function(r) {
            return String(r[0]) === String(month) && String(r[1]) === String(category_id)
          })
        }
        if (rowIndex >= 0) {
          // Update existing row (rowIndex is 0-based, sheet rows 1-based, +2 for header)
          sheet.getRange(rowIndex + 2, 3).setValue(Number(budgeted))
        } else {
          sheet.appendRow([String(month), String(category_id), Number(budgeted)])
        }
        return respond({ ok: true, data: { success: true } })
      }
      default:
        return respond({ ok: false, error: 'Unknown action: ' + action })
    }
  } catch (err) {
    return respond({ ok: false, error: err.message })
  }
}

// ============================================================
// TOKEN VERIFICATION
// ============================================================

function verifyToken(idToken) {
  const res = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + idToken,
    { muteHttpExceptions: true }
  )
  const info = JSON.parse(res.getContentText())
  if (info.error) throw new Error('Token invalid: ' + info.error)
  if (info.aud !== CLIENT_ID) throw new Error('Token audience mismatch')
  return info.email
}

// ============================================================
// TRANSACTIONS CRUD
// ============================================================

function getTransactions(month, year, userEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions')
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return []

  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues()
  return data
    .filter(function(row) {
      if (!row[0]) return false // skip empty rows
      if (row[7] !== userEmail) return false
      const d = new Date(row[1])
      return d.getMonth() + 1 === month && d.getFullYear() === year
    })
    .map(function(row) {
      return {
        id: row[0],
        date: Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        type: row[2],
        category_id: row[3],
        amount: row[4],
        note: row[5],
        created_at: row[6]
      }
    })
}

function addTransaction(data, userEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions')
  const id = 'txn-' + Utilities.getUuid()
  const now = new Date().toISOString()
  const newRow = sheet.getLastRow() + 1
  sheet.appendRow([id, data.date, data.type, data.category_id, data.amount, data.note || '', now, userEmail])
  sheet.getRange(newRow, 2).setNumberFormat('@')
  return { id: id, success: true }
}

function updateTransaction(data, userEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions')
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return { success: false, error: 'Not found' }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
  const rowIndex = ids.indexOf(data.id)
  if (rowIndex === -1) return { success: false, error: 'Not found' }

  // Verify ownership
  const ownerEmail = sheet.getRange(rowIndex + 2, 8).getValue()
  if (ownerEmail !== userEmail) return { success: false, error: 'Forbidden' }

  const row = rowIndex + 2
  sheet.getRange(row, 2).setNumberFormat('@')
  sheet.getRange(row, 2).setValue(data.date)
  sheet.getRange(row, 3).setValue(data.type)
  sheet.getRange(row, 4).setValue(data.category_id)
  sheet.getRange(row, 5).setValue(data.amount)
  sheet.getRange(row, 6).setValue(data.note || '')
  return { success: true }
}

function deleteTransaction(id, userEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions')
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return { success: false, error: 'Not found' }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
  const rowIndex = ids.indexOf(id)
  if (rowIndex === -1) return { success: false, error: 'Not found' }

  const row = rowIndex + 2
  const ownerEmail = sheet.getRange(row, 8).getValue()
  if (ownerEmail !== userEmail) return { success: false, error: 'Forbidden' }

  sheet.deleteRow(row)
  return { success: true }
}

// ============================================================
// MONTHLY TOTALS (Phase 2)
// ============================================================

function getMonthlyTotals(months, userEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions')
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) {
    return months.map(function(m) { return { month: m, income: 0, expense: 0 } })
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues()
  // Columns: id(0) date(1) type(2) category_id(3) amount(4) note(5) created_at(6) user_email(7)

  const totals = {}
  months.forEach(function(m) { totals[m] = { month: m, income: 0, expense: 0 } })

  for (var i = 0; i < data.length; i++) {
    const row = data[i]
    if (row[7] !== userEmail) continue
    const dateStr = Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM')
    if (!totals[dateStr]) continue
    const amount = Number(row[4]) || 0
    if (row[2] === 'income') totals[dateStr].income += amount
    else totals[dateStr].expense += amount
  }

  return Object.values(totals)
}

// ============================================================
// CATEGORIES
// ============================================================

function getCategories() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories')
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return seedCategories()

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues()
  return data
    .filter(function(row) { return row[0] })
    .map(function(row) {
      return {
        id: row[0], name: row[1], type: row[2],
        icon: row[3], color: row[4], sort_order: row[5]
      }
    })
}

function seedCategories() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories')
  const categories = [
    // Expense categories
    ['food-drink',         'Food & Drink',            'expense', '🍜', '#F59E0B', 1],
    ['transportation',     'Transportation',           'expense', '🚗', '#3B82F6', 2],
    ['shopping',           'Shopping',                 'expense', '👗', '#EC4899', 3],
    ['personal-dev',       'Personal Dev.',            'expense', '📚', '#8B5CF6', 4],
    ['lifestyle',          'Lifestyle',                'expense', '🎬', '#F43F5E', 5],
    ['health',             'Health',                   'expense', '💊', '#10B981', 6],
    ['groceries',          'Groceries',                'expense', '🛒', '#F97316', 7],
    ['housing',            'Housing',                  'expense', '🏠', '#06B6D4', 8],
    ['furniture',          'Furniture',                'expense', '🛋️', '#84CC16', 9],
    ['debt',               'Debt',                     'expense', '💳', '#6B7280', 10],
    ['giving',             'Giving',                   'expense', '🎁', '#EF4444', 11],
    ['savings',            'Savings',                  'expense', '💰', '#14B8A6', 12],
    ['other-expense',      'Others',                   'expense', '📝', '#9CA3AF', 13],
    // Income categories
    ['salary',             'Salary',                   'income',  '💼', '#22C55E', 14],
    ['bonus',              'Bonus',                    'income',  '🎯', '#16A34A', 15],
    ['side-income',        'Side Income',              'income',  '🔧', '#84CC16', 16],
    ['gifts-received',     'Gifts Received',           'income',  '🧧', '#FB923C', 17],
  ]
  sheet.getRange(2, 1, categories.length, 6).setValues(categories)
  return categories.map(function(row) {
    return {
      id: row[0], name: row[1], type: row[2],
      icon: row[3], color: row[4], sort_order: row[5]
    }
  })
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
