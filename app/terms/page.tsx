import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactLine, LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service | Northstar by Ginicci',
  description: 'The terms that apply when you use Northstar by Ginicci.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="September 26, 2026" current="/terms">
      <p>
        These terms are an agreement between you and Ginicci (&ldquo;we&rdquo;, &ldquo;us&rdquo;) for your use of
        Northstar, including our website, AI agents and paid plans (the &ldquo;Service&rdquo;). By creating an
        account, checking the agreement box or using the Service, you accept these terms.
      </p>

      <section>
        <h2>1. Your account</h2>
        <ul>
          <li>You must be at least 18 and give accurate sign-up details.</li>
          <li>You&apos;re responsible for keeping your password safe and for all activity on your account.</li>
          <li>One person per account. Don&apos;t share, resell or transfer your account.</li>
        </ul>
      </section>

      <section>
        <h2>2. Plans, trials and billing</h2>
        <ul>
          <li>
            Paid plans are subscriptions billed in advance, monthly or yearly, and <strong>renew automatically</strong>{' '}
            until you cancel.
          </li>
          <li>
            Free trials are for first-time subscribers. If you don&apos;t cancel before the trial ends, your paid plan
            starts and your payment method is charged.
          </li>
          <li>Payments are processed by Stripe. We never see or store your full card details.</li>
          <li>
            Each plan includes the agents and monthly task allowance shown on our pricing page. Unused tasks
            don&apos;t roll over.
          </li>
          <li>We may change prices with at least 30 days&apos; notice. Changes apply from your next renewal.</li>
        </ul>
      </section>

      <section>
        <h2>3. Cancellations and refunds</h2>
        <p>
          You can cancel anytime from your account page. Refunds follow our{' '}
          <Link href="/refund-policy" className="text-foreground underline underline-offset-4">
            Refund Policy
          </Link>
          , which is part of these terms.
        </p>
      </section>

      <section>
        <h2>4. AI answers are information, not professional advice</h2>
        <p>
          Northstar agents generate answers automatically and can be wrong or out of date. Answers about investing,
          stocks, crypto, money, taxes, legal or career topics are <strong>general information only</strong>, not
          financial, investment, tax or legal advice. Check important decisions with a qualified professional. You
          are responsible for how you use the answers.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <ul>
          <li>Don&apos;t use the Service for anything illegal, harmful, fraudulent or abusive.</li>
          <li>Don&apos;t try to get around plan limits, security measures or other people&apos;s accounts.</li>
          <li>Don&apos;t overload, scrape or reverse-engineer the Service.</li>
        </ul>
        <p>We may suspend or close accounts that break these rules, without a refund.</p>
      </section>

      <section>
        <h2>6. Records we keep</h2>
        <p>
          To run the Service, prevent fraud and resolve billing questions or payment disputes, we keep records of
          your sign-up, your agreement to these terms (with date, time, IP address and browser), your sign-ins, your
          plan and payments, and each agent task you run (date, time and which agent). We don&apos;t store the text of
          your conversations. You agree we may share these records with our payment processor, your bank or card
          issuer if you dispute a charge.
        </p>
      </section>

      <section>
        <h2>7. Your content and our Service</h2>
        <p>
          You keep ownership of what you type and of the answers you receive, to the extent the law allows. We own
          the Service, our brand and our software.
        </p>
      </section>

      <section>
        <h2>8. Disclaimers and limits on liability</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the fullest extent the law
          allows, we aren&apos;t liable for indirect or consequential losses, lost profits or losses from decisions
          you make based on AI answers. Our total liability is limited to the amount you paid us in the 12 months
          before the claim.
        </p>
      </section>

      <section>
        <h2>9. Changes to these terms</h2>
        <p>
          We may update these terms. If a change is significant, we&apos;ll ask you to agree again before you keep
          using the Service.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <ContactLine />
      </section>
    </LegalPage>
  )
}
