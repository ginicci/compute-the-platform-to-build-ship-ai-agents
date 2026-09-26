"use client"

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { Check } from "lucide-react"
import { confirmCheckout } from "@/app/actions/billing"
import { startSubscriptionCheckout } from "@/app/actions/stripe"
import { TermsCheckbox } from "@/components/legal/terms-checkbox"
import type { BillingInterval } from "@/lib/tiers"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

export function CheckoutForm({
  tierId,
  interval,
}: {
  tierId: string
  interval: BillingInterval
}) {
  const [isComplete, setIsComplete] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const sessionIdRef = useRef<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    const { clientSecret, sessionId } = await startSubscriptionCheckout(tierId, interval, true)
    if (!clientSecret) throw new Error("Could not start checkout")
    sessionIdRef.current = sessionId
    return clientSecret
  }, [tierId, interval])

  const handleComplete = useCallback(async () => {
    setIsComplete(true)
    if (!sessionIdRef.current) return
    try {
      await confirmCheckout(sessionIdRef.current)
    } catch (error) {
      // The Stripe webhook records the plan as a backup.
      console.error("Could not confirm checkout", error)
    }
  }, [])

  if (isComplete) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 border border-foreground/10 p-6">
        <span className="flex size-10 items-center justify-center bg-foreground text-background">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-display text-2xl">{"You're subscribed."}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your plan is active. A receipt is on its way to your inbox.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/onboarding"
            className="inline-flex min-h-11 items-center bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Continue to Northstar
          </Link>
          <Link
            href="/account"
            className="inline-flex min-h-11 items-center border border-foreground/20 px-5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            View your plan
          </Link>
        </div>
      </div>
    )
  }

  if (!confirmed) {
    return (
      <div className="flex flex-col gap-5 border border-foreground/10 p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your plan renews automatically until you cancel. You can cancel anytime from your account page and keep
          access until the end of the period you&apos;ve paid for. Paid periods aren&apos;t refundable once they
          start, so use your free trial to try it out.
        </p>
        <TermsCheckbox id="checkout-terms" checked={agreed} onChange={setAgreed} />
        <button
          type="button"
          disabled={!agreed}
          onClick={() => setConfirmed(true)}
          className="inline-flex min-h-11 items-center justify-center bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to payment
        </button>
      </div>
    )
  }

  return (
    <div id="checkout" className="overflow-hidden rounded-md">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete: handleComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
