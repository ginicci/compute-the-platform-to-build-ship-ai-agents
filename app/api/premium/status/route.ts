import { premiumEnabled } from '@/lib/premium-policy'
import { getUserSession } from '@/lib/session'
import { premiumBalance } from '@/lib/premium-usage'
import { premiumPaidAccess } from '@/lib/premium-billing'
export async function GET() {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ code: 'sign_in_required' }, { status: 401 })
  if (!premiumEnabled()) return Response.json({ code: 'premium_paused' }, { status: 503 })
  try {
    const [balance, paid] = await Promise.all([premiumBalance(session.user.id), premiumPaidAccess(session.user.id)])
    return Response.json({ ...balance, paid: !!paid }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch { return Response.json({ code: 'premium_unavailable' }, { status: 503 }) }
}
