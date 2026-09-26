import { redirect } from 'next/navigation'
import { OnboardingAgent } from '@/components/onboarding/onboarding-agent'
import { getPlanContext } from '@/lib/plan-limits'
import { getUserSession } from '@/lib/session'

export default async function OnboardingPage() {
  const session = await getUserSession()
  if (!session?.user) redirect('/sign-in')
  const plan = await getPlanContext(session.user)

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
