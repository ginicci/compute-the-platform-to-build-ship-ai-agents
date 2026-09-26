"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { recordConsent, TERMS_VERSION } from "@/lib/legal"
import { stripe } from "@/lib/stripe"
import { getLatestSubscription, hasAccess } from "@/lib/subscriptions"
import { getTier, isPaidTier, type BillingInterval } from "@/lib/tiers"

function randomSuffix() {
  return Array.from({ length: 8 }, () =>
    "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)],
  ).join("")
}

export async function startSubscriptionCheckout(
  tierId: string,
  interval: BillingInterval,
  acceptedTerms: boolean,
) {
  if (acceptedTerms !== true) {
    throw new Error("Please agree to the Terms and Refund Policy to continue.")
  }
  // Validate the tier and interval server-side; never trust a client price.
  const tier = getTier(tierId)
  if (!tier || !isPaidTier(tier)) throw new Error("Invalid tier")
  if (interval !== "monthly" && interval !== "annual") {
    throw new Error("Invalid billing interval")
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new Error("Unauthorized")
  }

  const existing = await getLatestSubscription(session.user.id)
  if (existing && hasAccess(existing.status)) {
    throw new Error("You already have an active plan. Manage it from your account page.")
  }
  // Free trials are for first-time subscribers only.
  const trialDays = existing ? 0 : tier.trialDays

  // `annual` cents are the per-month equivalent; bill the full year up front.
  const unitAmount =
    interval === "annual"
      ? tier.priceInCents.annual * 12
      : tier.priceInCents.monthly

  await recordConsent(
    session.user.id,
    "checkout",
    JSON.stringify({ tierId: tier.id, interval, unitAmount, trialDays }),
  )
  const termsAcceptedAt = new Date().toISOString()

  const checkout = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "subscription",
    redirect_on_completion: "never",
    integration_identifier: `northstar-onboarding-${randomSuffix()}`,
    ...(session?.user?.email ? { customer_email: session.user.email } : {}),
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Northstar ${tier.name}`,
            description: tier.description,
          },
          unit_amount: unitAmount,
          recurring: {
            interval: interval === "annual" ? "year" : "month",
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      metadata: {
        tierId: tier.id,
        interval,
        userId: session.user.id,
        termsVersion: TERMS_VERSION,
        termsAcceptedAt,
      },
    },
    metadata: {
      tierId: tier.id,
      interval,
      userId: session.user.id,
      termsVersion: TERMS_VERSION,
      termsAcceptedAt,
    },
  })

  return { clientSecret: checkout.client_secret, sessionId: checkout.id }
}
