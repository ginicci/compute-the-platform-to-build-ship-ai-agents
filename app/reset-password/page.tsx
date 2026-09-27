import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/password-recovery'

export default function ResetPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6"><Suspense><ResetPasswordForm /></Suspense></main>
}
