import { auth } from '@/lib/auth'
import { notifyOwner } from '@/lib/owner-alerts'
import { toNextJsHandler } from 'better-auth/next-js'

const handlers = toNextJsHandler(auth)

export const GET = handlers.GET

export async function POST(request: Request) {
  const response = await handlers.POST(request)

  if (new URL(request.url).pathname.endsWith('/sign-in/email') && !response.ok) {
    await notifyOwner({
      subject: 'Failed sign-in attempt',
      text: `A Northstar email/password sign-in request was rejected with HTTP ${response.status}. IP: ${request.headers.get('x-forwarded-for') ?? 'unavailable'}.`,
    })
  }

  return response
}
