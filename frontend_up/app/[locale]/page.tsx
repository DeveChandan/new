"use client"

import { useState, useEffect } from "react"
import { Link } from '@/navigation';
import { motion, Variants } from "framer-motion"
import { ArrowRight, Briefcase, Users, Zap, Shield, Clock, TrendingUp, Menu, X, ArrowUpRight, Search, CheckCircle2, Star, Sparkles, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl';
import { ThemeToggle } from "@/components/theme-toggle"

interface SiteStats {
  totalUsers: string
  totalWorkers: string
  totalJobs: string
  activeJobs: string
  successRate: string
  avgHireTime: string
  latestJobTitle: string
  latestApplicants: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function LandingPage() {
  const t = useTranslations('HomePage');
  const tAuth = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [stats, setStats] = useState<SiteStats>({
    totalUsers: '1000+',
    totalWorkers: '500+',
    totalJobs: '100+',
    activeJobs: '50+',
    successRate: '95%',
    avgHireTime: '2 days',
    latestJobTitle: 'Security Guard',
    latestApplicants: '5+',
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/site/stats`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // Keep fallback values on error
      }
    }
    fetchStats()
  }, [])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full bg-background/60 backdrop-blur-xl border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent tracking-tight">
              {tCommon('appName')}
            </span>
          </Link>
          <div className="flex gap-3 items-center">
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
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
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

      {/* Hero Section */}
      <section className="relative pt-10 pb-16 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="relative z-20"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-6 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-primary/80">{t('tagline')}</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl font-extrabold text-balance leading-[1.1] mb-6 sm:mb-8">
                {t('heroTitle').split('. ').map((part, i) => (
                  <span key={i} className={i === 1 ? "text-primary block sm:inline" : ""}>
                    {part}{i < 2 ? '. ' : ''}
                  </span>
                ))}
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 text-balance leading-relaxed max-w-xl">
                {t('heroDescription')}
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col xs:flex-row gap-4 sm:gap-5"
              >
                <Link href="/auth/register?role=worker" className="flex-1 xs:flex-none">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95 rounded-2xl text-[1.1rem] sm:text-xl font-bold">
                    {t('findJobs')}
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </Link>
                <Link href="/auth/register?role=employer" className="flex-1 xs:flex-none">
                  <Button variant="outline" className="w-full h-14 px-8 bg-background/50 border-primary/30 hover:bg-primary/5 hover:text-primary backdrop-blur-sm transition-all active:scale-95 rounded-2xl text-[1.1rem] sm:text-xl font-semibold">
                    {t('hireTalent')}
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-x-12 gap-y-6 mt-16 pt-10 border-t border-border/50"
              >
                {[
                  { value: stats.totalUsers, label: t('stats.activeUsers'), color: "text-primary" },
                  { value: stats.totalJobs, label: t('stats.jobsPosted'), color: "text-accent" },
                  { value: stats.successRate, label: t('stats.successRate'), color: "text-primary" }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className={`text-4xl font-black ${stat.color} mb-1 tracking-tighter`}>
                      {stat.value}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[3rem] blur-3xl animate-pulse opacity-50" />
              <div className="relative aspect-square max-w-[500px] mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-card/80 to-background border border-primary/20 rounded-[3rem] backdrop-blur-2xl shadow-2xl flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),transparent)] group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative text-[10rem] select-none">
                    <motion.div
                      animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      💼
                    </motion.div>
                  </div>

                  {/* Floating Action Cards */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-12 left-12 p-5 bg-card/90 border border-border rounded-2xl shadow-xl backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Job Match</p>
                        <p className="font-bold">{stats.latestJobTitle}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-16 right-8 p-5 bg-card/90 border border-border rounded-2xl shadow-xl backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Talent Found</p>
                        <p className="font-bold">{stats.latestApplicants} Applicants</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-transparent via-card/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight text-balance">{t('features.title')}</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Zap,
                title: t('features.quickHiring.title'),
                description: t('features.quickHiring.description'),
                color: "primary",
                delay: 0.1,
              },
              {
                icon: Shield,
                title: t('features.verifiedProfessionals.title'),
                description: t('features.verifiedProfessionals.description'),
                color: "accent",
                delay: 0.2,
              },
              {
                icon: Clock,
                title: t('features.flexibleWork.title'),
                description: t('features.flexibleWork.description'),
                color: "primary",
                delay: 0.3,
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              const colorClass = feature.color === "primary" ? "text-primary" : "text-accent"
              const bgColorClass = feature.color === "primary" ? "bg-primary/10" : "bg-accent/10"

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: feature.delay }}
                  whileHover={{ y: -10 }}
                  className="group relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className={`w-14 h-14 rounded-2xl ${bgColorClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className={`w-8 h-8 ${colorClass}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground leading-tight">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>

                  <div className="mt-8 pt-6 border-t border-border/50 flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all cursor-pointer">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[
              { label: t('stats.activeUsers'), value: stats.totalUsers, icon: Users, color: "primary" },
              { label: t('stats.jobsPosted'), value: stats.totalJobs, icon: Briefcase, color: "accent" },
              { label: t('stats.successRate'), value: stats.successRate, icon: TrendingUp, color: "primary" },
              { label: t('stats.avgHireTime'), value: stats.avgHireTime, icon: Clock, color: "accent" },
            ].map((stat, idx) => {
              const Icon = stat.icon
              const colorClass = stat.color === "primary" ? "text-primary " : "text-accent "

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center group p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-card/50 border border-border/30 hover:bg-card hover:border-primary/30 transition-all duration-500"
                >
                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                    <Icon className={`w-6 h-6 sm:w-10 sm:h-10 ${colorClass}`} />
                  </div>
                  <div className={`text-2xl sm:text-4xl font-black ${colorClass} mb-1 sm:mb-2 tracking-tighter`}>{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em]">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight text-balance">{t('howItWorks.title')}</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              {t('howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />

            {[
              { step: "step1", icon: Users, color: "primary" },
              { step: "step2", icon: Search, color: "accent" },
              { step: "step3", icon: CheckCircle2, color: "primary" },
            ].map((item, idx) => {
              const Icon = item.icon
              const colorClass = item.color === "primary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="relative z-10 flex flex-col items-center text-center group"
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${colorClass} flex items-center justify-center mb-6 sm:mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-0`}>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                    <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary text-xs sm:text-sm">
                      {idx + 1}
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t(`howItWorks.steps.${item.step}.title`)}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {t(`howItWorks.steps.${item.step}.description`)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight text-balance">{t('testimonials.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              {t('testimonials.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { id: "test1", color: "primary" },
              { id: "test2", color: "accent" },
              { id: "test3", color: "primary" },
            ].map((test, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-10 rounded-[2.5rem] bg-card border border-border/50 relative overflow-hidden group hover:border-primary/30 transition-all duration-500"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Star className={`w-24 h-24 ${test.color === 'primary' ? 'text-primary' : 'text-accent'}`} />
                </div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-xl font-medium leading-relaxed mb-8 relative z-10 italic text-foreground/80">
                  "{t(`testimonials.list.${test.id}.quote`)}"
                </blockquote>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-full ${test.color === 'primary' ? 'bg-primary/20' : 'bg-accent/20'} flex items-center justify-center font-bold text-lg`}>
                    {t(`testimonials.list.${test.id}.author`).charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t(`testimonials.list.${test.id}.author`)}</p>
                    <p className="text-sm text-muted-foreground font-medium">{t(`testimonials.list.${test.id}.role`)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto relative group">
          <div className="absolute inset-0 bg-primary/10 rounded-[4rem] blur-[100px] group-hover:bg-primary/20 transition-colors duration-700" />
          <div className="relative p-12 sm:p-20 rounded-[4rem] bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 text-center overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Sparkles className="w-40 h-40 text-primary" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-6xl font-black mb-8 text-balance leading-tight">{t('cta.title')}</h2>
              <p className="text-xl text-muted-foreground mb-12 text-balance max-w-2xl mx-auto leading-relaxed">
                {t('cta.description')}
              </p>
              <div className="flex gap-6 flex-col sm:flex-row justify-center">
                <Link href="/auth/register?role=worker">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-16 px-10 w-full sm:w-auto shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95 rounded-2xl text-xl font-bold">
                    {t('cta.findJob')}
                  </Button>
                </Link>
                <Link href="/auth/register?role=employer">
                  <Button variant="outline" className="h-16 px-10 w-full sm:w-auto bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95 rounded-2xl text-xl font-semibold">
                    {t('cta.postJob')}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-card/40 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16 mb-20">
            <div className="xs:col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6 pointer-events-auto">
                <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
                <span className="text-xl font-black tracking-tighter">{tCommon('appName')}</span>
              </Link>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xs">
                {t('footer.description')}
              </p>
              <div className="flex gap-4 mt-8">
                {[Globe, Users, Star].map((Icon, idx) => (
                  <div key={idx} className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: t('footer.forWorkers'),
                links: [
                  { label: t('footer.browseJobs'), href: "/auth/register?role=worker" },
                  { label: tCommon('buttons.signUp'), href: "/auth/register?role=worker" },
                  { label: t('footer.howItWorks'), href: "#" }
                ]
              },
              {
                title: t('footer.forEmployers'),
                links: [
                  { label: tCommon('navigation.postJob'), href: "/auth/register?role=employer" },
                  { label: tCommon('buttons.register'), href: "/auth/register?role=employer" },
                  { label: t('footer.pricing'), href: "/subscriptions" }
                ]
              },
              {
                title: t('footer.company'),
                links: [
                  { label: t('footer.about'), href: "/about" },
                  { label: t('footer.contact'), href: "/contact" },
                  { label: t('footer.pricing'), href: "/subscriptions" }
                ]
              }
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-bold uppercase tracking-widest text-xs mb-8 text-foreground/70">{section.title}</h4>
                <ul className="space-y-4">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors font-medium">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-sm text-muted-foreground font-medium">{t('footer.copyright')}</p>
            <div className="flex gap-10 text-sm font-bold">
              <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest text-[10px]">
                {t('footer.privacyPolicy')}
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest text-[10px]">
                {t('footer.termsOfService')}
              </Link>
              <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest text-[10px]">
                {t('footer.refundPolicy')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}