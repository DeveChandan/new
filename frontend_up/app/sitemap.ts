import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as']
  const routes = ['', '/about', '/contact', '/jobs', '/privacy-policy', '/refund-policy', '/terms', '/subscriptions']
  const baseUrl = 'https://shramik-seva.com'

  const sitemapEntries: MetadataRoute.Sitemap = []

  routes.forEach((route) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '/jobs' || route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : route === '/jobs' ? 0.9 : 0.6,
      })
    })
  })

  return sitemapEntries
}
