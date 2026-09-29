import { createHash } from 'node:crypto'
import { generateText } from 'ai'
import { pool } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import { DEFAULT_LOCALE, findLocale } from '@/lib/i18n/locales'

export const maxDuration = 60

const MAX_STRINGS = 120
const MAX_LENGTH = 1200
const MAX_NEW_CHARS_PER_REQUEST = 24_000
const NEW_STRINGS_PER_IP_PER_HOUR = 1500

const ipBudget = new Map<string, { count: number; resetAt: number }>()

function takeBudget(ip: string, amount: number) {
  const now = Date.now()
  const entry = ipBudget.get(ip)
  if (!entry || entry.resetAt < now) {
    ipBudget.set(ip, { count: amount, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count + amount > NEW_STRINGS_PER_IP_PER_HOUR) return false
  entry.count += amount
  return true
}

function hashOf(text: string) {
  return createHash('sha256').update(text).digest('hex').slice(0, 40)
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin'
  try {
    const requestUrl = new URL(request.url)
    return new URL(origin).origin === requestUrl.origin
  } catch {
    return false
  }
}

async function translateWithAI(texts: string[], languageName: string) {
  const { text } = await generateText({
    model: 'openai/gpt-5.4-mini-fast',
    system: [
      `You translate website interface text from English into ${languageName}.`,
      'Return ONLY a JSON array of strings, the same length and order as the input array.',
      'Keep the brand names "Northstar", "Ginicci", "GINICCI", "Stripe" and "Vercel" unchanged.',
      'Keep prices, numbers, currency symbols, emails, URLs, code and placeholders like {name} unchanged.',
      'Match the tone: short, friendly, professional marketing and product copy. Keep capitalization style natural for the language.',
      'If a string is already not English or is a proper name, return it unchanged.',
    ].join(' '),
    prompt: JSON.stringify(texts),
  })

  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  const parsed: unknown = JSON.parse(text.slice(start, end + 1))
  if (!Array.isArray(parsed) || parsed.length !== texts.length) throw new Error('Translation length mismatch')
  return parsed.map((value, index) => (typeof value === 'string' && value.trim() ? value : texts[index]))
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await getUserSession())?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { locale?: unknown; texts?: unknown } | null
  const locale = findLocale(typeof body?.locale === 'string' ? body.locale : null)
  if (!locale || locale.code === DEFAULT_LOCALE) return Response.json({ error: 'Unsupported language' }, { status: 400 })

  const texts = Array.isArray(body?.texts) ? body.texts : []
  if (
    texts.length === 0 ||
    texts.length > MAX_STRINGS ||
    !texts.every((t): t is string => typeof t === 'string' && t.length > 0 && t.length <= MAX_LENGTH)
  ) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const hashes = texts.map(hashOf)
  const { rows } = await pool.query<{ source_hash: string; translated: string }>(
    'SELECT source_hash, translated FROM ui_translations WHERE locale = $1 AND source_hash = ANY($2::text[])',
    [locale.code, hashes],
  )
  const known = new Map(rows.map((row) => [row.source_hash, row.translated]))

  const missing = [...new Set(texts.filter((_, i) => !known.has(hashes[i])))]
  const missingChars = missing.reduce((sum, t) => sum + t.length, 0)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (missing.length > 0 && missingChars <= MAX_NEW_CHARS_PER_REQUEST && takeBudget(ip, missing.length)) {
    try {
      const translated = await translateWithAI(missing, locale.english)
      const missingHashes = missing.map(hashOf)
      await pool.query(
        `INSERT INTO ui_translations (locale, source_hash, source, translated)
         SELECT $1, * FROM unnest($2::text[], $3::text[], $4::text[])
         ON CONFLICT DO NOTHING`,
        [locale.code, missingHashes, missing, translated],
      )
      missingHashes.forEach((hash, i) => known.set(hash, translated[i]))
    } catch (error) {
      console.error('[translate] failed', locale.code, error)
    }
  }

  return Response.json(
    { translations: texts.map((text, i) => known.get(hashes[i]) ?? null) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
