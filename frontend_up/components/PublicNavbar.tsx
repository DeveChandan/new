"use client"

import { useState } from "react"
import { Link, useRouter } from "@/navigation"
import { motion } from "framer-motion"
import { Menu, X, ArrowUpRight, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslations } from 'next-intl'

interface PublicNavbarProps {
  showBack?: boolean
  backHref?: string
  backText?: string
  isHomePage?: boolean
  logoHref?: string
}

export default function PublicNavbar({ 
  showBack = false, 
  backHref, 
  backText = "Back",
  isHomePage = false,
  logoHref = "/"
}: PublicNavbarProps) {
  const router = useRouter()
  const tAuth = useTranslations('Auth')
  const tCommon = useTranslations('Common')
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-xl border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href={logoHref} className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent tracking-tight">
              {tCommon('appName')}
            </span>
          </Link>

          <div className="flex gap-3 items-center">
            {isHomePage ? (
              <>
                <div className="hidden xs:flex gap-2 items-center mr-4">
                  <LanguageSwitcher />
                  <div className="w-[1px] h-6 bg-border mx-1" />
                  <ThemeToggle />
                </div>
                {/* Desktop Navigation */}
                <div className="hidden sm:flex gap-4 items-center">
                  <Link href="/auth/login">
                    <Button variant="ghost" className="hover:bg-primary/90 font-medium">
                      {tAuth('login.cardTitle')}
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-full px-6 transition-all hover:px-8">
                      {tCommon('buttons.getStarted')}
                    </Button>
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full sm:hidden border-primary/20"
                  onClick={() => setIsMobileNavOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            ) : showBack ? (
              <div className="flex items-center gap-4">
                 <ThemeToggle />
                 <Button 
                    variant="ghost" 
                    className="gap-2" 
                    onClick={() => backHref ? router.push(backHref) : router.back()}
                  >
                    <ArrowLeft className="w-4 h-4" /> {backText}
                  </Button>
              </div>
            ) : (
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu (Only for Home Page) */}
      {isHomePage && (
        <div
          className={`fixed inset-0 bg-background/40 backdrop-blur-md z-[60] sm:hidden transition-opacity duration-300 ${isMobileNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsMobileNavOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: isMobileNavOpen ? 0 : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[300px] bg-card shadow-2xl p-8 border-l border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10">
              <span className="font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{tCommon('appName')}</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Preferences</p>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
                  <span className="text-sm font-medium">Language</span>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
                  <span className="text-sm font-medium">Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Get Started</p>
                <Link href="/auth/login" className="block" onClick={() => setIsMobileNavOpen(false)}>
                  <Button variant="outline" className="w-full justify-start rounded-2xl py-7 text-lg border-primary/20">
                    {tAuth('login.cardTitle')}
                    <ArrowUpRight className="ml-auto w-5 h-5 opacity-50" />
                  </Button>
                </Link>
                <Link href="/auth/register" className="block" onClick={() => setIsMobileNavOpen(false)}>
                  <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-7 text-lg shadow-xl shadow-primary/20">
                    {tCommon('buttons.getStarted')}
                    <ArrowRight className="ml-auto w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Spacer to prevent content from being covered by fixed navbar */}
      <div className="h-[73px]" aria-hidden="true" />
    </>
  )
}
