"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter, usePathname } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import {
  Briefcase,
  LayoutDashboard,
  Users,
  ClipboardList,
  Star,
  FileText,
  Gavel,
  LogOut,
  Menu,
  X,
  Loader2,
  CreditCard,
  Receipt,
  Bell,
  Headset,
  ChevronRight,
  Search,
  Settings,
  Sparkles
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl'
import { NotificationBell } from "@/components/NotificationBell"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Admin.layout')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const navGroups = [
    {
      titleKey: "platform",
      items: [
        { href: "/admin/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
        { href: "/admin/notification-center", icon: Bell, labelKey: "notificationCenter" },
      ]
    },
    {
      titleKey: "management",
      items: [
        { href: "/admin/users", icon: Users, labelKey: "users" },
        { href: "/admin/jobs", icon: ClipboardList, labelKey: "jobs" },
        { href: "/admin/documents", icon: FileText, labelKey: "documents" },
        { href: "/admin/worklogs", icon: Briefcase, labelKey: "worklogs" },
      ]
    },
    {
      titleKey: "revenue",
      items: [
        { href: "/admin/subscriptions", icon: CreditCard, labelKey: "subscriptions" },
        { href: "/admin/payments", icon: Receipt, labelKey: "payments" },
      ]
    },
    {
      titleKey: "feedback",
      items: [
        { href: "/admin/support", icon: Headset, labelKey: "support" },
        { href: "/admin/disputes", icon: Gavel, labelKey: "disputes" },
        { href: "/admin/ratings", icon: Star, labelKey: "ratings" },
        { href: "/admin/testimonials", icon: Sparkles, labelKey: "testimonials" },
      ]
    }
  ]

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    // Remove locale segment
    if (segments.length > 0 && segments[0].length === 2) {
      segments.shift()
    }

    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      // Convert kebab-case to camelCase for translation keys (e.g., notification-center -> notificationCenter)
      const translationKey = segment === 'admin'
        ? 'admin'
        : segment.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

      return {
        label: t(translationKey),
        href,
        isCurrent: index === segments.length - 1
      }
    })
  }

  const breadcrumbs = getBreadcrumbs()

  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'A'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background/95 border-r border-border/50 backdrop-blur-md p-4 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:bg-background/40`}
      >
        <div className="flex items-center gap-2 px-2 mb-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight">{t('admin')}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t('adminPanel')}</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-auto h-8 w-8"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 px-2 space-y-6 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.titleKey} className="space-y-1">
              <h4 className="px-4 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] mb-2">
                {t(`categories.${group.titleKey}`)}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.includes(item.href)
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 rounded-lg h-10 px-4 transition-all duration-200 ${isActive
                          ? "bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/70"}`} />
                        <span className="text-sm">{t(item.labelKey)}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto px-2 pt-4 border-t border-border/50">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-10 px-4 mb-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{tCommon('buttons.logout')}</span>
          </Button>

          <div className="p-3 bg-accent/30 rounded-xl border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate leading-none mb-1">{user.name || user.email}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground truncate capitalize">{user.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 rounded-md">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 bg-background/60 border-b border-border/50 backdrop-blur-xl px-8 items-center justify-between">
          <div className="flex items-center gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/admin/dashboard" className="text-muted-foreground/60 hover:text-primary transition-colors">
                      {t('admin')}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.href}>
                    <BreadcrumbSeparator className="text-muted-foreground/40" />
                    <BreadcrumbItem>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage className="font-bold tracking-tight">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href} className="text-muted-foreground/60 hover:text-primary transition-colors italic">
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            {/* <div className="px-3 h-9 bg-accent/40 rounded-full border border-border/40 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
              <Search className="w-4 h-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-xs w-32 focus:w-48 transition-all duration-300 placeholder:text-muted-foreground/40"
              />
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-mono bg-background/50 px-1 border border-border/40 rounded uppercase">
                <kbd className="font-sans">Ctrl</kbd>+K
              </div>
            </div> */}

            <Separator orientation="vertical" className="h-6 mx-1" />

            <NotificationBell />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-background/80 border-b border-border/50 backdrop-blur-lg p-4 flex items-center justify-between lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center">
            <Link href="/admin/dashboard" className="text-lg font-semibold text-foreground">
              {t('adminPanel')}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="lg:hidden"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-x-hidden">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}