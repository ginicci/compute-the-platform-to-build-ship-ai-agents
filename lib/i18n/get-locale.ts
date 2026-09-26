import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, findLocale, LOCALE_COOKIE, matchLocale, type LocaleCode } from './locales'

export async function getLocale(): Promise<LocaleCode> {
  const saved = findLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  if (saved) return saved.code

  const acceptLanguage = (await headers()).get('accept-language') ?? ''
  const preferred = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag, weight: q ? Number(q) : 1 }
    })
    .filter((entry) => entry.tag && entry.tag !== '*')
    .sort((a, b) => b.weight - a.weight)

  for (const { tag } of preferred) {
    const match = matchLocale(tag)
    if (match) return match
  }
  return DEFAULT_LOCALE
}
