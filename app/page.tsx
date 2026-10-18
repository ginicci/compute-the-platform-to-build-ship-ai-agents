import Link from 'next/link'
import { AppAccess } from '@/components/access/app-access'

export default function Home() {
  return <main className="min-h-dvh bg-background text-foreground">
    <a href="#welcome" className="sr-only focus:not-sr-only focus:inline-flex focus:p-4">Skip to content</a>
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-xl font-semibold">Ginicci</Link>
      <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-5 text-sm">
        <Link className="inline-flex min-h-11 items-center underline" href="/pricing">Explore Premium</Link>
        <Link className="inline-flex min-h-11 items-center underline" href="/sign-in">Sign in</Link>
      </nav>
    </header>
    <section id="welcome" aria-labelledby="welcome-title" className="mx-auto max-w-5xl px-5 py-12 sm:py-20">
      <p className="mb-4 text-sm text-muted-foreground">Your AI companion for everyday questions and bigger ideas</p>
      <h1 id="welcome-title" className="max-w-3xl font-display text-5xl tracking-tight sm:text-7xl">A clearer thought.<br />A useful next step.</h1>
      <p className="my-6 max-w-xl text-lg text-muted-foreground">Ask a question, work through an idea, or get help writing something. Ginicci helps you move forward, one conversation at a time.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/assistant" className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 font-medium text-background">Start chatting free</Link>
        <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-full border px-6">Explore Premium</Link>
      </div>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">Try the chat interface without an account. Guest replies are labeled demos, not live AI. Sign in to check access to your six-successful-use Premium trial. No card required for the trial.</p>
    </section>
    <section aria-labelledby="possibilities" className="mx-auto max-w-5xl px-5 pb-12">
      <h2 id="possibilities" className="mb-5 text-2xl">What would help today?</h2>
      <div className="grid gap-4 sm:grid-cols-3">{[
        ['Find the words', 'Draft a thoughtful reply or make an idea easier to explain.'],
        ['Make a plan', 'Break a big task into a few manageable steps.'],
        ['Think it through', 'Explore options and decide what to try next.'],
      ].map(([title, body]) => <article key={title} className="rounded-2xl border p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{body}</p></article>)}</div>
      <p className="mt-5 text-sm text-muted-foreground">Ginicci is AI, not a person. Check important advice. It does not make bookings, send payments, or take actions outside this chat. Live voice is an experimental test-only capability, not a Premium promise.</p>
    </section>
    <AppAccess />
    <section className="mx-auto max-w-5xl space-y-4 px-5 py-12" aria-labelledby="your-account">
      <h2 id="your-account" className="text-2xl">Pick up where you left off</h2>
      <p className="max-w-2xl text-muted-foreground">Use the same account on the website and installed app. Save a conversation, or opt into autosave, then resume it from Conversations & preferences on either screen. Unsaved drafts do not sync.</p>
      <Link className="inline-flex min-h-11 items-center underline" href="/help">Help with your account, conversations and voice</Link>
    </section>
    <footer className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 border-t px-5 py-6 text-sm">{[['/help','Help'],['/privacy','Privacy'],['/terms','Terms'],['/refund-policy','Refund policy'],['/account','Billing & account']].map(([href,label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center underline">{label}</Link>)}</footer>
  </main>
}
