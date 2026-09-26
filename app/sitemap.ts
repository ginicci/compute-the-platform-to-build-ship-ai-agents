import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/sign-up`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/sign-in`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/refund-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
