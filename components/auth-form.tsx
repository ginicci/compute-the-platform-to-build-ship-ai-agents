'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { acceptTerms } from '@/app/actions/legal'
import { TermsCheckbox } from '@/components/legal/terms-checkbox'
import { authClient } from '@/lib/auth-client'

const fallbackError = "We couldn't complete that request. Check your details and try again."

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const existingAccount = mode === 'sign-up' && /already|exist|registered|duplicate/i.test(error)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'sign-up' && !agreed) {
      setError('Please agree to the Terms, Refund Policy and Privacy Policy to create an account.')
      return
    }

    setPending(true)
    setError('')

    try {
      const data = new FormData(event.currentTarget)
      const result = mode === 'sign-up'
        ? await authClient.signUp.email({
            email: String(data.get('email')),
            password: String(data.get('password')),
            name: String(data.get('name')),
          })
        : await authClient.signIn.email({
            email: String(data.get('email')),
            password: String(data.get('password')),
          })

      if (result.error) {
        setError(result.error.message || fallbackError)
        return
      }

      if (mode === 'sign-up') {
        await acceptTerms('sign_up').catch(() => null)
      }
      router.push('/onboarding')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : fallbackError)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-5 border border-border bg-card p-5 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">Ginicci / Northstar</p>
      <h1 className="text-3xl font-display sm:text-4xl">{mode === 'sign-up' ? 'Create your account.' : 'Welcome back.'}</h1>
      {mode === 'sign-up' && <input name="name" required placeholder="Your name" className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" />}
      <input name="email" type="email" required placeholder="Email address" className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" />
      <input name="password" type="password" required minLength={mode === 'sign-up' ? 12 : 8} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} placeholder={mode === 'sign-up' ? 'Password (12+ characters)' : 'Password'} className="min-h-12 w-full border border-border bg-background px-4 py-3 text-base" />
      {mode === 'sign-up' && <TermsCheckbox checked={agreed} onChange={setAgreed} />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {mode === 'sign-in' && <a href="/forgot-password" className="min-h-11 text-sm underline">Forgot password?</a>}
      {existingAccount && <a href="/sign-in" className="text-sm underline">This email already has an account. Sign in instead.</a>}
      <Button disabled={pending} className="min-h-11">{pending ? 'Please wait...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}</Button>
      <a href={mode === 'sign-up' ? '/sign-in' : '/sign-up'} className="min-h-11 text-center text-sm text-muted-foreground underline">{mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Create one'}</a>
    </form>
  )
}
