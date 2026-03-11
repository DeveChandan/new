"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import io from "socket.io-client"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { Briefcase, Star, Loader2, LogOut, CheckCircle, Clock, TrendingUp, MessageSquare, FileText, Edit2, Menu, X, Zap } from "lucide-react"
import { AssignedJobCard } from "@/components/AssignedJobCard"
import { CompactJobCard } from "@/components/CompactJobCard"
import { ApplicationStatusModal } from "@/components/ApplicationStatusModal"
import { ApplicationsListModal } from "@/components/ApplicationsListModal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle" // Import ThemeToggle
import LanguageSwitcher from "@/components/LanguageSwitcher" // Import LanguageSwitcher
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label" // Import Label component
import { Input } from "@/components/ui/input" // Import Input component
import { useTranslations } from 'next-intl'
import { useTranslationLocale } from '@/hooks/useTranslation' // Import translation hook
import { NotificationBell } from '@/components/NotificationBell' // Import NotificationBell

export default function WorkerDashboardPage() {
  const t = useTranslations('Dashboard.worker')
  const tCommon = useTranslations('Common')
  const tNav = useTranslations('Navigation')
  const router = useRouter()
  const { user, setUser, isLoading: authLoading, refreshUser } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [assignedJobs, setAssignedJobs] = useState<any[]>([]) // New state
  const [pendingRatingPrompts, setPendingRatingPrompts] = useState<any[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRatingPrompt, setCurrentRatingPrompt] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showApplicationStatusModal, setShowApplicationStatusModal] = useState(false)
  const [showAllApplicationsModal, setShowAllApplicationsModal] = useState(false)
  const [activeTab, setActiveTab] = useState("applied")
  const { locale } = useTranslationLocale() // Get current locale for translation

  const fetchAssignedJobs = async () => {
    try {
      setLoading(true) // Set loading to true when fetching starts
      const data = (await apiClient.getAssignedJobs(locale)) as any[] // Pass locale for translation
      setAssignedJobs(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch assigned jobs.");
    } finally {
      setLoading(false); // Set loading to false when fetching ends
    }
  }



  useEffect(() => {
    if (!authLoading && (!user || user.role !== "worker")) {
      router.push("/auth/login")
      return
    }

    const fetchDashboardData = async () => {
      try {
        const data = await apiClient.getWorkerDashboard()
        setDashboardData(data)
      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard data.")
      }
    }

    if (!authLoading && user && user.role === "worker") {
      const initDashboard = async () => {
        await fetchDashboardData();
        await fetchAssignedJobs();
        const prompts = (await apiClient.getPendingRatingPrompts()) as any[]
        setPendingRatingPrompts(prompts);
      };
      initDashboard();
    }
  }, [user, locale, authLoading, router])

  // Separate socket effect — only reconnects when the user changes (not locale/authLoading)
  useEffect(() => {
    if (!user?._id) return;

    const fetchDashboardData = async () => {
      try {
        const data = await apiClient.getWorkerDashboard()
        setDashboardData(data)
      } catch (_) { }
    }

    const socket = io(API_ROOT_URL, { path: '/api/socket.io', withCredentials: true })
    socket.emit("joinUserRoom", `user:${user._id}`)
    socket.on("notification:new", () => {
      fetchDashboardData()
    })

    return () => {
      socket.disconnect()
    }
  }, [user?._id])

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
      // Re-fetch pending prompts to update the list
      const updatedPrompts = (await apiClient.getPendingRatingPrompts()) as any[]
      setPendingRatingPrompts(updatedPrompts);
      // Refresh the current user's data to get updated rating if they were rated
      refreshUser();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!user) return;

    setIsUpdatingAvailability(true);
    setError("");
    try {
      const newAvailability = user.availability === "available" ? "unavailable" : "available";
      await apiClient.updateProfile({ availability: newAvailability });
      // Update local user state
      const updatedUser = { ...user, availability: newAvailability };
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Update localStorage
      // Optionally, trigger a re-fetch of dashboard data if availability affects it
      // fetchDashboardData();
    } catch (err: any) {
      setError(err.message || "Failed to update availability.");
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== "worker" || !dashboardData) {
    return null // Should be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/jobs" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {tCommon('appName')}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/messages">
                <Button variant="ghost" className="text-foreground hover:bg-accent rounded-full">
                  {tNav('messages')}
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" className="text-foreground hover:bg-accent rounded-full">
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 bg-transparent text-foreground rounded-full"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('navigation.logout')}
              </Button>
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <NotificationBell />
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
                {tCommon('navigation.logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t('title')}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0">
            <Select
              onValueChange={async (value: "available" | "unavailable") => {
                if (!user) return;
                setIsUpdatingAvailability(true);
                setError("");
                try {
                  await apiClient.updateProfile({ availability: value });
                  const updatedUser = { ...user, availability: value };
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                  setUser(updatedUser); // Update the user state in useAuth
                  // Optionally, trigger a re-fetch of dashboard data if availability affects it
                  // fetchDashboardData();
                } catch (err: any) {
                  setError(err.message || "Failed to update availability.");
                } finally {
                  setIsUpdatingAvailability(false);
                }
              }}
              value={user.availability || "unavailable"}
              disabled={isUpdatingAvailability}
            >
              <SelectTrigger className={`w-full sm:w-[180px] rounded-full ${user.availability === "available" ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50"}`}>
                <SelectValue placeholder={t('setAvailability')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">{t('available')}</SelectItem>
                <SelectItem value="unavailable">{t('unavailable')}</SelectItem>
              </SelectContent>
            </Select>
            {isUpdatingAvailability && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {pendingRatingPrompts.length > 0 && (
              <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" /> {t('pendingRatings')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  {pendingRatingPrompts.map((prompt, index) => (
                    <div key={index} className="p-3 border border-border/50 rounded-lg bg-muted/20 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{t('rateUser', { name: prompt.userNameToRate, job: prompt.jobTitle })}</p>
                        <p className="text-xs text-muted-foreground capitalize">{prompt.jobType} Job</p>
                      </div>
                      <Button size="sm" onClick={() => openRatingModal(prompt)}>{t('rateNow')}</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 sm:gap-6">
              <Card className="p-5 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg hover:shadow-xl hover:shadow-primary/5 transition-all group rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('stats.activeApplications')}</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{dashboardData.activeApplications || 0}</div>
                </CardContent>
              </Card>
              <Card className="p-5 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg hover:shadow-xl hover:shadow-primary/5 transition-all group rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('stats.messages')}</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <MessageSquare className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{dashboardData.messages || 0}</div>
                </CardContent>
              </Card>
              <Card className="p-5 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg hover:shadow-xl hover:shadow-primary/5 transition-all group rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('stats.earnings')}</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground text-primary">₹{dashboardData.totalEarnings || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Assigned Work */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">{t('assignedJobs')}</h2>
              {assignedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedJobs.map((job: any) => (
                    <AssignedJobCard key={job._id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('noAssignedJobs')}</p>
              )}
            </div>

            {/* Recommended Jobs */}
            <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-semibold text-foreground">{t('recommendedJobs')}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {dashboardData.recommendedJobs && dashboardData.recommendedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.recommendedJobs.map((job: any) => (
                      <CompactJobCard key={job._id} job={job} isRecommended={true} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('noRecommendedJobs')}</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Applications with Tabs */}
            <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-2xl font-semibold text-foreground">{t('recentApplications')}</CardTitle>
                  <Tabs defaultValue="applied" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
                      <TabsTrigger value="applied">{t('tabs.appliedJobs')}</TabsTrigger>
                      <TabsTrigger value="hiring">{t('tabs.hiringRequests')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {dashboardData.recentApplications && dashboardData.recentApplications.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentApplications
                      .filter((app: any) => {
                        if (activeTab === 'applied') {
                          // Show worker initiated applications: pending, approved, hired (worker), rejected
                          return ['pending', 'approved', 'hired', 'rejected'].includes(app.status);
                        } else {
                          // Show employer initiated requests: offered, offerAccepted, offerRejected
                          return ['offered', 'offerAccepted', 'offerRejected'].includes(app.status);
                        }
                      })
                      .slice(0, 3)
                      .map((app: any) => (
                        <div
                          key={app.applicationId || app._id}
                          onClick={() => {
                            setSelectedApplication(app)
                            setShowApplicationStatusModal(true)
                          }}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/20 space-y-1 sm:space-y-0 cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${['hired', 'offerAccepted', 'offered'].includes(app.status) ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}`}>
                              {['hired', 'offerAccepted'].includes(app.status) ? <CheckCircle className="w-4 h-4" /> :
                                app.status === 'offered' ? <Briefcase className="w-4 h-4" /> :
                                  <FileText className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{app.title}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t('appliedOn')} {new Date(app.appliedDate || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === "approved" || app.status === "hired" || app.status === "offerAccepted"
                              ? "bg-green-500/20 text-green-400"
                              : app.status === "pending" || app.status === "offered"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : app.status === "rejected" || app.status === "offerRejected"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                          >
                            {app.status === 'offerAccepted' ? 'Hired' :
                              app.status === 'offered' ? 'Offer Received' :
                                app.status === 'offerRejected' ? 'Offer Declined' :
                                  app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </div>
                      ))}

                    {dashboardData.recentApplications.filter((app: any) => {
                      if (activeTab === 'applied') {
                        return ['pending', 'approved', 'hired', 'rejected'].includes(app.status);
                      } else {
                        return ['offered', 'offerAccepted', 'offerRejected'].includes(app.status);
                      }
                    }).length > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full text-black dark:text-white hover:bg-primary/5 hover:text-primary font-bold mt-2 rounded-xl"
                          onClick={() => setShowAllApplicationsModal(true)}
                        >
                          {t('viewAll')}
                        </Button>
                      )}

                    {dashboardData.recentApplications.filter((app: any) => {
                      if (activeTab === 'applied') {
                        return ['pending', 'approved', 'hired', 'rejected'].includes(app.status);
                      } else {
                        return ['offered', 'offerAccepted', 'offerRejected'].includes(app.status);
                      }
                    }).length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          {activeTab === 'applied' ? "No applied jobs found." : "No hiring requests found."}
                        </p>
                      )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('noRecentApplications')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="space-y-6">
            <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl shadow-primary/5">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                {t('quickActions')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                <Link href="/profile" className="w-full">
                  <Button variant="outline" className="w-full justify-start hover:bg-primary/20 border-primary/20 hover:text-primary rounded-xl h-12">
                    <Edit2 className="w-4 h-4 mr-2 text-primary" />
                    <span className="truncate">{t('updateProfile')}</span>
                  </Button>
                </Link>
                <Link href="/profile" className="w-full">
                  <Button variant="outline" className="w-full justify-start hover:bg-primary/20 border-primary/20 hover:text-primary rounded-xl h-12">
                    <FileText className="w-4 h-4 mr-2 text-primary" />
                    <span className="truncate">{t('uploadDocuments')}</span>
                  </Button>
                </Link>
                <Link href="/dashboard/worker/work-logs" className="w-full">
                  <Button variant="outline" className="w-full justify-start hover:bg-primary/20 border-primary/20 hover:text-primary rounded-xl h-12">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    <span className="truncate">{t('workLogs.title')}</span>
                  </Button>
                </Link>
                <Link href="/dashboard/worker/hiring-requests" className="w-full">
                  <Button variant="outline" className="w-full justify-start hover:bg-primary/20 border-primary/20 hover:text-primary rounded-xl h-12">
                    <Briefcase className="w-4 h-4 mr-2 text-primary" />
                    <span className="truncate">{t('hiringRequests.title')}</span>
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Placeholder for Profile Summary / Rating */}
            <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('myRating')}</h3>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-primary">{user.rating || "N/A"}</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(user.rating || 0) ? "fill-primary text-primary" : "text-muted-foreground"
                        }`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {showRatingModal && currentRatingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle>{t('rateUser', { name: currentRatingPrompt.userNameToRate, job: currentRatingPrompt.jobTitle })}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('rateUser', { name: '', job: currentRatingPrompt.jobTitle }).replace("  ", " ")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rating">{t('rating')}</Label>
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
                <Label htmlFor="review">{t('review')}</Label>
                <Input
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t('writeReview')}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeRatingModal} disabled={submittingRating}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleRatingSubmit} disabled={submittingRating || ratingValue === 0}>
                  {submittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('submitRating')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <ApplicationStatusModal
        isOpen={showApplicationStatusModal}
        onClose={() => {
          setShowApplicationStatusModal(false)
          setSelectedApplication(null)
        }}
        application={selectedApplication}
      />
      <ApplicationsListModal
        isOpen={showAllApplicationsModal}
        onClose={() => setShowAllApplicationsModal(false)}
        title={activeTab === 'applied' ? t('recentApplications') : t('tabs.hiringRequests')}
        onSelectApplication={(app) => {
          setShowAllApplicationsModal(false);
          setSelectedApplication(app);
          setShowApplicationStatusModal(true);
        }}
        applications={dashboardData.recentApplications.filter((app: any) => {
          if (activeTab === 'applied') {
            return ['pending', 'approved', 'hired', 'rejected'].includes(app.status);
          } else {
            return ['offered', 'offerAccepted', 'offerRejected'].includes(app.status);
          }
        })}
      />
    </div>
  )
}
