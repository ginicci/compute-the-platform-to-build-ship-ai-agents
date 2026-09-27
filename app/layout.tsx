import React from "react"
import type { Metadata, Viewport } from 'next'
import { siteUrl } from '@/lib/site'
import { getLocale } from '@/lib/i18n/get-locale'
import { isRtl } from '@/lib/i18n/locales'
import { PageTranslator } from '@/components/i18n/page-translator'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

const title = 'Northstar by Ginicci — AI agents for your business, from $0'
const description =
  'Run AI agents that grow your business, career, and network. Start free, or try Plus for 14 days free. Plans from $20/month.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s | Northstar by Ginicci' },
  description,
  applicationName: 'Northstar by Ginicci',
  keywords: ['AI agents', 'business automation', 'AI assistant for founders', 'professional growth', 'Ginicci', 'Northstar'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Northstar by Ginicci',
    title,
    description,
  },
  twitter: { card: 'summary_large_image', title, description },
  robots: { index: true, follow: true },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? 'rtl' : 'ltr'}
      data-i18n-pending={locale === 'en' ? undefined : ''}
      suppressHydrationWarning
    >
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <PageTranslator locale={locale} />
        <Analytics />
      </body>
    </html>
  )
}
