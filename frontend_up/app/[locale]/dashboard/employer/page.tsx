"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" // Import Label component
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { Briefcase, Users, Loader2, LogOut, Plus, Search, TrendingUp, MapPin, DollarSign, Menu, X, Star, MessageSquare, Edit2, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import io from "socket.io-client"
import { useTranslations } from 'next-intl'
import { NotificationBell } from '@/components/NotificationBell' // Import NotificationBell
import { useNotification } from "@/contexts/NotificationContext"
import { WorklogAccessModal } from "@/components/WorklogAccessModal"
import SubscriptionUsageCard from '@/components/SubscriptionUsageCard'


// Local socket initialization removed in favor of global NotificationContext

export default function EmployerDashboardPage() {
  const t = useTranslations('Dashboard.employer')
  const tCommon = useTranslations('Common')
  const tNav = useTranslations('Navigation')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [hiredJobs, setHiredJobs] = useState<any[]>([])
  const [workLogs, setWorkLogs] = useState<Record<string, any[]>>({})
  const [pendingRatingPrompts, setPendingRatingPrompts] = useState<any[]>([])
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRatingPrompt, setCurrentRatingPrompt] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const { socket } = useNotification();


  const fetchDashboardData = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      setLoading(true);
      setError("");

      const [
        dashboardResponse,
        analyticsResponse,
        hiredJobsResponse,
        promptsResponse,
        subscriptionResponse
      ] = await Promise.all([
        apiClient.getEmployerDashboard(),
        apiClient.getEmployerAnalytics(),
        apiClient.getHiredJobsForEmployer(),
        apiClient.getPendingRatingPrompts(),
        apiClient.getCurrentSubscription()
      ]);

      setDashboardData(dashboardResponse);
      setAnalyticsData(analyticsResponse);
      setHiredJobs(hiredJobsResponse as any[]);
      setPendingRatingPrompts(promptsResponse as any[]);
      setSubscription(subscriptionResponse);

      const hasWorklogAccess = subscriptionResponse && (
        subscriptionResponse.plan === 'premium' ||
        (subscriptionResponse.worklogAccessExpiry && new Date(subscriptionResponse.worklogAccessExpiry) > new Date())
      );

      if (hasWorklogAccess && (hiredJobsResponse as any[]).length > 0) {
        const workLogPromises = (hiredJobsResponse as any[]).map((job: any) => apiClient.getWorkLogsByJob(job._id));
        const workLogsResults = await Promise.allSettled(workLogPromises);

        const workLogsByJob: Record<string, any[]> = {};
        (hiredJobsResponse as any[]).forEach((job: any, index: number) => {
          const result = workLogsResults[index];
          if (result.status === 'fulfilled') {
            workLogsByJob[job._id] = result.value as any[];
          } else {
            // If failed (maybe access revoked mid-session?), just set empty
            workLogsByJob[job._id] = [];
            // Optional: log error but don't crash or show user toast
            console.warn(`Failed to fetch worklogs for job ${job._id}:`, result.reason);
          }
        });
        setWorkLogs(workLogsByJob);
      } else {
        setWorkLogs({});
      }

    } catch (err: any) {
      setError("An unexpected error occurred while loading the dashboard.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "employer")) {
      router.push("/auth/login");
      return;
    }

    if (!authLoading && user && user.role === "employer") {
      // Check if company profile is complete
      if (!user.companyDetails?.isProfileComplete) {
        router.push("/dashboard/employer/onboarding");
        return;
      }

      fetchDashboardData();

      const handleWorkLogUpdate = (data: any) => {
        if (document.visibilityState !== 'visible') return;
        const updatedLog = data.workLog || data;
        const jobId = data.jobId || updatedLog.job;
        setWorkLogs((prevWorkLogs: Record<string, any[]>) => {
          const newWorkLogs = { ...prevWorkLogs };
          const jobLogs = prevWorkLogs[jobId] ? [...prevWorkLogs[jobId]] : [];
          const logIndex = jobLogs.findIndex((log: any) => log._id === updatedLog._id);

          if (logIndex !== -1) {
            jobLogs[logIndex] = { ...jobLogs[logIndex], ...updatedLog };
          } else {
            jobLogs.push(updatedLog);
          }
          newWorkLogs[jobId] = jobLogs;
          return newWorkLogs;
        });
        fetchDashboardData();
      };

      if (socket) {
        socket.on("jobUpdated", fetchDashboardData);
        socket.on("jobCreated", fetchDashboardData);
        socket.on('workLogUpdated', handleWorkLogUpdate);

        return () => {
          socket.off("jobUpdated", fetchDashboardData);
          socket.off("jobCreated", fetchDashboardData);
          socket.off('workLogUpdated', handleWorkLogUpdate);
        };
      }
    }
  }, [user, authLoading, router, fetchDashboardData, socket]);

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  const openRatingModal = (prompt: any) => {
    setCurrentRatingPrompt(prompt);
    setShowRatingModal(true);
    setRatingValue(0); // Reset rating
    setReviewText(""); // Reset review
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setCurrentRatingPrompt(null);
  };

  const handleRatingSubmit = async () => {
    if (!currentRatingPrompt || ratingValue === 0) {
      setError("Please provide a rating.");
      return;
    }
    setSubmittingRating(true);
    try {
      await apiClient.rateUser({
        job: currentRatingPrompt.jobId,
        user: currentRatingPrompt.userIdToRate,
        rating: ratingValue,
        review: reviewText,
      });
      closeRatingModal();
      fetchDashboardData(); // Refresh dashboard to update prompts
    } catch (err: any) {
      setError(err.message || "Failed to submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleHireWorker = async (jobId: string, workerId: string) => {
    if (window.confirm(t('alerts.confirmHire'))) {
      try {
        await apiClient.hireWorkerForJob(jobId, workerId);
        fetchDashboardData(); // Re-fetch for consistency
      } catch (err: any) {
        setError(err.message || "Failed to hire worker.");
      }
    }
  };

  const handleRejectApplicant = async (jobId: string, applicantId: string) => {
    if (window.confirm(t('alerts.confirmReject'))) {
      try {
        await apiClient.rejectApplicant(jobId, applicantId);
        fetchDashboardData(); // Re-fetch for consistency
      } catch (err: any) {
        setError(err.message || "Failed to reject applicant.");
      }
    }
  };

  const getLatestWorkLog = (jobId: string, workerId: string) => {
    const areIdsEqual = (id1: any, id2: any) => {
      if (!id1 || !id2) return false;
      const str1 = typeof id1 === 'object' ? (id1._id || id1.toString()) : id1;
      const str2 = typeof id2 === 'object' ? (id2._id || id2.toString()) : id2;
      return String(str1) === String(str2);
    };

    const workerLogs = workLogs[jobId]?.filter((log: any) => {
      return areIdsEqual(log.worker, workerId);
    }) || [];

    return workerLogs.sort((a: any, b: any) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    })[0];
  };

  const jobsWithActivity = hiredJobs.map(job => {
    const activeWorkers = job.workers.filter((workerObj: any) => {
      const log = getLatestWorkLog(job._id, workerObj.workerId._id);
      const isToday = (dateString: string | Date) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();
      };

      // Include if OTP exists OR if it was verified, AND it is from TODAY
      return log &&
        (log.startOtp || log.endOtp || log.startOtpVerified || log.endOtpVerified) &&
        (isToday(log.workDate || log.createdAt));
    });
    return { ...job, activeWorkers };
  }).filter(job => job.activeWorkers.length > 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== "employer" || !dashboardData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/employer" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {tCommon('appName')}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/messages"><Button variant="ghost" className="text-foreground hover:bg-accent rounded-full">{tNav('messages')}</Button></Link>
              <Link href="/profile"><Button variant="ghost" className="text-foreground hover:bg-accent rounded-full">{tCommon('navigation.profile')}</Button></Link>
              <NotificationBell />
              <LanguageSwitcher />
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 bg-transparent text-foreground rounded-full"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">{tCommon('navigation.logout')}</span></Button>
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <NotificationBell />
              <ThemeToggle /> {/* Theme toggle always visible */}
            </div>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full sm:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </div>
        </div>
      </nav>


      {/* Mobile Navigation Menu (Slider) */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 sm:hidden transition-opacity duration-300 ${isMobileNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
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
              <Link href="/messages" onClick={() => setIsMobileNavOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto">
                  <MessageSquare className="w-5 h-5 mr-3 text-primary" />
                  {tNav('messages')}
                </Button>
              </Link>
              <Link href="/profile" onClick={() => setIsMobileNavOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto">
                  <Edit2 className="w-5 h-5 mr-3 text-primary" />
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <Link href="/dashboard/employer/hire-talent" onClick={() => setIsMobileNavOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto">
                  <Search className="w-5 h-5 mr-3 text-primary" />
                  {tCommon('navigation.hireTalent')}
                </Button>
              </Link>
              <Link href="/jobs/create" onClick={() => setIsMobileNavOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto">
                  <Plus className="w-5 h-5 mr-3 text-primary" />
                  {tCommon('navigation.postJob')}
                </Button>
              </Link>
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Settings</p>
              <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Language</span>
                <LanguageSwitcher />
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start flex items-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl py-6 h-auto"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {tCommon('navigation.logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t('title')}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
          </div>
          <div className="flex flex-wrap justify-start sm:justify-end gap-2 mt-4 sm:mt-0">
            <Link href="/dashboard/employer/hire-talent">
              <Button variant="outline" className="rounded-full flex items-center gap-2">
                <Users className="w-4 h-4" />
                {tCommon('navigation.hireTalent')}
              </Button>
            </Link>
            <Link href="/dashboard/employer/analytics">
              <Button variant="outline" className="rounded-full">
                {t('viewAnalytics')}
              </Button>
            </Link>
            <Link href="/dashboard/employer/hired-jobs">
              <Button variant="outline" className="rounded-full">
                {t('stats.hiredWorkers')}
              </Button>
            </Link>
            <Link href="/dashboard/employer/jobs">
              <Button variant="outline" className="rounded-full">
                {t('manageJobs')}
              </Button>
            </Link>
            <Link href="/jobs/create">
              <Button variant="default" className="flex items-center gap-2 rounded-full">
                <Plus className="w-4 h-4" />
                {t('postNewJob')}
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {pendingRatingPrompts.length > 0 && (
              <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" /> {t('pendingRatings.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  {pendingRatingPrompts.map((prompt, index) => (
                    <div key={index} className="p-3 border border-border/50 rounded-lg bg-muted/20 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{t('pendingRatings.rateUser', { user: prompt.userNameToRate, job: prompt.jobTitle })}</p>
                        <p className="text-xs text-muted-foreground capitalize">{t('pendingRatings.jobType', { type: prompt.jobType })}</p>
                      </div>
                      <Button size="sm" onClick={() => openRatingModal(prompt)}>{t('pendingRatings.rateNow')}</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: t('stats.activeJobs'), value: analyticsData?.activeJobs || 0, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
                { label: t('stats.totalApplicants'), value: dashboardData?.totalApplicants || 0, icon: Users, color: "text-accent", bg: "bg-accent/10" },
                { label: t('stats.openApplications'), value: dashboardData?.openApplications || 0, icon: Search, color: "text-primary", bg: "bg-primary/10" },
                { label: t('stats.closedApplications'), value: analyticsData?.closedApplications || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: t('stats.hireRequests'), value: analyticsData?.hireRequests || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: t('stats.lifetimeHireRequests'), value: analyticsData?.totalLifetimeHireRequests || 0, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
                { label: t('stats.hires'), value: dashboardData?.hires || 0, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
              ].map((stat, idx) => (
                <Card key={idx} className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg hover:shadow-xl hover:shadow-primary/5 transition-all group rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
              <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg hover:shadow-xl hover:shadow-primary/5 transition-all group rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('stats.totalSpent')}</CardTitle>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-xl sm:text-2xl font-bold">₹{analyticsData?.totalSpent || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg sm:text-2xl font-semibold text-foreground">{t('recentApplicants')}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {loading ? ( // Check loading state here
                  <div className="space-y-4">
                    {/* Skeleton for job titles */}
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2 pl-4">
                      {/* Skeleton for applicant details */}
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2 pl-4">
                      {/* Skeleton for applicant details */}
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ) : dashboardData.recentApplications && dashboardData.recentApplications.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentApplications.slice(0, 3).map((application: any) => (
                      <div key={application._id} className="p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/20">
                        <p className="font-medium text-sm sm:text-base text-foreground mb-2">
                          {t('recentApps.appliedBy', { title: application.job?.title, name: application.worker?.name })}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 border-t border-border/50 first:border-t-0">
                          <div>
                            <p className="text-sm font-medium text-foreground">{application.worker?.name}</p>
                            <p className="text-xs text-muted-foreground">{application.worker?.email}</p>
                            <p className="text-xs text-muted-foreground">{t('recentApps.status', { status: application.status })}</p>
                            <p className={`text-xs ${application.worker?.availability === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                              {application.worker?.availability}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <Link href={`/profile/${application.worker?._id}?jobId=${application.job?._id}&context=applicant`}>
                              <Button variant="outline" size="sm" className="rounded-full">{t('recentApps.viewProfile')}</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center mt-4">
                      <Link href="/dashboard/employer/applicants">
                        <Button variant="default" className="rounded-full">{t('recentApps.manageAll')}</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('recentApps.noApplicants')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg sm:text-2xl font-semibold text-foreground">{t('recentActivity.title')}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {(() => {
                  const hasWorklogAccess = subscription && (
                    subscription.planType === 'premium' ||
                    (subscription.worklogAccessExpiry && new Date(subscription.worklogAccessExpiry) > new Date())
                  );

                  if (!hasWorklogAccess) {
                    return (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-10 px-4 text-center bg-muted/20 rounded-lg border border-dashed border-border">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Unlock Worklogs & Activity</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-[280px] sm:max-w-sm mb-6">
                          Monitor worker attendance, view OTPs, and track daily progress with our advanced worklog features.
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                          <Button onClick={() => setShowAccessModal(true)} className="rounded-full gap-2 w-full">
                            Unlock for ₹2499 <span className="text-xs opacity-80">(30 Days)</span>
                          </Button>
                          <Link href="/subscriptions" className="w-full">
                            <Button variant="outline" className="rounded-full w-full">Upgrade Plan</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  }

                  return jobsWithActivity.length > 0 ? (
                    <div className="space-y-4">
                      {jobsWithActivity.slice(0, 5).map((job: any) => (
                        <div key={job._id} className="p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/20">
                          <p className="font-medium text-sm sm:text-base text-foreground mb-2">{job.title}</p>
                          {job.activeWorkers.map((workerObj: any) => {
                            const result = getLatestWorkLog(job._id, workerObj.workerId._id);
                            const workLog = result;
                            const worker = workerObj.workerId;

                            return (
                              <div key={worker._id} className="py-2 border-t border-border/30 first:border-t-0">
                                <p className="text-sm font-medium text-foreground">{worker.name}</p>
                                <p className="text-xs text-muted-foreground">{worker.mobile}</p>

                                {workLog?.startOtp && (
                                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                                      🔓 Start Work OTP: <span className="text-base font-mono">{workLog.startOtp}</span>
                                    </p>
                                  </div>
                                )}
                                {workLog?.startOtpVerified && !workLog.startOtp && (
                                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg opacity-75">
                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                                      ✅ Start OTP Verified
                                    </p>
                                  </div>
                                )}

                                {workLog?.endOtp && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                      🔒 End Work OTP: <span className="text-base font-mono">{workLog.endOtp}</span>
                                    </p>
                                  </div>
                                )}
                                {workLog?.endOtpVerified && !workLog.endOtp && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg opacity-75">
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                      ✅ End OTP Verified
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Zap className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">{t('recentActivity.noActivityTitle')}</p>
                      <p className="text-sm text-muted-foreground max-w-xs mt-1">
                        {t('recentActivity.noActivityDesc')}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <h3 className="text-lg sm:text-2xl font-semibold text-foreground mb-4">{t('subscription.title')}</h3>
              {subscription ? (
                <>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {t('subscription.currentPlan', {
                      plan: subscription.planType?.charAt(0).toUpperCase() + subscription.planType?.slice(1) || 'N/A'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('subscription.renewsOn', {
                      date: new Date(subscription.endDate).toLocaleDateString()
                    })}
                  </p>
                  <div className="mt-3 text-sm">
                    <p className="text-muted-foreground">
                      Database Unlocks: <span className="font-semibold text-foreground">
                        {subscription.databaseUnlocksUsed || 0} / {subscription.maxDatabaseUnlocks || 0}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No active subscription</p>
              )}
              <div className="flex gap-2 mt-4">
                <Link href="/subscriptions" className="flex-1">
                  <Button className="w-full rounded-full">{t('subscription.manage')}</Button>
                </Link>
                <Link href="/billing" className="flex-1">
                  <Button variant="outline" className="w-full rounded-full">View Invoices</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {
        showRatingModal && currentRatingPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <CardHeader>
                <CardTitle>{t('ratingModal.title', { user: currentRatingPrompt.userNameToRate })}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('ratingModal.forJob', { job: currentRatingPrompt.jobTitle })}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rating">{t('ratingModal.rating')}</Label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`cursor-pointer ${star <= ratingValue ? "text-yellow-500 fill-current" : "text-muted-foreground"
                          }`}
                        onClick={() => setRatingValue(star)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="review">{t('ratingModal.reviewOptional')}</Label>
                  <Input
                    id="review"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={t('ratingModal.reviewPlaceholder')}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeRatingModal} disabled={submittingRating}>
                    {tCommon('buttons.cancel')}
                  </Button>
                  <Button onClick={handleRatingSubmit} disabled={submittingRating || ratingValue === 0}>
                    {submittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('ratingModal.submit')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }
      <WorklogAccessModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSuccess={() => {
          fetchDashboardData();
          setShowAccessModal(false);
        }}
      />
    </div>
  );
}