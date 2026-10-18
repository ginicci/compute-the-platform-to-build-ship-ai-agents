'use client'
export async function acknowledgePremiumResult(id: string) {
  const response = await fetch('/api/premium/acknowledge', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  })
  if (!response.ok) throw new Error('Result saved; delivery acknowledgement unavailable')
  window.dispatchEvent(new Event('premium-balance'))
}
export function refreshPremiumBalance() { window.dispatchEvent(new Event('premium-balance')) }
