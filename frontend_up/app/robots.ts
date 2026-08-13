import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/*/admin',
        '/*/dashboard',
        '/*/profile',
        '/*/billing',
        '/*/checkout',
        '/*/notifications',
        '/admin',
        '/dashboard',
        '/profile',
        '/billing',
        '/checkout',
        '/notifications',
      ],
    },
    sitemap: 'https://shramik-seva.com/sitemap.xml',
  }
}
