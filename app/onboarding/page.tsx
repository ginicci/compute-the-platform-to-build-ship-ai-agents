import { redirect } from 'next/navigation'
import { OnboardingAgent } from '@/components/onboarding/onboarding-agent'
import { getUserSession } from '@/lib/session'

export default async function OnboardingPage() {
  if (!(await getUserSession())) redirect('/sign-in')
  return <main className="min-h-screen bg-background"><OnboardingAgent /></main>
}
