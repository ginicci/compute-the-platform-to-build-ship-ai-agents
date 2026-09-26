import { redirect } from 'next/navigation'
import { TermsGate } from '@/components/legal/terms-gate'
import { OnboardingAgent } from '@/components/onboarding/onboarding-agent'
import { hasCurrentConsent } from '@/lib/legal'
import { isOwnerEmail } from '@/lib/owner'
import { getPlanContext } from '@/lib/plan-limits'
import { getUserSession } from '@/lib/session'

export default async function OnboardingPage() {
  const session = await getUserSession()
  if (!session?.user) redirect('/sign-in')

  const isOwner = isOwnerEmail(session.user.email)
  const [plan, agreed] = await Promise.all([
    getPlanContext(session.user),
    isOwner ? Promise.resolve(true) : hasCurrentConsent(session.user.id),
  ])

  if (!agreed) {
    return (
      <main className="bg-background">
        <TermsGate />
      </main>
    )
  }

  return (
    <main className="h-dvh overflow-hidden bg-background">
      <OnboardingAgent
        plan={{
          name: plan.tier.name,
          allowedAgentIds: plan.allowedAgentIds,
          tasksLimit: plan.tasksLimit,
          tasksUsed: plan.tasksUsed,
        }}
      />
    </main>
  )
}
