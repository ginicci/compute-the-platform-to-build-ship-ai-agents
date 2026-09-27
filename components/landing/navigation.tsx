"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguagePicker } from "@/components/i18n/language-picker";

const navLinks = [
  { name: "What you develop", href: "#features" },
  { name: "The North Star", href: "#how-it-works" },
  { name: "Ecosystem", href: "#infra" },
  { name: "How it works", href: "#integrations" },
  { name: "Commitments", href: "#security" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const chrome = isScrolled || isMobileMenuOpen;

  return (
    <header className={`fixed z-50 transition-all duration-300 ${isScrolled ? "top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4" : "top-0 inset-x-0"}`}>
      <nav className={`mx-auto transition-all duration-300 ${chrome ? "max-w-[1200px] rounded-2xl border border-foreground/10 bg-background/95 shadow-lg backdrop-blur-xl" : "max-w-[1400px]"}`} aria-label="Main navigation">
        <div className={`flex items-center justify-between px-4 sm:px-6 lg:px-8 ${isScrolled ? "h-14" : "h-16 sm:h-20"}`}>
          <a href="/" className="flex min-h-11 items-center gap-2">
            <span className={`font-display tracking-tight ${chrome ? "text-xl text-foreground" : "text-xl text-white sm:text-2xl"}`}>GINICCI</span>
            <span className={`font-mono ${chrome ? "text-[10px] text-muted-foreground" : "text-[10px] text-white/60 sm:text-xs"}`}>TM</span>
          </a>
          <div className="hidden items-center gap-6 lg:flex xl:gap-10">
            {navLinks.map((link) => <a key={link.name} href={link.href} className={`text-sm transition-colors hover:text-foreground ${chrome ? "text-foreground/70" : "text-white/70 hover:text-white"}`}>{link.name}</a>)}
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <LanguagePicker tone={chrome ? "dark" : "light"} />
            <a href="/sign-in" className={`inline-flex min-h-11 items-center text-sm transition-colors ${chrome ? "text-foreground/70 hover:text-foreground" : "text-white/70 hover:text-white"}`}>Sign in</a>
            <a href="/sign-up" className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors ${chrome ? "bg-foreground text-background hover:bg-foreground/90" : "bg-white text-black hover:bg-white/90"}`}>Request access</a>
          </div>
          <button type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} className={`inline-flex min-h-11 min-w-11 items-center justify-center md:hidden ${chrome ? "text-foreground" : "text-white"}`} aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMobileMenuOpen}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>
      <div className={`fixed inset-0 z-[-1] bg-background transition-opacity duration-200 md:hidden ${isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!isMobileMenuOpen}>
        <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-24">
          <div className="flex flex-1 flex-col justify-center gap-4">
            {navLinks.map((link) => <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 font-display text-4xl leading-none text-foreground sm:text-5xl">{link.name}</a>)}
          </div>
          <LanguagePicker className="mb-6 self-start" />
          <div className="grid grid-cols-2 gap-3 border-t border-foreground/10 pt-6">
            <a href="/sign-in" className="inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/20 text-base font-medium" onClick={() => setIsMobileMenuOpen(false)}>Sign in</a>
            <a href="/sign-up" className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground text-background text-base font-medium" onClick={() => setIsMobileMenuOpen(false)}>Request access</a>
          </div>
        </div>
      </div>
    </header>
  );
}
