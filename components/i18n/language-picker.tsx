'use client'

import { useId, useTransition } from 'react'
import { Globe } from 'lucide-react'
import { setLocale } from '@/app/actions/locale'
import { LOCALES } from '@/lib/i18n/locales'
import { cn } from '@/lib/utils'

export function LanguagePicker({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' | 'inherit' }) {
  const id = useId()
  const [isPending, startTransition] = useTransition()
  const current = typeof document === 'undefined' ? 'en' : document.documentElement.lang || 'en'

  return (
    <div translate="no" className={cn('relative inline-flex items-center', className)}>
      <label htmlFor={id} className="sr-only">
        Language / Idioma / Langue / 语言
      </label>
      <Globe
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute start-3 size-4',
          tone === 'light' ? 'text-white/70' : tone === 'dark' ? 'text-foreground/70' : 'opacity-70',
        )}
      />
      <select
        id={id}
        suppressHydrationWarning
        defaultValue={current}
        disabled={isPending}
        onChange={(event) => {
          const code = event.target.value
          startTransition(async () => {
            const result = await setLocale(code)
            if (result.ok) window.location.reload()
          })
        }}
        className={cn(
          'h-9 max-w-44 cursor-pointer appearance-none truncate rounded-full border bg-transparent ps-9 pe-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
          tone === 'light'
            ? 'border-white/20 text-white hover:border-white/40'
            : tone === 'dark'
              ? 'border-foreground/15 text-foreground hover:border-foreground/30'
              : 'border-current/20',
        )}
      >
        {LOCALES.map((locale) => (
          <option key={locale.code} value={locale.code} className="bg-background text-foreground">
            {locale.name}
          </option>
        ))}
      </select>
    </div>
  )
}
