"use client"

import { useState, useEffect } from "react"
import { Link, useRouter } from '@/navigation'
import { motion, Variants } from "framer-motion"
import {
  ArrowRight,
  Briefcase,
  Users,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Search,
  CheckCircle2,
  Star,
  Sparkles,
  Globe,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Building2,
  Smartphone,
  Award,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from 'next-intl'
import PublicNavbar from "@/components/PublicNavbar"
import ThreeBackground from "@/components/ThreeBackground"
import { workerTypeSkills } from "@/lib/worker-data"

interface SiteStats {
  totalUsers: string
  totalWorkers: string
  totalEmployers: string
  totalJobs: string
  activeJobs: string
  successRate: string
  avgHireTime: string
  latestJobTitle: string
  latestApplicants: string
}

interface Testimonial {
  _id: string
  author: string
  role: string
  quote: string
  rating: number
  isActive?: boolean
  image?: string
  city?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'


// Popular Hubs
const TOP_CITIES = [
  "Delhi NCR",
  "Mumbai",
  "Kolkata",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Ahmedabad",
  "Lucknow",
  "Patna",
  "Jaipur",
  "Chandigarh"
]

export default function LandingPage() {
  const router = useRouter()
  const t = useTranslations('HomePage')
  const tCommon = useTranslations('Common')

  // Search State
  const [selectedWorkerType, setSelectedWorkerType] = useState("")
  const [selectedCity, setSelectedCity] = useState("All Cities")
  const [howItWorksTab, setHowItWorksTab] = useState<"worker" | "employer">("worker")

  // Dynamic Site Stats from DB (/api/site/stats)
  const [stats, setStats] = useState<SiteStats>({
    totalUsers: '50+',
    totalWorkers: '35+',
    totalEmployers: '15+',
    totalJobs: '15+',
    activeJobs: '10+',
    successRate: '95%',
    avgHireTime: '2 days',
    latestJobTitle: 'Security Guard',
    latestApplicants: '5+',
  })

  // Dynamic Testimonials from DB (/api/site/testimonials)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [playStoreLink, setPlayStoreLink] = useState('https://drive.google.com/file/d/1LqQiKvRKc6YZQt_AR1xNPD12g569KJgc/view?usp=sharing')

  useEffect(() => {
    // 1. Fetch Real Site Stats from DB
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/site/stats`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error("Failed to load site stats:", err)
      }
    }

    // 2. Fetch Real Testimonials from DB (/api/site/testimonials)
    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true)
        const res = await fetch(`${API_BASE}/site/testimonials`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setTestimonials(data)
          }
        }
      } catch (err) {
        console.error("Failed to load DB testimonials:", err)
      } finally {
        setLoadingTestimonials(false)
      }
    }

    // 3. Fetch Settings (Play Store Link)
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
        // Fallback
      }
    }

    fetchStats()
    fetchTestimonials()
    fetchSettings()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (selectedWorkerType && selectedWorkerType !== "All Trades") {
      params.append("workerType", selectedWorkerType)
    }
    if (selectedCity && selectedCity !== "All Cities") {
      params.append("city", selectedCity)
    }
    router.push(`/jobs?${params.toString()}`)
  }

  const handleCityClick = (city: string) => {
    if (city === "All Cities") {
      router.push('/jobs')
    } else {
      router.push(`/jobs?city=${encodeURIComponent(city)}`)
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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

  // Default fallback testimonials if DB is connecting
  const DEFAULT_TESTIMONIALS: Testimonial[] = [
    {
      _id: "def-1",
      author: "Totan Patra",
      role: "Employer",
      quote: "Shramik Seva helped me find dependable staff within 48 hours. Direct candidate calling and messaging made hiring stress-free!",
      rating: 5,
    },
    {
      _id: "def-2",
      author: "Chandan Mondal",
      role: "Employer",
      quote: "Finding reliable electricians and plumbers was always a headache until I started using this platform. Very reliable!",
      rating: 5,
    },
    {
      _id: "def-3",
      author: "Arnab Mallick",
      role: "Support Engineer",
      quote: "The OTP verification gives me peace of mind that the work is tracked correctly. Direct messaging keeps everything organized.",
      rating: 5,
    },
    {
      _id: "def-4",
      author: "Totan Patra",
      role: "VLSI Engineer",
      quote: "Shramik Seva helped me find steady jobs quickly. I messaged HR directly and got hired with zero agency fees!",
      rating: 5,
    }
  ]

  // Multiply DB testimonials for continuous seamless infinite marquee animation
  const displayedTestimonials = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS
  const marqueeTestimonials = displayedTestimonials.length > 0
    ? (displayedTestimonials.length < 5
        ? [...displayedTestimonials, ...displayedTestimonials, ...displayedTestimonials, ...displayedTestimonials]
        : [...displayedTestimonials, ...displayedTestimonials])
    : []

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Shramik Seva",
    "url": "https://shramik-seva.com",
    "logo": "https://shramik-seva.com/logo.png",
    "description": "India's premier skilled worker and daily wage employment portal with direct HR messaging, verified worker hiring, and GPS shift logs."
  }

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Shramik Seva",
    "url": "https://shramik-seva.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://shramik-seva.com/jobs?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip font-sans antialiased selection:bg-primary/20 selection:text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />

      <PublicNavbar isHomePage />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-6 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        <ThreeBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto mb-10 sm:mb-12"
          >
            {/* Trust Pill Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold tracking-wide text-emerald-700 dark:text-emerald-300">
                100% Free for Workers • Message HR Directly • Zero Middlemen
              </span>
            </motion.div>

            {/* WorkIndia-Style Direct Headline */}
            <motion.h1 variants={itemVariants} className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-5 text-balance">
              Find Verified Jobs in Your Trade &{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Message HR Directly
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Connecting verified security guards, electricians, plumbers, housekeepers, masons, mechanics, and skilled daily wage workers directly with local employers and contractors.
            </motion.p>

            {/* WorkIndia-Style Search Console with Actual System Trades */}
            <motion.div variants={itemVariants} className="w-full max-w-3xl mx-auto mb-6">
              <form
                onSubmit={handleSearchSubmit}
                className="bg-card/95 backdrop-blur-2xl border-2 border-primary/30 hover:border-primary/50 transition-all rounded-3xl p-2.5 sm:p-3 shadow-2xl shadow-primary/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                {/* Select Actual Trade from System Catalog */}
                <div className="flex-1 flex items-center gap-3 px-3 py-1.5 bg-muted/40 sm:bg-transparent rounded-2xl">
                  <Search className="w-5 h-5 text-primary shrink-0" />
                  <select
                    value={selectedWorkerType}
                    onChange={(e) => setSelectedWorkerType(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-foreground focus:outline-none w-full cursor-pointer py-2"
                  >
                    <option value="" className="bg-card text-foreground">Select Job Trade / Worker Type</option>
                    {Object.keys(workerTypeSkills).map((trade) => (
                      <option key={trade} value={trade} className="bg-card text-foreground">
                        {trade}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hidden sm:block w-px h-8 bg-border" />

                {/* City Dropdown */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-muted/40 sm:bg-transparent rounded-2xl min-w-[170px]">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-foreground focus:outline-none w-full cursor-pointer py-2"
                  >
                    <option value="All Cities" className="bg-card text-foreground">All Cities</option>
                    {TOP_CITIES.map(city => (
                      <option key={city} value={city} className="bg-card text-foreground">{city}</option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="h-12 sm:h-13 px-7 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/25 gap-2 shrink-0"
                >
                  <span>Search Jobs</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </motion.div>

            {/* Quick Trending Trade Chips */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1 mr-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                Popular:
              </span>
              {[
                "Security guards",
                "Electricians",
                "Housekeepers",
                "Plumbers",
                "Rajmistri (Masons)",
                "Carpenters",
                "Welders",
                "Facility Manager",
                "Nurse"
              ].map((trade) => (
                <button
                  key={trade}
                  type="button"
                  onClick={() => router.push(`/jobs?workerType=${encodeURIComponent(trade)}`)}
                  className="px-3 py-1 rounded-full bg-card/80 hover:bg-muted border border-border/80 text-foreground/80 hover:text-foreground text-[11px] font-medium transition shadow-2xs hover:border-primary/40"
                >
                  {trade}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* DUAL PATH HERO CARDS (WorkIndia Archetype) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 max-w-5xl mx-auto pt-2">
            {/* CARD 1: JOB SEEKER PATH */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-card to-background border-2 border-emerald-500/30 shadow-xl overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    🟢 100% Free • Job Seeker
                  </span>
                  <span className="text-2xl">👷</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Looking for a Job?
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Message HR directly, arrange your shift or interview, and start earning without paying any agency or consultancy fee.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-foreground/90 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Direct in-app messaging with verified employers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Daily wage & monthly jobs matching your trade</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>GPS shift attendance with OTP protects your wages</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-4 border-t border-border/50">
                <Link href="/auth/register?role=worker" className="block">
                  <Button className="w-full h-12 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 gap-2">
                    <span>Register as Job Seeker (100% Free)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* CARD 2: EMPLOYER / RECRUITER PATH */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-background border-2 border-primary/30 shadow-xl overflow-hidden flex flex-col justify-between group hover:border-primary/60 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    ⚡ Instant Direct Staff Hiring
                  </span>
                  <span className="text-2xl">🏢</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Want to Hire Staff?
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Post your vacancy in 2 minutes. Directly call or message pre-screened, verified workers in your local city radius.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-foreground/90 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Directly call or message verified skilled workers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Zero brokerage fees, no middleman commissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Real-time GPS shift logs & timesheet tracking</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-4 border-t border-border/50">
                <Link href="/auth/register?role=employer" className="block">
                  <Button className="w-full h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2">
                    <span>Post a Job / Hire Staff</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ================= BROWSE BY CITY ================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Find Opportunities in Your City
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Select your city to browse local vacancies and verified candidates near you.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
            {TOP_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleCityClick(city)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/60 hover:bg-primary/5 hover:text-primary text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:scale-105 active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Jobs in {city}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 100% FREE & ANTI-FRAUD ADVISORY ================= */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border-2 border-amber-500/40 shadow-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="flex-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-1">
                  100% Free Job Guarantee • Anti-Fraud Advisory
                </div>
                <h3 className="text-lg sm:text-xl font-black text-foreground">
                  Never Pay Money For Any Job on Shramik Seva!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Shramik Seva is completely <strong className="text-foreground">100% FREE</strong> for all job seekers. We never charge any registration fee, interview charge, uniform charge, or placement cut. If anyone asks you for money, do not pay and report them immediately.
                </p>
              </div>

              <Link href="/contact" className="shrink-0">
                <Button variant="outline" className="border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold">
                  Report Fraud
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE SHRAMIK SEVA ================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-muted/20 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Platform Advantages</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Why Shramik Seva Beats Traditional Consultancies
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Empowering workers with transparent agreements and providing verified recruitment for employers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Direct HR Messaging",
                desc: "No middlemen or fake consultancies. Message HR & employers directly in-app to confirm shifts and job location.",
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
              },
              {
                icon: Clock,
                title: "GPS Shift Attendance",
                desc: "Real-time clock-in and clock-out with OTP timestamps. Guaranteed accurate records for every hour worked.",
                color: "text-blue-500 bg-blue-500/10 border-blue-500/30"
              },
              {
                icon: ShieldCheck,
                title: "100% Verified Profiles",
                desc: "Identity verified workers and background-checked businesses to ensure safety and reliable agreements.",
                color: "text-purple-500 bg-purple-500/10 border-purple-500/30"
              },
              {
                icon: Zap,
                title: "Transparent Wages",
                desc: "Know your exact daily wage or monthly salary in rupees upfront. No hidden cuts or surprise deductions.",
                color: "text-amber-500 bg-amber-500/10 border-amber-500/30"
              }
            ].map((pillar, idx) => {
              const Icon = pillar.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl space-y-4"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${pillar.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pillar.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS (DUAL TABS) ================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              How Shramik Seva Works
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Start earning or hiring in 3 simple, transparent steps.
            </p>

            {/* Interactive Toggle */}
            <div className="inline-flex items-center p-1.5 bg-muted/60 rounded-2xl border border-border mt-6">
              <button
                type="button"
                onClick={() => setHowItWorksTab("worker")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  howItWorksTab === "worker"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                👷 For Job Seekers
              </button>
              <button
                type="button"
                onClick={() => setHowItWorksTab("employer")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  howItWorksTab === "employer"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🏢 For Employers
              </button>
            </div>
          </div>

          {/* Steps Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {howItWorksTab === "worker" ? (
              <>
                <div className="p-6 rounded-3xl bg-card border border-border/80 text-center space-y-3 relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg mx-auto">1</div>
                  <h3 className="text-base font-bold text-foreground">Pick Your Trade & City</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Choose your work category, select your expected salary, and pinpoint your service location.</p>
                </div>
                <div className="p-6 rounded-3xl bg-card border border-border/80 text-center space-y-3 relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg mx-auto">2</div>
                  <h3 className="text-base font-bold text-foreground">Message HR Directly</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">No waiting. Send a direct in-app message to employers and arrange your shift or interview.</p>
                </div>
                <div className="p-6 rounded-3xl bg-card border border-border/80 text-center space-y-3 relative">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg mx-auto">3</div>
                  <h3 className="text-base font-bold text-foreground">Work & Track Wages</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Start work with OTP check-ins. Track shift hours, attendance, and get paid transparently.</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 rounded-3xl bg-card border border-border/80 text-center space-y-3 relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg mx-auto">1</div>
                  <h3 className="text-base font-bold text-foreground">Post Job in 2 Mins</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Specify worker role, job site location pin, daily or monthly salary, and shift timings.</p>
                </div>
                <div className="p-6 rounded-3xl bg-card border border-border/80 text-center space-y-3 relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg mx-auto">2</div>
                  <h3 className="text-base font-bold text-foreground">Call or Message Directly</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Nearby verified skilled workers receive your vacancy. Connect with candidates instantly via phone or in-app message.</p>
                </div>
                <div className="p-6 rounded-3xl bg-card border border-border/80 text-center space-y-3 relative">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg mx-auto">3</div>
                  <h3 className="text-base font-bold text-foreground">Track Shift Attendance</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Automate worker shift logs, verify clock-in with OTP, and manage site attendance easily.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ================= REAL LIVE PLATFORM METRICS FROM DB (/api/site/stats) ================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10 bg-primary/5 border-y border-primary/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { label: "Verified Workers", value: stats.totalWorkers || "35+", icon: Users, color: "text-primary" },
              { label: "Active Jobs", value: stats.activeJobs || stats.totalJobs || "15+", icon: Briefcase, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Placement Success", value: stats.successRate || "95%", icon: TrendingUp, color: "text-indigo-600 dark:text-indigo-400" },
              { label: "Avg. Hiring Time", value: stats.avgHireTime || "2 days", icon: Clock, color: "text-amber-600 dark:text-amber-400" },
            ].map((st, i) => {
              const Icon = st.icon
              return (
                <div key={i} className="p-6 rounded-3xl bg-card/80 border border-border/60 shadow-xs">
                  <Icon className={`w-8 h-8 ${st.color} mx-auto mb-2`} />
                  <div className={`text-3xl sm:text-4xl font-black ${st.color} tracking-tight`}>
                    {st.value}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                    {st.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS COMING FROM DATABASE (/api/site/testimonials) ================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-2">
              <Star className="w-3.5 h-3.5 fill-primary" />
              <span>Real Verified Reviews</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              What Our Users Say
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Testimonials from verified workers and employers on Shramik Seva.
            </p>
          </div>

          {loadingTestimonials ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : marqueeTestimonials.length > 0 ? (
            <div className="relative overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

              <motion.div
                className="flex gap-6 w-max"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: Math.max(22, displayedTestimonials.length * 6), ease: "linear", repeat: Infinity }}
                style={{ cursor: "grab" }}
              >
                {marqueeTestimonials.map((item, idx) => (
                  <div
                    key={`${item._id}-${idx}`}
                    className="w-[320px] sm:w-[400px] p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-md flex flex-col justify-between shrink-0 hover:border-primary/50 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(item.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-500" />
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic mb-6">
                        &quot;{item.quote}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.author} className="w-full h-full object-cover" />
                        ) : (
                          item.author.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-foreground truncate">{item.author}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{item.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No testimonials found in database.
            </div>
          )}
        </div>
      </section>

      {/* ================= MOBILE APP SHOWCASE BANNER ================= */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 relative z-10 my-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-primary via-indigo-900 to-slate-900 text-white shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl text-center md:text-left">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                  📱 Mobile App for Android
                </span>
                <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
                  Carry Shramik Seva Right in Your Pocket
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Download the lightweight Shramik Seva Android App. Get instant SMS & WhatsApp alerts for daily wage jobs in your trade within your locality.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <Button
                    onClick={() => window.open(playStoreLink, '_blank')}
                    className="h-14 px-7 rounded-2xl bg-white text-slate-900 hover:bg-white/90 font-bold shadow-lg gap-3"
                  >
                    <Smartphone className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-500 leading-none">Get it on</div>
                      <div className="text-base font-black leading-tight">Google Play</div>
                    </div>
                  </Button>

                  <div className="text-xs text-white/80 flex items-center gap-1.5 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Verified • Android App</span>
                  </div>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="w-48 sm:w-56 h-80 rounded-3xl bg-slate-950 border-4 border-white/20 p-3 shadow-2xl flex flex-col justify-between shrink-0 transform md:rotate-3 hover:rotate-0 transition-transform">
                <div className="text-center py-2 border-b border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Shramik Seva</span>
                </div>
                <div className="space-y-2 py-4">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px]">
                    <span className="text-emerald-400 font-bold">● New Job Alert</span>
                    <div className="font-bold text-white mt-0.5">{stats.latestJobTitle || "Electrician Needed"}</div>
                    <div className="text-white/60">Verified Vacancy • Message HR</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px]">
                    <span className="text-blue-400 font-bold">● Verified Recruiter</span>
                    <div className="font-bold text-white mt-0.5">Security Guard</div>
                    <div className="text-white/60">Direct Chat • No Agency</div>
                  </div>
                </div>
                <div className="text-[10px] text-center text-white/50 pb-1">
                  Available in 12 Indian Languages
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Ready to Start Earning or Hiring Today?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Join thousands of verified workers and employers building trusted livelihoods across India.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/register?role=worker" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 gap-2">
                <span>Find Jobs (100% Free)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/register?role=employer" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl text-base font-semibold border-primary/30 hover:bg-primary/5 hover:text-primary">
                <span>Hire Staff Fast</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= WORKINDIA-STYLE RICH FOOTER ================= */}
      <footer className="border-t border-border pt-16 pb-12 px-4 sm:px-6 lg:px-8 bg-card/60 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main Footer Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm" />
                <span className="text-2xl font-black tracking-tight">{tCommon('appName')}</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                India&apos;s leading dedicated employment portal for skilled workers, technicians, and daily wage earners. Direct in-app HR messaging, employer direct calling to candidates, transparent wage agreements, and automated GPS shift attendance.
              </p>
              <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Free for All Job Seekers • Anti-Fraud Protection</span>
              </div>
            </div>

            {/* Popular Job Roles Served */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-foreground mb-4">Trades We Serve</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li><Link href="/jobs?workerType=Security%20guards" className="hover:text-primary transition-colors">Security Guards</Link></li>
                <li><Link href="/jobs?workerType=Electricians" className="hover:text-primary transition-colors">Electricians</Link></li>
                <li><Link href="/jobs?workerType=Housekeepers" className="hover:text-primary transition-colors">Housekeepers</Link></li>
                <li><Link href="/jobs?workerType=Plumbers" className="hover:text-primary transition-colors">Plumbers</Link></li>
                <li><Link href="/jobs?workerType=Rajmistri%20(Masons)" className="hover:text-primary transition-colors">Rajmistri (Masons)</Link></li>
                <li><Link href="/jobs?workerType=Carpenters" className="hover:text-primary transition-colors">Carpenters</Link></li>
              </ul>
            </div>

            {/* Jobs by City */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-foreground mb-4">Jobs by City</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li><Link href="/jobs?city=Delhi%20NCR" className="hover:text-primary transition-colors">Jobs in Delhi NCR</Link></li>
                <li><Link href="/jobs?city=Mumbai" className="hover:text-primary transition-colors">Jobs in Mumbai</Link></li>
                <li><Link href="/jobs?city=Bengaluru" className="hover:text-primary transition-colors">Jobs in Bengaluru</Link></li>
                <li><Link href="/jobs?city=Kolkata" className="hover:text-primary transition-colors">Jobs in Kolkata</Link></li>
                <li><Link href="/jobs?city=Pune" className="hover:text-primary transition-colors">Jobs in Pune</Link></li>
                <li><Link href="/jobs?city=Hyderabad" className="hover:text-primary transition-colors">Jobs in Hyderabad</Link></li>
              </ul>
            </div>

            {/* For Employers & Legal */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li><Link href="/auth/register?role=employer" className="hover:text-primary transition-colors">Post a Job</Link></li>
                <li><Link href="/auth/register?role=worker" className="hover:text-primary transition-colors">Worker Registration</Link></li>
                <li><Link href="/auth/login" className="hover:text-primary transition-colors">Login / Sign In</Link></li>
                <li><Link href="/subscriptions" className="hover:text-primary transition-colors">Employer Pricing</Link></li>
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact & Fraud Helpline</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Legal */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              © 2026 Shramik Seva. All rights reserved. A subsidiary of S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED.
            </div>

            <div className="flex items-center gap-6 font-semibold">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}