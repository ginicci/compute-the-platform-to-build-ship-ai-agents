import { readChatBody, ChatInputError } from '@/lib/chat-input'
import { getUserSession } from '@/lib/session'
import { acknowledgePremium } from '@/lib/premium-usage'
export async function POST(request: Request) {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ code: 'sign_in_required' }, { status: 401 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ code: 'invalid_origin' }, { status: 403 })
  try {
    const body = await readChatBody(request) as { id?: unknown }
    const id = body?.id
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 400 })
    return Response.json({ ok: await acknowledgePremium(id, session.user.id) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return new Response(null, { status: error instanceof ChatInputError ? error.status : 503 }) }
}
