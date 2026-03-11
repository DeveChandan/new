"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, MapPin, DollarSign, Briefcase, Star, Loader2, MessageSquare, Edit, Menu, X, LogOut, Zap, Users, Upload, Power, PowerOff, Share2, CheckCircle2, GraduationCap, Building } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useTranslationLocale } from '@/hooks/useTranslation' // Import translation hook
import { CompactDocumentUploadModal } from "@/components/CompactDocumentUploadModal"
import UpgradePrompt from "@/components/UpgradePrompt"
import { toast } from "sonner"

export default function JobDetailPage() {
  const t = useTranslations('Jobs.details')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const { user, logout, isLoading: authLoading } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")
  const [isApplied, setIsApplied] = useState(false)
  const [userApplicationStatus, setUserApplicationStatus] = useState<string | null>(null)
  const [isOffered, setIsOffered] = useState(false)
  const [isHired, setIsHired] = useState(false)
  const [showRatingSection, setShowRatingSection] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingError, setRatingError] = useState("")
  const [showDisputeSection, setShowDisputeSection] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [disputeError, setDisputeError] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const { locale } = useTranslationLocale() // Get current locale for translation

  // Subscription limit state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<'databaseUnlocks' | 'activeJobs'>('activeJobs')
  const [limitData, setLimitData] = useState<{ limit: number; used: number; plan: string } | null>(null)

  const fetchJob = async () => {
    try {
      setLoading(true)
      const jobData = (await apiClient.getJobById(params.id as string, locale)) as any // Pass locale for translation
      setJob(jobData)
      // Check user's application status
      if (user && jobData.userApplicationStatus) {
        setUserApplicationStatus(jobData.userApplicationStatus)
        const status = jobData.userApplicationStatus
        setIsApplied(['pending', 'offered', 'hired', 'offerAccepted'].includes(status))
        setIsOffered(status === 'offered')
        setIsHired(['hired', 'offerAccepted'].includes(status))
      } else {
        setIsApplied(false)
        setIsOffered(false)
        setIsHired(false)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchJob()
    }
  }, [params.id, locale, authLoading, user]) // Add locale to dependency array

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
  }


  const handleApplyJob = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    setApplying(true)
    setError("")

    try {
      // Feature: Always prompt worker for CV selection/upload
      if (user.role === 'worker') {
        setShowUploadModal(true)
        setApplying(false)
        return
      }

      await apiClient.applyToJob(params.id as string)
      setIsApplied(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      if (!showUploadModal) {
        setApplying(false)
      }
    }
  }

  const handleUploadSuccess = async (cvId?: string) => {
    // After successful upload or selection, apply with CV ID
    setApplying(true)
    try {
      await apiClient.applyToJob(params.id as string, cvId)
      setIsApplied(true)
      setShowUploadModal(false)
    } catch (err: any) {
      setError(err.message)
      setShowUploadModal(false)
    } finally {
      setApplying(false)
    }
  }

  const handleSkipApply = async () => {
    // Apply without CV if skipped
    setApplying(true)
    try {
      await apiClient.applyToJob(params.id as string)
      setIsApplied(true)
      setShowUploadModal(false)
    } catch (err: any) {
      setError(err.message)
      setShowUploadModal(false)
    } finally {
      setApplying(false)
    }
  }

  const handleContactEmployer = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      const conversation = (await apiClient.createConversation(user._id, job.employer._id)) as any
      router.push(`/messages?conversationId=${conversation._id}`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmitRating = async () => {
    setRatingLoading(true)
    setRatingError("")
    try {
      if (ratingValue === 0) {
        throw new Error("Please provide a star rating.")
      }
      await apiClient.rateUser({
        job: params.id as string,
        user: job.employer._id, // Assuming employer rates worker, or vice-versa
        rating: ratingValue,
        review: reviewText,
      })
      setRatingError("Rating submitted successfully!")
      setShowRatingSection(false)
      setRatingValue(0)
      setReviewText("")
      // Optionally refetch job to update ratings display
    } catch (err: any) {
      setRatingError(err.message || "Failed to submit rating.")
    } finally {
      setRatingLoading(false)
    }
  }

  const handleSubmitDispute = async () => {
    setDisputeLoading(true)
    setDisputeError("")
    try {
      if (!disputeReason.trim()) {
        throw new Error("Please provide a reason for the dispute.")
      }

      let reportedUserId = ""
      if (user?.role === "worker") {
        reportedUserId = job.employer._id // Worker reports employer
      } else if (user?.role === "employer") {
        // Employer reports the worker who applied to this job.
        // This assumes there's only one worker for simplicity, or we need to select one.
        // For now, let's assume the first applicant is the one being disputed if multiple.
        reportedUserId = job.applicants?.[0]?._id || "" as string
        if (!reportedUserId) {
          throw new Error("No worker found to dispute for this job.")
        }
      } else {
        throw new Error("Only workers or employers can create disputes.")
      }

      await apiClient.createDispute({
        job: params.id as string,
        reportedUser: reportedUserId,
        reason: disputeReason,
      })
      toast.success("Dispute submitted successfully!")
      setShowDisputeSection(false)
      setDisputeReason("")
      setDisputeError("")
    } catch (err: any) {
      setDisputeError(err.message || "Failed to submit dispute.")
    } finally {
      setDisputeLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    const isActive = ['open', 'in-progress'].includes(job.status);
    const newStatus = isActive ? 'closed' : 'open';
    const actionName = isActive ? "Deactivate" : "Activate";

    try {
      const updatedJob = await apiClient.updateJob(job._id, { status: newStatus });
      setJob(updatedJob);
      toast.success(`Job ${isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err: any) {
      if (err.response?.data?.requiresJobClose || err.response?.data?.requiresUpgrade) {
        setUpgradeFeature('activeJobs');
        setLimitData({
          limit: err.response.data.maxActiveJobs || err.response.data.limit,
          used: err.response.data.activeJobsCount || err.response.data.used,
          plan: err.response.data.currentPlan
        });
        setShowUpgradePrompt(true);
      } else {
        toast.error(err.message || `Failed to ${actionName.toLowerCase()} job`);
      }
    }
  };

  const handleShareJob = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title,
          text: `Check out this job on Shramik Seva: ${job.title} at ${job.employer?.name || job.employer?.companyName}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Job link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/jobs" className="flex items-center gap-2 text-foreground hover:text-primary transition w-fit">
              <ArrowLeft className="w-4 h-4" />
              {tCommon('buttons.back')}
            </Link>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-destructive">{error || "Job not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/jobs" className="flex items-center gap-2 text-foreground hover:text-primary transition w-fit">
            <ArrowLeft className="w-4 h-4" />
            {tCommon('buttons.back')}
          </Link>
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" className="text-foreground hover:bg-muted rounded-full">
                  {tCommon('labels.profile')}
                </Button>
              </Link>
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 bg-transparent text-foreground rounded-full"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('buttons.logout')}
              </Button>
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
              <Link href="/profile" onClick={() => setIsMobileNavOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto">
                  <Edit className="w-5 h-5 mr-3 text-primary" />
                  {tCommon('labels.profile')}
                </Button>
              </Link>
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Settings</p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 overflow-x-hidden">
        <div className="grid md:grid-cols-3 gap-4 h-full">
          {/* Main Content */}
          <div className="md:col-span-2 min-w-0">
            <div className="mb-8">
              <div className="flex flex-col gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                      {job.workType}
                    </span>
                    {job.workerType && job.workerType.length > 0 && (
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                        {job.workerType.join(", ")}
                      </span>
                    )}
                    {job.isUrgent && (
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
                      {job.title}
                    </h1>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShareJob}
                      className="rounded-full flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 border-border/50 bg-card/50 hover:bg-accent/50 hover:scale-105 transition-all"
                      title="Share Job"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5 text-primary" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform">
                      <Building className="w-5 h-5" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">{job.employer?.companyName || job.employer?.name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Location Row - Full Width */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Location</p>
                      <p className="text-sm font-semibold leading-tight">{job.location?.address || "Remote"}</p>
                    </div>
                  </div>

                  {/* Highlights Row */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Salary */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 shadow-sm col-span-2 md:col-span-1">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Salary</p>
                        <p className="text-sm font-semibold leading-tight">
                          ₹{job.salary.toLocaleString('en-IN')} <span className="text-xs text-muted-foreground font-medium">{job.workType === 'temporary' ? '/ day' : '/ month'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Experience</p>
                        <p className="text-sm font-semibold truncate leading-tight">
                          {job.minExperience === 0 && job.maxExperience === 0
                            ? "Fresher Allowed"
                            : `${job.minExperience}-${job.maxExperience} Yrs`}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <Star className="w-5 h-5 fill-accent/20" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Rating</p>
                        <p className="text-sm font-semibold truncate leading-tight">{job.employer?.rating || "New"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="p-6 mb-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('aboutJob')}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{job.description}</p>

              {job.skills && job.skills.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{t('requiredSkills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string) => (
                      <span key={skill} className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium max-w-full overflow-hidden text-ellipsis">
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </Card>


            {/* Additional Info */}
            <Card className="p-6 mb-6 bg-card/80 border-border/50 backdrop-blur-lg">
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('jobDetails')}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('workType')}</p>
                  <p className="text-foreground font-semibold capitalize">{job.workType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('workerType')}</p>
                  <p className="text-foreground font-semibold capitalize">{job.workerType?.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('totalApplicants')}</p>
                  <p className="text-foreground font-semibold">{job.applicants?.length || 0}</p>
                </div>
                {/* New: Total Openings */}
                {job.totalOpenings && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('totalOpenings')}</p>
                    <p className="text-foreground font-semibold">{job.totalOpenings}</p>
                  </div>
                )}
                {/* New: Duration Days (only for temporary jobs) */}
                {job.workType === "temporary" && job.durationDays && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('duration')}</p>
                    <p className="text-foreground font-semibold">{job.durationDays} {t('days')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('posted')}</p>
                  <p className="text-foreground font-semibold">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{tCommon('labels.status')}</p>
                  <p className="text-foreground font-semibold capitalize">
                    {job.workers?.some((w: any) => w.workerId?._id === user?._id)
                      ? job.status
                      : 'Open'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Rating Section */}
            {user?.role === "employer" && job.employer?._id === user._id && job.status === "completed" && (
              <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg mt-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">{t('rateWorker')}</h2>
                {ratingError && (
                  <div className="mb-4 p-2 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                    {ratingError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground mb-2">{t('yourRating')}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer ${star <= ratingValue ? "fill-primary text-primary" : "text-muted-foreground"
                            }`}
                          onClick={() => setRatingValue(star)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2">{t('review')}</p>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={t('reviewPlaceholder')}
                      rows={4}
                      className="w-full bg-input/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-y"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitRating}
                    disabled={ratingLoading || ratingValue === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  >
                    {ratingLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      t('submitRating')
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Dispute Section */}
            {(user?.role === "employer" || (user?.role === "worker" && isApplied)) && (
              <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg mt-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">{t('reportDispute')}</h2>
                {disputeError && (
                  <div className="mb-4 p-2 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                    {disputeError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground mb-2">{t('disputeReason')}</p>
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder={t('disputePlaceholder')}
                      rows={4}
                      className="w-full bg-input/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-y"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitDispute}
                    disabled={disputeLoading || !disputeReason.trim()}
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full"
                  >
                    {disputeLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      t('submitDispute')
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="relative md:col-span-1 min-w-0">
            <div className="md:sticky md:top-24 space-y-4">
              <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg rounded-3xl shadow-xl shadow-primary/5">
                {/* Employer Info */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 shadow-inner">
                    <Building className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {job.employer?.name || job.employer?.companyName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Verified Employer</p>
                  {job.employer?.rating && (
                    <div className="flex items-center gap-1 mt-3 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span className="text-sm font-bold text-primary">{job.employer.rating}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* About Company (Moved from Main Content) */}
              {job.employer && (
                <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg rounded-3xl shadow-xl shadow-primary/5">
                  <h4 className="text-sm font-bold text-foreground mb-4 pb-3 border-b border-border/50">{t('aboutCompany') || 'About the Company'}</h4>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Company Name</span>
                        <p className="text-sm font-bold text-foreground">
                          {job.employer.companyName || job.employer.name || 'Not Available'}
                        </p>
                      </div>

                      {job.employer.businessType && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Business Type</span>
                          <p className="text-sm font-semibold text-foreground">
                            {job.employer.businessType}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Description</span>
                        <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4">
                          {job.employer.companyDetails?.description || t('noDescriptionFound') || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    {(job.employer.companyDetails?.website) && (
                      <div className="pt-2">
                        <a
                          href={job.employer.companyDetails.website.startsWith('http') ? job.employer.companyDetails.website : `https://${job.employer.companyDetails.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 w-full"
                        >
                          {t('visitWebsite') || 'Visit Website'}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg rounded-3xl shadow-xl shadow-primary/5">
                <div className="space-y-3">
                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-[10px] sm:text-xs text-destructive font-medium animate-pulse">
                      {error}
                    </div>
                  )}

                  {user?.role === "worker" && (
                    isHired ? (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                          <Zap className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-sm font-bold text-green-500">{t('youAreHired')}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{t('congratulations')}</p>
                      </div>
                    ) : isOffered ? (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                        <p className="text-sm font-bold text-blue-500">{t('jobOfferReceived')}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider mb-3">{t('reviewAndRespond')}</p>
                        <Link href="/dashboard/worker/hiring-requests">
                          <Button variant="default" className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                            {t('viewOffer')}
                          </Button>
                        </Link>
                      </div>
                    ) : isApplied ? (
                      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
                        <p className="text-sm font-bold text-primary">{t('applicationSent')}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{t('awaitingReview')}</p>
                      </div>
                    ) : (
                      <Button
                        onClick={handleApplyJob}
                        disabled={applying}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {applying ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{t('applying')}</span>
                          </div>
                        ) : (
                          <span>{t('applyNow')}</span>
                        )}
                      </Button>
                    )
                  )}

                  {user?.role === "worker" && (
                    <Button
                      onClick={handleContactEmployer}
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-border/50 hover:bg-accent text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-primary" />
                      {t('contactEmployer')}
                    </Button>
                  )}
                </div>
              </Card>

              {user?._id === job.employer?._id && (
                <Card className="p-4 bg-card/80 border-border/50 backdrop-blur-lg rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Management</p>
                  <Link href={`/dashboard/employer/jobs/${job._id}/applicants`} className="block">
                    <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-border/50">
                      <Users className="w-4 h-4 mr-3 text-primary" />
                      {t('viewApplicants')}
                    </Button>
                  </Link>
                  <Link href={`/jobs/${job._id}/edit`} className="block">
                    <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-border/50">
                      <Edit className="w-4 h-4 mr-3 text-primary" />
                      {tCommon('buttons.edit')}
                    </Button>
                  </Link>

                  <Button
                    variant={['open', 'in-progress'].includes(job.status) ? "destructive" : "default"}
                    onClick={handleToggleStatus}
                    className="w-full justify-start rounded-xl h-12"
                  >
                    {['open', 'in-progress'].includes(job.status) ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-3" />
                        Deactivate Job
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-3" />
                        Activate Job
                      </>
                    )}
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <CompactDocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        onSkip={handleSkipApply}
      />

      {showUpgradePrompt && limitData && (
        <UpgradePrompt
          open={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          feature={upgradeFeature}
          limit={limitData.limit}
          used={limitData.used}
          currentPlan={limitData.plan}
        />
      )}
    </div>
  )
}