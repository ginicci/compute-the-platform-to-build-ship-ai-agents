import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, findLocale, LOCALE_COOKIE, type LocaleCode } from './locales'

// English unless the visitor explicitly picked another language in the picker.
export async function getLocale(): Promise<LocaleCode> {
  const saved = findLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  return saved ? saved.code : DEFAULT_LOCALE
}
