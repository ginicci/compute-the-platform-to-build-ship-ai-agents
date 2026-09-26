'use server'

import { cookies } from 'next/headers'
import { findLocale, LOCALE_COOKIE } from '@/lib/i18n/locales'

export async function setLocale(code: string) {
  const locale = findLocale(code)
  if (!locale) return { ok: false as const }
  ;(await cookies()).set(LOCALE_COOKIE, locale.code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return { ok: true as const }
}
