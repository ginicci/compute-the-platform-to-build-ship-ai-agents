import { redirect } from 'next/navigation'
import { OnboardingAgent } from '@/components/onboarding/onboarding-agent'
import { getOwnerSession } from '@/lib/owner-session'

export default async function OnboardingPage() {
  if (!(await getOwnerSession())) redirect('/sign-in')
  return <main className="min-h-screen bg-background"><OnboardingAgent /></main>
}
