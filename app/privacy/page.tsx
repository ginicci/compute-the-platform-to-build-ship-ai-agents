import type { Metadata } from 'next'
import { ContactLine, LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Northstar by Ginicci',
  description: 'What information Northstar by Ginicci collects and how it is used.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="September 26, 2026" current="/privacy">
      <p>This policy explains what information we collect when you use Northstar and how we use it.</p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email and a securely scrambled (hashed) password.
          </li>
          <li>
            <strong>Agreement records:</strong> when you accepted our terms, which version, your IP address and
            browser.
          </li>
          <li>
            <strong>Activity records:</strong> your sign-ins and each agent task you run, with the date, time and
            agent used. <strong>We don&apos;t store the text of your conversations.</strong>
          </li>
          <li>
            <strong>Billing:</strong> your plan, billing dates and amounts. Card details are handled by Stripe and
            never reach our servers.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To run your account, enforce plan limits and bill you.</li>
          <li>To keep the Service secure and prevent fraud and abuse.</li>
          <li>To answer support requests and resolve billing questions or payment disputes.</li>
        </ul>
        <p>We don&apos;t sell your personal information.</p>
      </section>

      <section>
        <h2>Who helps us run the Service</h2>
        <ul>
          <li>Stripe, for payments.</li>
          <li>Vercel, for hosting.</li>
          <li>Neon, for our database.</li>
          <li>AI model providers, through Vercel AI Gateway, to generate agent answers from the messages you send.</li>
          <li>Resend, for account and billing emails.</li>
        </ul>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep account, agreement, billing and activity records while your account is open and for up to 7 years
          afterward, as needed for tax, accounting and dispute purposes. After that, we delete or anonymize them.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can ask us for a copy of your information or ask us to delete your account. We may keep billing and
          agreement records where the law requires it.
        </p>
        <ContactLine />
      </section>
    </LegalPage>
  )
}
