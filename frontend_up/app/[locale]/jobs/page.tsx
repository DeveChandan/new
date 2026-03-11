"use client"

import { Suspense, useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { Search, MapPin, Briefcase, Filter, LogOut, Loader2, Plus, Menu, Users, X, MessageSquare, Edit2, Sparkles, Building2, Calendar, ChevronRight } from "lucide-react"
import { FilterSidebar } from "@/components/FilterSidebar"
import { useTranslations } from 'next-intl'
import { useTranslationLocale } from '@/hooks/useTranslation'
import { NotificationBell } from "@/components/NotificationBell"
import { CompactJobCard } from "@/components/CompactJobCard"
import LanguageSwitcher from "@/components/LanguageSwitcher"

function JobsContent() {
  const t = useTranslations('Jobs')
  const tCommon = useTranslations('Common')
  const tNav = useTranslations('Navigation')
  const tCard = useTranslations('JobCard')
  const router = useRouter()
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [jobs, setJobs] = useState<any[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])
  const [appliedJobs, setAppliedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  const [loadingApplied, setLoadingApplied] = useState(false)
  const [error, setError] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [filters, setFilters] = useState({
    location: "",
    skills: [] as string[],
    minSalary: undefined as number | undefined,
    maxSalary: undefined as number | undefined,
    minExperience: undefined as number | undefined,
    maxExperience: undefined as number | undefined,
    workType: "all" as "temporary" | "permanent" | "all",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { locale } = useTranslationLocale()

  const isSearching = Boolean(
    searchQuery.trim() ||
    filters.location.trim() ||
    filters.skills.length > 0 ||
    filters.minSalary !== undefined ||
    filters.maxSalary !== undefined ||
    filters.minExperience !== undefined ||
    filters.maxExperience !== undefined ||
    filters.workType !== "all"
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    if (user?.role === "employer") {
      router.push("/dashboard/employer")
      return
    }
  }, [authLoading, user, router])

  // Fetch Recommended Jobs
  useEffect(() => {
    const fetchRecommendedJobs = async () => {
      if (!user || user.role !== 'worker') return;
      if ((!user.skills || user.skills.length === 0) && (!user.workerType || user.workerType.length === 0)) return;

      try {
        setLoadingRecommended(true);
        const response: any = await apiClient.getJobs({
          skills: user.skills && user.skills.length > 0 ? user.skills.join(",") : undefined,
          workerType: user.workerType && user.workerType.length > 0 ? user.workerType.join(",") : undefined,
          pageNumber: 1,
          locale,
        });
        setRecommendedJobs(response.jobs || []);
      } catch (err) {
        console.error("Error fetching recommended jobs:", err);
      } finally {
        setLoadingRecommended(false);
      }
    };

    if (user) {
      fetchRecommendedJobs();
    }
  }, [user, locale]);

  // Fetch Applied Jobs
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (!user || user.role !== 'worker') return;

      try {
        setLoadingApplied(true);
        const response: any = await apiClient.getWorkerApplications();
        setAppliedJobs(response || []);
      } catch (err) {
        console.error("Error fetching applied jobs:", err);
      } finally {
        setLoadingApplied(false);
      }
    };

    if (user) {
      fetchAppliedJobs();
    }
  }, [user]);

  // Fetch All Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response: any = await apiClient.getJobs({
          keyword: searchQuery || undefined,
          location: filters.location || undefined,
          skills: filters.skills && filters.skills.length > 0 ? filters.skills.join(",") : undefined,
          minSalary: filters.minSalary,
          maxSalary: filters.maxSalary,
          minExperience: filters.minExperience,
          maxExperience: filters.maxExperience,
          workType: filters.workType === "all" ? undefined : filters.workType,
          pageNumber: currentPage,
          locale,
        })
        setJobs(response.jobs || [])
        setTotalPages(response.pages || 1)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      const timer = setTimeout(fetchJobs, 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, filters, currentPage, locale, user])

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  /* JobCard component removed - replaced by CompactJobCard */

  const AppliedJobCard = ({ application }: { application: any }) => {
    // Don't render if job has been deleted
    if (!application.job) return null;

    return (
      <Link href="/dashboard/worker">
        <Card className="h-full relative overflow-hidden border transition-all duration-500 rounded-[2rem] bg-card/40 backdrop-blur-xl border-border/40 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 group cursor-pointer">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300 tracking-tight">
                  {application.job.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mt-1">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="truncate">
                    {application.job.employer?.companyName || application.job.employer?.name || tCommon('companyFallback')}
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${application.status === 'hired' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                application.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                  'bg-blue-500/10 text-blue-600 border-blue-500/20'
                }`}>
                {t('appliedJobs.status', {
                  status: application.status === 'hired' || application.status === 'applied'
                    ? tCommon(`ApplicationStatus.${application.status}`)
                    : tCommon(`status.${application.status === 'rejected' ? 'rejected' : 'pending'}`)
                })}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[150px]">
                  {application.job.location?.address
                    ? application.job.location.address.split(',')[0].trim()
                    : tCommon('locationTBA')}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground transform group-hover:scale-105">
                {tNav('dashboard')}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
        <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
          {/* Navigation content same as before but keeping it clean */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/jobs" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {tCommon('appName')}
              </span>
            </Link>
            <div className="flex gap-3 items-center">
              {user.role === "employer" && (
                <Link href="/jobs/create">
                  <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                    <Plus className="w-4 h-4" />
                    {tNav('postJob')}
                  </Button>
                </Link>
              )}
              <NotificationBell />
              <div className="hidden md:flex items-center gap-4">
                {user.role === "worker" && (
                  <>
                    <Link href="/dashboard/worker">
                      <Button variant="ghost" className="rounded-full">
                        {tNav('dashboard')}
                      </Button>
                    </Link>
                    <Link href="/messages">
                      <Button variant="ghost" className="rounded-full">
                        {tNav('messages')}
                      </Button>
                    </Link>
                  </>
                )}
                {/* Profile removed from here as per request */}
                <LanguageSwitcher />
                <ThemeToggle />
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex items-center gap-2 rounded-full"
                >
                  <LogOut className="w-4 h-4" />
                  {tCommon('buttons.logout')}
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full md:hidden"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </div>
          </div>
        </nav>

        <div
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300 ${isMobileNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            className={`fixed right-0 top-0 h-full w-[280px] bg-card shadow-2xl p-6 transition-transform duration-300 ease-in-out border-l border-border ${isMobileNavOpen ? "translate-x-0" : "translate-x-full"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-lg text-primary">{tCommon('appName')}</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Navigation</p>
                {user.role === "worker" && (
                  <>
                    <Link href="/dashboard/worker" onClick={() => setIsMobileNavOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto">
                        <Briefcase className="w-5 h-5 mr-3 text-primary" />
                        {tNav('dashboard')}
                      </Button>
                    </Link>
                    <Link href="/messages" onClick={() => setIsMobileNavOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto">
                        <MessageSquare className="w-5 h-5 mr-3 text-primary" />
                        {tNav('messages')}
                      </Button>
                    </Link>
                  </>
                )}
                {/* Profile removed from mobile menu */}
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Settings</p>
                <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Language</span>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start flex items-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl py-6 h-auto"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {tCommon('buttons.logout')}
                </Button>
              </div>
            </div>
          </div>
        </div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 overflow-hidden">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex-1 w-full">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <div className="w-2 h-8 bg-primary rounded-full hidden sm:block"></div>
                {t('title')}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base pl-1">{t('subtitle')}</p>
            </div>
            <Button
              variant="outline"
              className="lg:hidden w-full sm:w-auto rounded-xl h-12 bg-card border-border/50 hover:bg-accent transition-all group"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-semibold">{t('filters')}</span>
            </Button>
          </div>

          <div className="lg:grid lg:grid-cols-4 lg:gap-8 h-full">
            <div className="lg:col-span-1 hidden lg:block">
              <FilterSidebar
                onApplyFilters={(f: any) => setFilters(f)}
                onResetFilters={() =>
                  setFilters({
                    location: "",
                    skills: [],
                    minSalary: undefined,
                    maxSalary: undefined,
                    minExperience: undefined,
                    maxExperience: undefined,
                    workType: "all",
                  })
                }
                initialFilters={filters}
                isMobileOpen={false}
                onCloseMobile={() => setIsSidebarOpen(false)}
              />
            </div>

            {isSidebarOpen && (
              <div
                className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-card/95 border-r border-border p-5 flex flex-col transition-transform duration-300 ease-in-out backdrop-blur-xl shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                  } lg:hidden`}
              >
                <div className="flex-1 overflow-y-auto">
                  <FilterSidebar
                    onApplyFilters={(f: any) => {
                      setFilters(f);
                      setIsSidebarOpen(false);
                    }}
                    onResetFilters={() =>
                      setFilters({
                        location: "",
                        skills: [],
                        minSalary: undefined,
                        maxSalary: undefined,
                        minExperience: undefined,
                        maxExperience: undefined,
                        workType: "all",
                      })
                    }
                    initialFilters={filters}
                    isMobileOpen={true}
                    onCloseMobile={() => setIsSidebarOpen(false)}
                  />
                </div>
              </div>
            )}

            <div className="lg:col-span-3 space-y-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-full h-12"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Recommended Jobs Section */}
              {user?.role === 'worker' && !isSearching && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary fill-primary/20" />
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {t('recommendations.title')}
                    </h2>
                  </div>

                  {loadingRecommended ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ) : recommendedJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {recommendedJobs.map(job => (
                        <CompactJobCard key={`rec-${job._id}`} job={job} isRecommended={true} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-muted/30 border border-border/50 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      {(!user.skills || user.skills.length === 0) && (!user.workerType || user.workerType.length === 0) ? (
                        <>
                          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                            {t('recommendations.noSkills')}
                          </p>
                          <Link href="/profile">
                            <Button variant="outline" className="rounded-full">
                              {t('recommendations.updateProfile')}
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          {t('recommendations.noJobs')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Applied Jobs Section */}
              {user?.role === 'worker' && !isSearching && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-bold text-foreground">
                      {t('appliedJobs.title')}
                    </h2>
                  </div>

                  {loadingApplied ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2].map(i => (
                          <div key={i} className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ) : appliedJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {appliedJobs.map(app => (
                        <AppliedJobCard key={`app-${app._id}`} application={app} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-muted/30 border border-border/50 text-center">
                      <p className="text-muted-foreground">
                        {t('appliedJobs.noApplications')}
                      </p>
                    </div>
                  )}
                </div>
              )}


              {/* All Jobs Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  {searchQuery || filters.location || (filters.skills && filters.skills.length > 0) || filters.workType !== 'all' ? 'Search Results' : 'All Jobs'}
                </h2>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.length > 0 ? (
                      jobs.map((job) => (
                        <CompactJobCard key={job._id} job={job} />
                      ))
                    ) : (
                      <div className="text-center py-12 col-span-full">
                        <p className="text-muted-foreground text-lg">{t('noJobsFound')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    variant="outline"
                    className="rounded-full"
                  >
                    {tCommon('buttons.previous')}
                  </Button>
                  <span className="text-muted-foreground">
                    {t('pagination.page', { current: currentPage, total: totalPages })}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    variant="outline"
                    className="rounded-full"
                  >
                    {tCommon('buttons.next')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
      </div >

    </>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsContent />
    </Suspense>
  )
}
