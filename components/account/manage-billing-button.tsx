'use client'

import { useState, useTransition } from 'react'
import { openBillingPortal } from '@/app/actions/billing'

export function ManageBillingButton() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await openBillingPortal()
      if (result.url) window.location.assign(result.url)
      else setError(result.error ?? 'Something went wrong.')
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
      >
        {isPending ? 'Opening…' : 'Manage billing'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
