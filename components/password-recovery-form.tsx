'use client'

import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function PasswordRecoveryForm({ mode }: { mode: 'request' | 'reset' }) {
  const params = useSearchParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true); setError(''); setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const result = mode === 'request'
        ? await authClient.requestPasswordReset({ email: String(data.get('email')).trim().toLowerCase(), redirectTo: `${window.location.origin}/reset-password` })
        : await authClient.resetPassword({ token: params.get('token') || '', newPassword: String(data.get('password')) })
      if (result.error) throw new Error(result.error.message)
      setMessage(mode === 'request' ? 'If an account exists, a password-reset email has been sent.' : 'Password updated. You can now sign in.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to complete that request.')
    } finally { setPending(false) }
  }

  return <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-5 border border-border bg-card p-5 sm:p-8">
    <h1 className="text-3xl font-display">{mode === 'request' ? 'Reset your password' : 'Choose a new password'}</h1>
    {mode === 'request' ? <input name="email" type="email" required autoComplete="email" placeholder="Email address" className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" /> : <input name="password" type="password" required minLength={12} autoComplete="new-password" placeholder="New password (12+ characters)" className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
    <Button disabled={pending}>{pending ? 'Please wait...' : mode === 'request' ? 'Send reset link' : 'Update password'}</Button>
    <a href="/sign-in" className="text-center text-sm underline">Back to sign in</a>
  </form>
}
