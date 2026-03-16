"use client"

import { useState, useEffect } from "react"
import { Link } from '@/navigation';
import { motion, Variants } from "framer-motion"
import { ArrowRight, Briefcase, Users, Zap, Shield, Clock, TrendingUp, Menu, X, ArrowUpRight, Search, CheckCircle2, Star, Sparkles, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl';
import { ThemeToggle } from "@/components/theme-toggle"
import PublicNavbar from "@/components/PublicNavbar"

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

interface Testimonial {
  _id: string;
  author: string;
  role: string;
  quote: string;
  rating: number;
  image?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function LandingPage() {
  const t = useTranslations('HomePage');
  const tAuth = useTranslations('Auth');
  const tCommon = useTranslations('Common');
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

  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [playStoreLink, setPlayStoreLink] = useState('https://drive.google.com/file/d/1LqQiKvRKc6YZQt_AR1xNPD12g569KJgc/view?usp=sharing')

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

    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true)
        const res = await fetch(`${API_BASE}/site/testimonials`)
        if (res.ok) {
          const data = await res.json()
          setTestimonials(data)
        }
      } catch {
        // Keep empty on error
      } finally {
        setLoadingTestimonials(false)
      }
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/site/settings`)
        if (res.ok) {
          const data = await res.json()
          if (data.playStoreLink) {
            setPlayStoreLink(data.playStoreLink)
          }
        }
      } catch {
        // Fallback already set
      }
    }

    fetchStats()
    fetchTestimonials()
    fetchSettings()
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
    <div className="min-h-screen bg-background overflow-x-hidden text-foreground">
      <PublicNavbar isHomePage />
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

          <div className="relative overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0 group/marquee">
            {/* Left & Right Gradient Overlays for smooth fading */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            {loadingTestimonials ? (
              <div className="w-full flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : (
              <motion.div
                className="flex gap-8 w-fit"
                animate={{
                  x: [0, -1 * (testimonials.length > 0 ? (testimonials.length * 432) : (3 * 432))] // Estimate width + gap
                }}
                transition={{
                  duration: testimonials.length > 0 ? (testimonials.length * 8) : 24,
                  ease: "linear",
                  repeat: Infinity
                }}
                style={{ cursor: 'grab' }}
                whileHover={{ animationPlayState: 'paused' }}
              >
                {/* First set of testimonials */}
                {(testimonials.length > 0 ? testimonials : [
                  { _id: "test1", author: t('testimonials.list.test1.author'), role: t('testimonials.list.test1.role'), quote: t('testimonials.list.test1.quote'), rating: 5, color: "primary" },
                  { _id: "test2", author: t('testimonials.list.test2.author'), role: t('testimonials.list.test2.role'), quote: t('testimonials.list.test2.quote'), rating: 5, color: "accent" },
                  { _id: "test3", author: t('testimonials.list.test3.author'), role: t('testimonials.list.test3.role'), quote: t('testimonials.list.test3.quote'), rating: 5, color: "primary" }
                ]).map((test: any, idx) => (
                  <div
                    key={`${test._id}-1`}
                    className="min-w-[320px] sm:min-w-[400px] max-w-[400px] p-8 sm:p-10 rounded-[2.5rem] bg-card border border-border/50 relative overflow-hidden flex flex-col justify-between hover:border-primary/30 transition-colors duration-500"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Star className={`w-24 h-24 ${(test.color === 'accent' || idx % 2 !== 0) ? 'text-accent' : 'text-primary'}`} />
                    </div>
                    <div>
                      <div className="flex gap-1 mb-6">
                        {[...Array(test.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                        ))}
                      </div>
                      <blockquote className="text-lg sm:text-xl font-medium leading-relaxed mb-8 relative z-10 italic text-foreground/80 line-clamp-6">
                        "{test.quote}"
                      </blockquote>
                    </div>
                    <div className="flex items-center gap-4 relative z-10 mt-auto">
                      <div className={`w-12 h-12 rounded-full ${(test.color === 'accent' || idx % 2 !== 0) ? 'bg-accent/20' : 'bg-primary/20'} flex items-center justify-center font-bold text-lg overflow-hidden shrink-0`}>
                        {test.image ? (
                          <img src={test.image} alt={test.author} className="w-full h-full object-cover" />
                        ) : (
                          test.author.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{test.author}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{test.role}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Second set of testimonials for seamless loop */}
                {(testimonials.length > 0 ? testimonials : [
                  { _id: "test1", author: t('testimonials.list.test1.author'), role: t('testimonials.list.test1.role'), quote: t('testimonials.list.test1.quote'), rating: 5, color: "primary" },
                  { _id: "test2", author: t('testimonials.list.test2.author'), role: t('testimonials.list.test2.role'), quote: t('testimonials.list.test2.quote'), rating: 5, color: "accent" },
                  { _id: "test3", author: t('testimonials.list.test3.author'), role: t('testimonials.list.test3.role'), quote: t('testimonials.list.test3.quote'), rating: 5, color: "primary" }
                ]).map((test: any, idx) => (
                  <div
                    key={`${test._id}-2`}
                    className="min-w-[320px] sm:min-w-[400px] max-w-[400px] p-8 sm:p-10 rounded-[2.5rem] bg-card border border-border/50 relative overflow-hidden flex flex-col justify-between hover:border-primary/30 transition-colors duration-500"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Star className={`w-24 h-24 ${(test.color === 'accent' || idx % 2 !== 0) ? 'text-accent' : 'text-primary'}`} />
                    </div>
                    <div>
                      <div className="flex gap-1 mb-6">
                        {[...Array(test.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                        ))}
                      </div>
                      <blockquote className="text-lg sm:text-xl font-medium leading-relaxed mb-8 relative z-10 italic text-foreground/80 line-clamp-6">
                        "{test.quote}"
                      </blockquote>
                    </div>
                    <div className="flex items-center gap-4 relative z-10 mt-auto">
                      <div className={`w-12 h-12 rounded-full ${(test.color === 'accent' || idx % 2 !== 0) ? 'bg-accent/20' : 'bg-primary/20'} flex items-center justify-center font-bold text-lg overflow-hidden shrink-0`}>
                        {test.image ? (
                          <img src={test.image} alt={test.author} className="w-full h-full object-cover" />
                        ) : (
                          test.author.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{test.author}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{test.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* App Banner Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 relative z-10 my-10">
        <div className="max-w-5xl mx-auto relative group cursor-pointer" onClick={() => window.open(playStoreLink, '_blank')}>
          {/* Animated Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-500" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-card border border-border hover:border-primary/50 shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex flex-shrink-0 items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground mb-1 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  Get the Shramik Seva App
                </h3>
                <p className="text-muted-foreground font-medium">Available now on Android. Find jobs and hire faster.</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="h-16 px-8 rounded-2xl bg-background/50 hover:bg-background border-primary/20 hover:border-primary shadow-md flex items-center gap-4 transition-all group-hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              <div className="w-8 h-8 flex-shrink-0 filter drop-shadow-md">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.5 12.5L2.8 21.6c-.4.2-.8.2-1.2 0-.4-.2-.6-.6-.6-1V3.4c0-.4.2-.8.6-1 .4-.2.8-.2 1.2 0L17.5 11.5c.3.2.5.5.5.5s-.2.3-.5.5z" fill="#4CAF50" />
                  <path d="M22.8 11.1L18.7 13.5l-4.5-4.5 4.5-4.5 4.1 2.4c.7.4 1.2 1.2 1.2 2.1 0 .9-.5 1.7-1.2 2.1z" fill="#FFC107" />
                  <path d="M2.8 2.4L14.2 13.8 2.2 25.8 2.8 2.4z" fill="#F44336" />
                  <path d="M2.2 -1.8L14.2 10.2 2.8 21.6 2.2 -1.8z" fill="#2196F3" />
                </svg>
              </div>
              <div className="flex flex-col items-start justify-center text-left">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors leading-none">Get it on</span>
                <span className="text-base sm:text-xl font-black leading-tight text-foreground">Google Play</span>
              </div>
            </Button>
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