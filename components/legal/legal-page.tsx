import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/refund-policy', label: 'Refunds' },
  { href: '/privacy', label: 'Privacy' },
]

export function LegalPage({
  title,
  effectiveDate,
  current,
  children,
}: {
  title: string
  effectiveDate: string
  current: string
  children: ReactNode
}) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-8 md:py-16">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Northstar
        </Link>

        <header className="flex flex-col gap-3 border-b border-foreground/10 pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Effective {effectiveDate}
          </span>
          <h1 className="font-display text-4xl tracking-tight text-balance">{title}</h1>
          <nav aria-label="Legal documents" className="flex flex-wrap gap-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.href === current ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center border px-4 text-sm transition-colors ${
                  link.href === current
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-foreground/15 text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="hidden text-sm leading-relaxed text-muted-foreground [html:not([lang=en])_&]:block">
            This page was translated automatically. The English version is the official version and applies if the two
            ever differ.
          </p>
        </header>

        <article className="flex flex-col gap-8 text-base leading-relaxed text-muted-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_li]:pl-1 [&_section]:flex [&_section]:flex-col [&_section]:gap-3 [&_strong]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </main>
  )
}

export function ContactLine() {
  const email = process.env.SUPPORT_EMAIL
  return email ? (
    <p>
      Questions? Email{' '}
      <a href={`mailto:${email}`} className="text-foreground underline underline-offset-4">
        {email}
      </a>
      .
    </p>
  ) : (
    <p>Questions? Reply to any receipt or billing email you&apos;ve received from us and we&apos;ll get back to you.</p>
  )
}
