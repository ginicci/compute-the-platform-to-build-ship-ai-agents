'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('')
    const data = new FormData(event.currentTarget)
    const result = mode === 'sign-up' ? await authClient.signUp.email({ email: String(data.get('email')), password: String(data.get('password')), name: String(data.get('name')) }) : await authClient.signIn.email({ email: String(data.get('email')), password: String(data.get('password')) })
    if (result.error) setError("We couldn't complete that request. Check your details and try again.")
    else { router.push('/onboarding'); router.refresh() }
    setPending(false)
  }
  return <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-5 border border-border bg-card p-8"><p className="font-mono text-xs uppercase tracking-widest text-primary">Ginicci / Northstar</p><h1 className="text-4xl font-display">{mode === 'sign-up' ? 'Create your account.' : 'Welcome back.'}</h1>{mode === 'sign-up' && <input name="name" required placeholder="Your name" className="border border-border bg-background px-4 py-3 text-sm" /> }<input name="email" type="email" required placeholder="Email address" className="border border-border bg-background px-4 py-3 text-sm" /><input name="password" type="password" required minLength={8} placeholder="Password" className="border border-border bg-background px-4 py-3 text-sm" />{error && <p className="text-sm text-destructive">{error}</p>}<Button disabled={pending}>{pending ? 'Please wait...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}</Button><a href={mode === 'sign-up' ? '/sign-in' : '/sign-up'} className="text-center text-sm text-muted-foreground underline">{mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Create one'}</a></form>
}
