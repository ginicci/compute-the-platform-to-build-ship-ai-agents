import Link from 'next/link';
import { AppAccess } from '@/components/access/app-access';
import { PremiumAccessBanner } from '@/components/premium/access-banner';
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { MetricsSection } from "@/components/landing/metrics-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { AgentStackSection } from "@/components/landing/agent-stack-section";
import { SecuritySection } from "@/components/landing/security-section";
import { DevelopersSection } from "@/components/landing/developers-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <a href="#welcome" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-background focus:p-4">Skip to content</a>
      <Navigation />
      <HeroSection />
      <div className="mx-auto max-w-[1400px] space-y-8 px-5 py-12 sm:px-6 lg:px-12">
        <AppAccess />
        <PremiumAccessBanner />
        <section className="mx-auto max-w-5xl space-y-4 px-5 py-12" aria-labelledby="your-account">
          <h2 id="your-account" className="text-2xl">Pick up where you left off</h2>
          <p className="max-w-2xl text-muted-foreground">Use the same account on the website and installed app. Save a conversation, or opt into autosave, then resume it from Conversations & preferences on either screen. Unsaved drafts do not sync.</p>
          <Link className="inline-flex min-h-11 items-center underline" href="/help">Help with your account, conversations and voice</Link>
        </section>
      </div>
      <aside className="mx-auto max-w-[1400px] border-y px-6 py-6 text-sm text-muted-foreground" aria-label="Ecosystem preview">
        The original ecosystem sections below present Ginicci’s vision and illustrative design examples, not verified performance, customer endorsements or currently available integrations. Chat, saved conversations and account access are available through the app. Live voice remains experimental and test-only. <Link href="/help" className="underline">Check current capabilities</Link>.
      </aside>
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      <MetricsSection />
      <IntegrationsSection />
      <AgentStackSection />
      <SecuritySection />
      <DevelopersSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
