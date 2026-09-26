"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { Check } from "lucide-react"
import { startSubscriptionCheckout } from "@/app/actions/stripe"
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

  const fetchClientSecret = useCallback(async () => {
    const clientSecret = await startSubscriptionCheckout(tierId, interval)
    if (!clientSecret) throw new Error("Could not start checkout")
    return clientSecret
  }, [tierId, interval])

  if (isComplete) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 border border-foreground/10 p-6">
        <span className="flex size-10 items-center justify-center bg-foreground text-background">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-display text-2xl">{"You're subscribed."}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your payment went through. A receipt is on its way to your inbox.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex min-h-11 items-center bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Continue to Northstar
        </Link>
      </div>
    )
  }

  return (
    <div id="checkout" className="overflow-hidden rounded-md">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete: () => setIsComplete(true) }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
