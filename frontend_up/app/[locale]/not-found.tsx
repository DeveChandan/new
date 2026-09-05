"use client"

import { Link, useRouter } from "@/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  Home,
  Briefcase,
  PlusCircle,
  UserCheck,
  HelpCircle,
  FileQuestion,
  LayoutDashboard,
  Users,
  Clock,
  ShieldCheck,
  Building2,
  HardHat,
  User,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  LogIn,
  Layers
} from "lucide-react"

export default function NotFoundPage() {
  const t = useTranslations("NotFound")
  const tCommon = useTranslations("Common")
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const role = user?.role || (isAuthenticated ? "worker" : "guest")

  // Define role-specific metadata, badge, titles, and action links
  const roleConfig = {
    worker: {
      badgeText: user?.name ? `${t("worker.badge") || "Worker Account"} • ${user.name}` : (t("worker.badge") || "Worker Portal"),
      badgeIcon: HardHat,
      badgeColor: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-blue-500/10",
      title: t("title") || "Page or Document Not Found",
      subtitle: t("worker.subtitle") || "We couldn't find the job, document, or page you were looking for. Here are the quickest ways back to your work, jobs, and earnings.",
      primaryAction: {
        label: t("worker.dashboard") || "Worker Dashboard",
        href: "/dashboard/worker",
        icon: LayoutDashboard,
        variant: "default" as const,
      },
      secondaryAction: {
        label: t("worker.findJobs") || "Find Jobs",
        href: "/jobs",
        icon: Briefcase,
        variant: "outline" as const,
      },
      tertiaryAction: {
        label: t("worker.workLogs") || "My Work Logs",
        href: "/dashboard/worker/work-logs",
        icon: Clock,
        variant: "outline" as const,
      },
      cards: [
        {
          title: t("worker.findJobs") || "Find Jobs",
          desc: t("worker.findJobsDesc") || "Search verified jobs matching your trade & location",
          href: "/jobs",
          icon: Briefcase,
          colorTheme: "blue",
          tag: "Browse"
        },
        {
          title: t("worker.offers") || "Hiring Offers",
          desc: t("worker.offersDesc") || "Review direct hire requests and employer invitations",
          href: "/dashboard/worker/hiring-requests",
          icon: UserCheck,
          colorTheme: "emerald",
          tag: "Direct"
        },
        {
          title: t("worker.workLogs") || "My Work Logs",
          desc: t("worker.workLogsDesc") || "Log daily work hours, submit entries & track earnings",
          href: "/dashboard/worker/work-logs",
          icon: Clock,
          colorTheme: "amber",
          tag: "Timesheets"
        },
        {
          title: tCommon("navigation.profile") || "My Profile",
          desc: t("worker.profileDesc") || "Update your trade skills, bio, rate & ID documents",
          href: "/profile",
          icon: User,
          colorTheme: "violet",
          tag: "Account"
        }
      ]
    },
    employer: {
      badgeText: user?.companyName
        ? `${t("employer.badge") || "Employer Account"} • ${user.companyName}`
        : user?.name
        ? `${t("employer.badge") || "Employer Account"} • ${user.name}`
        : (t("employer.badge") || "Employer Portal"),
      badgeIcon: Building2,
      badgeColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10",
      title: t("title") || "Page or Document Not Found",
      subtitle: t("employer.subtitle") || "The candidate profile, job posting, or page could not be found. Here are quick shortcuts to manage your listings and talent pipeline.",
      primaryAction: {
        label: t("employer.dashboard") || "Employer Dashboard",
        href: "/dashboard/employer",
        icon: LayoutDashboard,
        variant: "default" as const,
      },
      secondaryAction: {
        label: t("employer.postJob") || "Post a Job",
        href: "/jobs/create",
        icon: PlusCircle,
        variant: "outline" as const,
      },
      tertiaryAction: {
        label: t("employer.hireTalent") || "Discover Workers",
        href: "/dashboard/employer/hire-talent",
        icon: Users,
        variant: "outline" as const,
      },
      cards: [
        {
          title: t("employer.postJob") || "Post a Job",
          desc: t("employer.postJobDesc") || "Create a new requirement to attract skilled workers",
          href: "/jobs/create",
          icon: PlusCircle,
          colorTheme: "emerald",
          tag: "Recruit"
        },
        {
          title: t("dashboard") || "Manage Postings",
          desc: t("employer.manageJobsDesc") || "Track applicants, review candidates & edit job postings",
          href: "/dashboard/employer/jobs",
          icon: Briefcase,
          colorTheme: "blue",
          tag: "Jobs"
        },
        {
          title: t("employer.hireTalent") || "Discover Workers",
          desc: t("employer.hireTalentDesc") || "Browse verified worker profiles and send direct offers",
          href: "/dashboard/employer/hire-talent",
          icon: Users,
          colorTheme: "violet",
          tag: "Directory"
        },
        {
          title: "Hired Contracts",
          desc: t("employer.hiredJobsDesc") || "Supervise active hires, verify work logs & process payments",
          href: "/dashboard/employer/hired-jobs",
          icon: CheckCircle2,
          colorTheme: "amber",
          tag: "Manage"
        }
      ]
    },
    admin: {
      badgeText: user?.name ? `${t("admin.badge") || "Administrator"} • ${user.name}` : (t("admin.badge") || "Platform Admin"),
      badgeIcon: ShieldCheck,
      badgeColor: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-indigo-500/10",
      title: t("title") || "Page or Document Not Found",
      subtitle: t("admin.subtitle") || "The requested route or administrative document could not be located. Access your control center and management tools below.",
      primaryAction: {
        label: t("admin.dashboard") || "Admin Overview",
        href: "/admin/dashboard",
        icon: ShieldCheck,
        variant: "default" as const,
      },
      secondaryAction: {
        label: t("admin.manageUsers") || "User Directory",
        href: "/admin/users",
        icon: Users,
        variant: "outline" as const,
      },
      tertiaryAction: {
        label: t("admin.jobModeration") || "Job Moderation",
        href: "/admin/jobs",
        icon: Briefcase,
        variant: "outline" as const,
      },
      cards: [
        {
          title: t("admin.manageUsers") || "User Directory",
          desc: t("admin.usersDesc") || "Search, verify and moderate worker and employer accounts",
          href: "/admin/users",
          icon: Users,
          colorTheme: "blue",
          tag: "KYC & Users"
        },
        {
          title: t("admin.jobModeration") || "Job Moderation",
          desc: t("admin.jobsDesc") || "Review active postings, monitor compliance and flags",
          href: "/admin/jobs",
          icon: Briefcase,
          colorTheme: "emerald",
          tag: "Compliance"
        },
        {
          title: "Document Center",
          desc: t("admin.docsDesc") || "Approve worker Aadhaar, trade licenses & certifications",
          href: "/admin/documents",
          icon: FileCheck,
          colorTheme: "violet",
          tag: "Approvals"
        },
        {
          title: "Support & Disputes",
          desc: t("admin.supportDesc") || "Resolve user support tickets and dispute claims",
          href: "/admin/support",
          icon: HelpCircle,
          colorTheme: "amber",
          tag: "Helpdesk"
        }
      ]
    },
    guest: {
      badgeText: t("badge") || "404 Error",
      badgeIcon: FileQuestion,
      badgeColor: "bg-destructive/15 border-destructive/30 text-destructive",
      iconBg: "bg-primary/10 border-primary/20 text-primary shadow-primary/5",
      title: t("title") || "Page or Document Not Found",
      subtitle: t("description") || "Sorry, the page, document, or resource you are looking for does not exist, has been moved, or is temporarily unavailable.",
      primaryAction: {
        label: t("backHome") || "Back to Home",
        href: "/",
        icon: Home,
        variant: "default" as const,
      },
      secondaryAction: {
        label: t("browseJobs") || "Browse Jobs",
        href: "/jobs",
        icon: Briefcase,
        variant: "outline" as const,
      },
      tertiaryAction: {
        label: t("guest.signIn") || "Sign In",
        href: "/auth/login",
        icon: LogIn,
        variant: "outline" as const,
      },
      cards: [
        {
          title: t("searchJobs") || "Search Jobs",
          desc: t("guest.searchJobsDesc") || "Browse hundreds of verified trade & daily wage jobs",
          href: "/jobs",
          icon: Briefcase,
          colorTheme: "blue",
          tag: "Explore"
        },
        {
          title: t("guest.registerEmployer") || "Hire Workers",
          desc: t("guest.postJobDesc") || "Post your requirements and hire skilled verified talent",
          href: "/auth/register?role=employer",
          icon: PlusCircle,
          colorTheme: "emerald",
          tag: "Employers"
        },
        {
          title: t("guest.registerWorker") || "Join as Worker",
          desc: t("guest.workerSignupDesc") || "Register in under 2 minutes and connect with employers",
          href: "/auth/register?role=worker",
          icon: UserCheck,
          colorTheme: "violet",
          tag: "Workers"
        },
        {
          title: t("helpCenter") || "Help & Support",
          desc: t("guest.supportDesc") || "Get quick assistance or reach out to our support team",
          href: "/contact",
          icon: HelpCircle,
          colorTheme: "amber",
          tag: "Assistance"
        }
      ]
    }
  }

  const currentRole = role in roleConfig ? (role as keyof typeof roleConfig) : "guest"
  const config = roleConfig[currentRole]
  const BadgeIcon = config.badgeIcon


  const getColorStyles = (color: string) => {
    switch (color) {
      case "emerald":
        return {
          iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20",
          border: "hover:border-emerald-500/40",
          hoverText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
          tagBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        }
      case "violet":
        return {
          iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/20",
          border: "hover:border-violet-500/40",
          hoverText: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
          tagBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400"
        }
      case "amber":
        return {
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20",
          border: "hover:border-amber-500/40",
          hoverText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
          tagBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        }
      case "blue":
      default:
        return {
          iconBg: "bg-primary/10 text-primary group-hover:bg-primary/20",
          border: "hover:border-primary/40",
          hoverText: "group-hover:text-primary",
          tagBg: "bg-primary/10 text-primary"
        }
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-3xl w-full mx-auto text-center space-y-6 py-6">
        {/* Visual Badge / Illustration with 404 tag */}
        <div className="space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border flex items-center justify-center backdrop-blur-md shadow-xl transition-all duration-300 ${config.iconBg}`}>
              <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
            </div>
            <span className="absolute -top-2 -right-2 px-2.5 py-0.5 bg-destructive/15 border border-destructive/30 text-destructive text-xs font-extrabold rounded-full tracking-wide">
              {t("badge") || "404 Error"}
            </span>
          </div>

          {/* Role Context Pill (Gracefully displayed, non-overlapping) */}
          {role !== "guest" && (
            <div className="flex items-center justify-center">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 border text-xs sm:text-sm font-semibold rounded-full tracking-wide shadow-sm backdrop-blur-md ${config.badgeColor}`}>
                <BadgeIcon className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[320px] sm:max-w-md">{config.badgeText}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Heading & Contextual Subtitle */}
        <div className="space-y-2 px-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {config.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {config.subtitle}
          </p>
        </div>

        {/* Role-Specific Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {config.primaryAction && (
            <Button
              size="lg"
              className="rounded-full shadow-lg shadow-primary/10 gap-2 h-11 px-6 font-semibold transition-all hover:scale-[1.02]"
              asChild
            >
              <Link href={config.primaryAction.href}>
                <config.primaryAction.icon className="w-4 h-4" />
                {config.primaryAction.label}
              </Link>
            </Button>
          )}

          {config.secondaryAction && (
            <Button
              variant={config.secondaryAction.variant}
              size="lg"
              className="rounded-full gap-2 h-11 px-6 font-semibold hover:bg-muted/60 transition-all hover:scale-[1.02]"
              asChild
            >
              <Link href={config.secondaryAction.href}>
                <config.secondaryAction.icon className="w-4 h-4 text-primary" />
                {config.secondaryAction.label}
              </Link>
            </Button>
          )}

          {config.tertiaryAction && (
            <Button
              variant={config.tertiaryAction.variant}
              size="lg"
              className="rounded-full gap-2 h-11 px-6 font-semibold hover:bg-muted/60 transition-all hidden sm:inline-flex hover:scale-[1.02]"
              asChild
            >
              <Link href={config.tertiaryAction.href}>
                <config.tertiaryAction.icon className="w-4 h-4 text-muted-foreground" />
                {config.tertiaryAction.label}
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.back()}
            className="rounded-full gap-2 h-11 px-5 font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("goBack") || "Go Back"}
          </Button>
        </div>

        {/* Role-Specific Quick Shortcuts Cards */}
        <div className="pt-4">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>{t("popularLinks") || "Helpful Shortcuts"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {config.cards.map((card, idx) => {
              const Icon = card.icon
              const styles = getColorStyles(card.colorTheme)

              return (
                <Link
                  key={idx}
                  href={card.href}
                  className={`group p-4 rounded-2xl border border-border/70 bg-card hover:bg-muted/30 transition-all duration-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 ${styles.border}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${styles.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${styles.tagBg}`}>
                        {card.tag}
                      </span>
                    </div>

                    <div>
                      <p className={`text-sm font-bold text-foreground transition-colors ${styles.hoverText}`}>
                        {card.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-snug">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    <span>{tCommon("buttons.view") || "Open"}</span>
                    <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

