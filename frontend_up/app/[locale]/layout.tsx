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

export const metadata: Metadata = {
  title: "Shramik Seva - Job Marketplace for Skilled Workers",
  description:
    "Connect skilled workers with meaningful employment opportunities. Find jobs, hire talent, and build your career with Shramik Seva - the modern job marketplace.",
  keywords: ["job marketplace", "skilled workers", "employment", "hiring", "temporary jobs", "permanent jobs"],
  authors: [{ name: "Shramik Seva Team" }],
  creator: "Shramik Seva",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shramik-seva.com",
    siteName: "Shramik Seva",
    title: "Shramik Seva - Job Marketplace",
    description: "Connect skilled workers with employment opportunities",
    images: [{ url: "https://shramik-seva.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shramik Seva - Job Marketplace",
    description: "Connect skilled workers with employment opportunities",
  },
  generator: 'v0.app'
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
        <link rel="canonical" href="https://shramik-seva.com" />
      </head>
      <body className={`${notoSans.variable} ${notoSans.className} antialiased bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="shramik-theme">
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