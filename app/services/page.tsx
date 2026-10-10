import type { Metadata } from 'next'
import Link from 'next/link'
export const metadata: Metadata = {
  title: 'Ginicci business services | Practical AI for entrepreneurs',
  description: 'Explore Ginicci for customer support, marketing drafts and business planning. Browse free, with a limited sign-in-only text trial when launch controls are verified.',
  openGraph: { title: 'Ginicci for your business', description: 'Customer support, marketing drafts and business planning — explore without AI charges.' },
}
export default function Services() {
  return <main className="mx-auto max-w-4xl space-y-8 px-6 py-16">
    <Link href="/">← Ginicci</Link><h1 className="text-5xl">Practical help for your business</h1>
    <p>For entrepreneurs, small businesses and teams: discover where AI could save time before paying for it. These are use cases to explore, not promises of autonomous execution.</p>
    <section><h2 className="text-2xl">Customer support</h2><p>Draft clear answers to common questions for human review.</p></section>
    <section><h2 className="text-2xl">Marketing and organic growth</h2><p>Outline helpful posts, service descriptions and outreach messages. Publish manually to your existing social channels; no paid advertising or background agents required.</p></section>
    <section><h2 className="text-2xl">Business planning</h2><p>Organize ideas and next steps. Validate financial and professional decisions with qualified advisers.</p></section>
    <section id="launch"><h2 className="text-2xl">Transparent launch allowance</h2><p>Browsing is free and makes no AI calls. The text-only trial requires sign-up and is paused until spending controls are verified. Once enabled: 5 requests total per account, at most 3 per UTC day and 1 per minute; responses up to 256 tokens. A shared launch cap may pause access earlier. No unlimited AI.</p><p>Checkout and paid features are not available yet. Proposed plan prices are not an offer; settlement, refunds and usage accounting must pass isolated tests first.</p></section>
    <Link className="inline-block underline" href="/sign-up">Join Ginicci</Link>
    <section><h2 className="text-2xl">Share with a business owner</h2><p>Copy this page’s link into a personal introduction, your social profile or a helpful community post. No referral payout or automatic messaging.</p><Link className="underline" href="/services?ref=community">Shareable community referral link</Link></section>
  </main>
}
