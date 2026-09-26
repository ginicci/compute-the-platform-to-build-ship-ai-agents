'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { acceptTerms } from '@/app/actions/legal'
import { TermsCheckbox } from '@/components/legal/terms-checkbox'

export function TermsGate() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    setError('')
    startTransition(async () => {
      try {
        await acceptTerms('app_access')
        router.refresh()
      } catch {
        setError("We couldn't save your agreement. Please try again.")
      }
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-md flex-col gap-5 border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Before you continue</p>
        <h1 className="font-display text-3xl text-balance">Please review our terms.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We&apos;ve published our Terms of Service, Refund Policy and Privacy Policy. Please agree to them to keep
          using your agents.
        </p>
        <TermsCheckbox checked={agreed} onChange={setAgreed} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button onClick={submit} disabled={!agreed || pending} className="min-h-11">
          {pending ? 'Saving...' : 'Agree and continue'}
        </Button>
      </div>
    </div>
  )
}
