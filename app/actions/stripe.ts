"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { getTier, type BillingInterval } from "@/lib/tiers"

function randomSuffix() {
  return Array.from({ length: 8 }, () =>
    "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)],
  ).join("")
}

export async function startSubscriptionCheckout(
  tierId: string,
  interval: BillingInterval,
) {
  // Validate the tier and interval server-side; never trust a client price.
  const tier = getTier(tierId)
  if (!tier) throw new Error("Invalid tier")
  if (interval !== "monthly" && interval !== "annual") {
    throw new Error("Invalid billing interval")
  }

  const session = await auth.api.getSession({ headers: await headers() })

  // `annual` cents are the per-month equivalent; bill the full year up front.
  const unitAmount =
    interval === "annual"
      ? tier.priceInCents.annual * 12
      : tier.priceInCents.monthly

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
      metadata: {
        tierId: tier.id,
        interval,
        ...(session?.user?.id ? { userId: session.user.id } : {}),
      },
    },
    metadata: {
      tierId: tier.id,
      interval,
      ...(session?.user?.id ? { userId: session.user.id } : {}),
    },
  })

  return checkout.client_secret
}
