import { redirect } from 'next/navigation'
import { OnboardingAgent } from '@/components/onboarding/onboarding-agent'
import { getUserSession } from '@/lib/session'

export default async function OnboardingPage() {
  if (!(await getUserSession())) redirect('/sign-in')
  return <main className="h-dvh overflow-hidden bg-background"><OnboardingAgent /></main>
}
