'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

const requestMessage = 'If an account exists for that email, a password reset link is on its way.'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (result.error) throw new Error(result.error.message)
    } catch {
      // Use one response for every address and provider outcome to avoid account disclosure.
    } finally {
      setMessage(requestMessage)
      setPending(false)
    }
  }

  return <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-5 border border-border bg-card p-5 sm:p-8">
    <p className="font-mono text-xs uppercase tracking-widest text-primary">Ginicci / Northstar</p>
    <h1 className="text-3xl font-display sm:text-4xl">Reset your password.</h1>
    <p className="text-sm leading-6 text-muted-foreground">Enter your account email and we’ll send a time-limited reset link.</p>
    <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" required autoComplete="email" placeholder="Email address" className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" />
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    <Button disabled={pending} className="min-h-12">{pending ? 'Sending link…' : 'Send reset link'}</Button>
    <a href="/sign-in" className="min-h-11 text-center text-sm text-muted-foreground underline">Back to sign in</a>
  </form>
}

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')
  const invalidToken = params.get('error') === 'INVALID_TOKEN' || !token
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || password !== confirmPassword) {
      setError(password !== confirmPassword ? 'Passwords do not match.' : 'This reset link is invalid or has expired.')
      return
    }
    setPending(true)
    setError('')
    try {
      const result = await authClient.resetPassword({ newPassword: password, token })
      if (result.error) {
        setError(result.error.message || 'This reset link is invalid or has expired.')
        return
      }
      router.push('/sign-in?reset=success')
    } catch {
      setError('This reset link is invalid or has expired.')
    } finally {
      setPending(false)
    }
  }

  if (invalidToken) return <div className="mx-auto flex w-full max-w-md flex-col gap-5 border border-border bg-card p-5 sm:p-8"><h1 className="text-3xl font-display sm:text-4xl">Reset link unavailable.</h1><p className="text-sm text-muted-foreground">This link is invalid or has expired. Request a new password reset email.</p><a href="/forgot-password" className="inline-flex min-h-12 items-center justify-center bg-foreground px-5 text-background">Request a new link</a></div>

  return <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-5 border border-border bg-card p-5 sm:p-8">
    <p className="font-mono text-xs uppercase tracking-widest text-primary">Ginicci / Northstar</p>
    <h1 className="text-3xl font-display sm:text-4xl">Choose a new password.</h1>
    <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={12} maxLength={128} autoComplete="new-password" placeholder="New password (12+ characters)" className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" />
    <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required minLength={12} maxLength={128} autoComplete="new-password" placeholder="Confirm new password" className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button disabled={pending} className="min-h-12">{pending ? 'Updating password…' : 'Update password'}</Button>
  </form>
}
