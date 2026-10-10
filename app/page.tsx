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
      <Navigation />
      <HeroSection />
      <div className="px-6 py-4"><a className="underline" href="/assistant">Open Ginicci Assistant</a> · <a href="/install" className="underline">Install on your phone</a></div>
      <section className="mx-auto max-w-5xl px-6 py-8"><h2 className="text-3xl">Ginicci for your business</h2><p>Explore practical business services without spending AI credits. AI trials are limited and checkout is paused during launch verification.</p><a className="underline" href="/services">Explore services and share Ginicci</a></section>
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
