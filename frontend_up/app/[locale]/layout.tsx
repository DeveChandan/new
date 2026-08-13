import type React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { SubscriptionProvider } from "@/contexts/SubscriptionContext"
import LoadingBar from "@/components/LoadingBar"
import "../globals.css"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-noto-sans",
})

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let messages: any = {};
  try {
    messages = await getMessages({ locale });
  } catch (e) {
    // fallback
  }

  const meta = messages.Metadata || {
    title: "Shramik Seva - Job Marketplace for Skilled Workers",
    description: "Connect skilled workers with meaningful employment opportunities. Find jobs, hire talent, and build your career with Shramik Seva - the modern job marketplace.",
    keywords: "job marketplace, skilled workers, employment, hiring, temporary jobs, permanent jobs",
    ogTitle: "Shramik Seva - Job Marketplace",
    ogDescription: "Connect skilled workers with employment opportunities"
  };

  const locales = ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as'];
  const languageAlternates: Record<string, string> = {};
  locales.forEach((loc) => {
    languageAlternates[loc] = `https://shramik-seva.com/${loc}`;
  });

  const keywordsArray = typeof meta.keywords === 'string'
    ? meta.keywords.split(',').map((k: string) => k.trim())
    : ["job marketplace", "skilled workers", "employment", "hiring"];

  return {
    title: meta.title,
    description: meta.description,
    keywords: keywordsArray,
    authors: [{ name: "Shramik Seva Team" }],
    creator: "Shramik Seva",
    alternates: {
      canonical: `https://shramik-seva.com/${locale}`,
      languages: {
        ...languageAlternates,
        'x-default': 'https://shramik-seva.com/en'
      }
    },
    openGraph: {
      type: "website",
      locale: `${locale}_IN`,
      url: `https://shramik-seva.com/${locale}`,
      siteName: "Shramik Seva",
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      images: [{ url: "https://shramik-seva.com/logo.png", width: 512, height: 512 }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
    },
    generator: 'v0.app'
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#6366f1" },
  ],
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${notoSans.variable} ${notoSans.className} antialiased bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="shramik-theme">
          <NextIntlClientProvider messages={messages}>
            <NotificationProvider>
              <SubscriptionProvider>
                <LoadingBar />
                {children}
              </SubscriptionProvider>
            </NotificationProvider>
          </NextIntlClientProvider>
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}