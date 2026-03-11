"use client"

import type React from "react"
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
  Bell
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl'

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

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
    { href: "/admin/users", icon: Users, labelKey: "users" },
    { href: "/admin/jobs", icon: ClipboardList, labelKey: "jobs" },
    { href: "/admin/ratings", icon: Star, labelKey: "ratings" },
    { href: "/admin/documents", icon: FileText, labelKey: "documents" },
    { href: "/admin/disputes", icon: Gavel, labelKey: "disputes" },
    { href: "/admin/subscriptions", icon: CreditCard, labelKey: "subscriptions" },
    { href: "/admin/payments", icon: Receipt, labelKey: "payments" },
    { href: "/admin/notification-center", icon: Bell, labelKey: "notificationCenter" },
    { href: "/admin/worklogs", icon: Briefcase, labelKey: "worklogs" },
  ]

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
        <div className="flex items-center justify-between mb-6 lg:justify-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-primary" />
            <span className="lg:hidden xl:inline">{t('admin')}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 rounded-full h-11 ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-primary/10"
                    }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-transparent text-foreground rounded-full h-10"
            >
              <LogOut className="w-4 h-4" />
              <span className="lg:hidden xl:inline">{tCommon('buttons.logout')}</span>
            </Button>
          </div>

          {/* User Info - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:block border-t pt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-card/95 border-b border-border/50 backdrop-blur-lg p-4 flex items-center justify-between lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center">
            <Link href="/admin/dashboard" className="text-lg font-semibold text-foreground">
              {t('adminPanel')}
            </Link>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Mobile Footer */}
        {/* <footer className="lg:hidden border-t border-border/50 p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">Admin</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full"
            >
              Logout
            </Button>
          </div>
        </footer> */}
      </div>
    </div>
  )
}