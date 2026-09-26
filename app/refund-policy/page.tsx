import type { Metadata } from 'next'
import { ContactLine, LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Refund Policy | Northstar by Ginicci',
  description: 'How free trials, cancellations and refunds work on Northstar by Ginicci.',
}

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" effectiveDate="September 26, 2026" current="/refund-policy">
      <p>
        We want you to know exactly what you&apos;re paying for before you pay. That&apos;s why every paid plan
        starts with a free trial.
      </p>

      <section>
        <h2>Try it free first</h2>
        <ul>
          <li>Plus and Team include a 14-day free trial. Pro includes a 7-day free trial.</li>
          <li>Cancel any time before the trial ends and you won&apos;t be charged anything.</li>
          <li>The Free plan is free forever and never charges you.</li>
        </ul>
      </section>

      <section>
        <h2>After a paid period starts</h2>
        <ul>
          <li>
            <strong>Payments are non-refundable once a paid period starts</strong>, including partly used months or
            years and unused tasks.
          </li>
          <li>
            You can cancel anytime from your account page. Your plan stays active until the end of the period
            you&apos;ve already paid for, and you won&apos;t be charged again.
          </li>
          <li>If you switch plans, Stripe adjusts the price for the rest of your current period.</li>
        </ul>
      </section>

      <section>
        <h2>When we do refund</h2>
        <p>We&apos;ll refund you if, within 30 days of the charge, you tell us that:</p>
        <ul>
          <li>You were charged twice for the same period.</li>
          <li>You were charged after cancelling before your trial ended.</li>
          <li>You were charged the wrong amount because of our mistake.</li>
          <li>The Service was unavailable to you for more than 72 hours in a row because of a problem on our side.</li>
        </ul>
        <p>
          If the law where you live gives you a right to a refund or to cancel within a set time, we&apos;ll honor
          it.
        </p>
      </section>

      <section>
        <h2>Please contact us before disputing a charge</h2>
        <p>
          Most billing problems can be fixed quickly. If you file a chargeback with your bank instead, we&apos;ll
          respond with our records of your account, your agreement to these terms and your use of the Service.
        </p>
        <ContactLine />
      </section>
    </LegalPage>
  )
}
