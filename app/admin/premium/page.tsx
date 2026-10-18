import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { requireOwner } from '@/lib/owner'
import { pool } from '@/lib/db'
import { requireTestBilling } from '@/lib/premium-billing'
import { stripe } from '@/lib/stripe'
import { getTier } from '@/lib/tiers'
async function savePlan(form: FormData) {
  'use server'
  await requireOwner()
  requireTestBilling()
  const tier = String(form.get('tier') ?? '')
  const interval = String(form.get('interval') ?? '')
  const id = String(form.get('price') ?? '')
  const tasks = Number(form.get('tasks'))
  if (!getTier(tier) || tier === 'free' || !['monthly', 'annual'].includes(interval) || !/^price_[a-zA-Z0-9]+$/.test(id) || !Number.isInteger(tasks) || tasks < 1 || tasks > 10000) throw new Error('Invalid plan configuration')
  const price = await stripe.prices.retrieve(id)
  if (price.livemode || !price.active || !price.unit_amount || price.recurring?.interval !== (interval === 'annual' ? 'year' : 'month') || price.recurring.interval_count !== 1) throw new Error('Choose an active recurring Stripe test price')
  await pool.query(`INSERT INTO premium_plans(tier_id, interval, stripe_price_id, tasks_per_period, enabled) VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT(tier_id, interval) DO UPDATE SET stripe_price_id=$3, tasks_per_period=$4, enabled=$5`, [tier, interval, id, tasks, form.get('enabled') === 'on'])
  revalidatePath('/'); revalidatePath('/pricing'); revalidatePath('/admin/premium')
}
export default async function PremiumSettings() {
  await requireOwner()
  const { rows } = await pool.query('SELECT * FROM premium_plans ORDER BY tier_id, interval')
  return <main className="mx-auto max-w-2xl space-y-6 p-6"><Link href="/admin" className="underline">Owner console</Link><h1 className="font-display text-4xl">Premium plan settings</h1><p>Configure approved recurring prices in Stripe test mode. Prices are read directly from Stripe; clients cannot supply amounts. This does not enable production billing.</p><form action={savePlan} className="flex flex-col gap-4 rounded border p-5"><label>Plan<select name="tier" className="ml-3 border bg-background"><option value="plus">Plus</option><option value="team">Team</option><option value="pro">Pro</option></select></label><label>Billing interval<select name="interval" className="ml-3 border bg-background"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label><label>Stripe test price ID<input required name="price" className="block w-full border bg-background p-2" placeholder="price_…" /></label><label>Successful uses per billing period<input required name="tasks" type="number" min="1" max="10000" className="block w-full border bg-background p-2" /></label><label><input type="checkbox" name="enabled" /> Offer this plan in test checkout</label><button className="min-h-11 bg-foreground p-3 text-background">Save test plan</button></form><ul>{rows.map(p => <li key={`${p.tier_id}:${p.interval}`}>{p.tier_id} · {p.interval} · {p.tasks_per_period} uses · {p.enabled ? 'Enabled for testing' : 'Disabled'}</li>)}</ul></main>
}
