import type { Metadata } from 'next'
import { Assistant } from '@/components/pwa/assistant'
export const metadata: Metadata = { title: 'Ginicci Assistant', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'Ginicci', statusBarStyle: 'black-translucent' }, icons: { apple: '/pwa/apple-touch-icon.png' }, robots: { index: false } }
export default function AssistantPage() { return <Assistant /> }
