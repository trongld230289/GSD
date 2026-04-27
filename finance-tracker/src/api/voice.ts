import type { TransactionType } from '../types'
import { CATEGORY_META } from '../data/categories'
import { format } from 'date-fns'

export interface ParsedTransaction {
  type: TransactionType
  amount: number
  category_id: string
  date: string
  note: string
}

export async function parseVoiceInput(
  transcript: string,
  githubPAT: string
): Promise<ParsedTransaction> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const categoryList = CATEGORY_META
    .map((c) => `id="${c.id}" name="${c.name}" type=${c.type}`)
    .join('\n')

  const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubPAT}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Parse this Vietnamese financial voice input into JSON.

Input: "${transcript}"
Today: ${today}

Categories:
${categoryList}

Return JSON only — no explanation:
{"type":"income or expense","amount":number in VND,"category_id":"exact id","date":"YYYY-MM-DD","note":"short label"}

Rules:
- Amount: k/K/nghìn=×1000, triệu/tr/củ=×1000000
- Expense words: chi, mua, trả, ăn, uống, đổ xăng, thuê, mất, tốn
- Income words: nhận, lương, thu, kiếm, được, thưởng
- Date: "hôm nay"=today, "hôm qua"=yesterday, "sáng/chiều/tối nay"=today; if unclear use ${today}
- Pick category_id closest in meaning`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 150,
      temperature: 0,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub Models ${res.status}: ${body || res.statusText}`)
  }

  const data = await res.json()
  const parsed = JSON.parse(data.choices[0].message.content) as ParsedTransaction

  if (!parsed.type || !parsed.amount || !parsed.category_id || !parsed.date) {
    throw new Error('Không parse được — thử nói rõ hơn')
  }

  return parsed
}
