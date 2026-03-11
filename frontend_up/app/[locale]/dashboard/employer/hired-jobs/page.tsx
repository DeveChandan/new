
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, ArrowLeft, Menu, X, LogOut, Mail, Phone, MapPin, User, Briefcase, Calendar } from "lucide-react"
import { Link } from "@/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslations } from 'next-intl'
import { WorklogAccessModal } from "@/components/WorklogAccessModal"

export default function HiredJobsPage() {
  const t = useTranslations('Dashboard.employer')
  const tHired = useTranslations('Dashboard.employer.hiredJobsPage')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [hiredJobs, setHiredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const [jobs, subData] = await Promise.all([
        apiClient.getHiredJobsForEmployer(),
        apiClient.getCurrentSubscription()
      ])
      setHiredJobs(jobs as any[]);
      setSubscription(subData);
    } catch (err: any) {
      setError(err.message || tHired('errorFetch'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "employer")) {
      router.push("/auth/login")
      return
    }

    if (!authLoading && user && user.role === "employer") {
      fetchData()
    }
  }, [user, authLoading, router])

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  const filteredJobs = hiredJobs.filter(job => {
    const matchesJobTitle = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWorkerName = job.workers.some((workerObj: any) =>
      workerObj.workerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesJobTitle || matchesWorkerName;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/employer" className="flex items-center gap-2 text-foreground hover:text-primary transition w-fit">
            <Button variant="ghost" size="icon" className="sm:hidden rounded-full">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">{tHired('backToDashboard')}</span>
            </Button>
            <Button variant="ghost" className="hidden sm:flex items-center gap-2 rounded-full"> {/* Simplified className */}
              <ArrowLeft className="w-4 h-4" />
              {tHired('backToDashboard')}
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate max-w-[200px] sm:max-w-none">{tHired('title')}</h1> {/* Page Title */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" className="rounded-full"> {/* Simplified className */}
                  Profile
                </Button>
              </Link>
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="rounded-full" // Simplified className
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
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 sm:hidden"
          onClick={() => setIsMobileNavOpen(false)} // Close when clicking outside
        >
          <div
            className={`fixed right-0 top-0 h-full w-3/4 bg-background shadow-lg p-4 transform transition-transform duration-300 ease-in-out backdrop-blur-md ${isMobileNavOpen ? "translate-x-0" : "translate-x-full"
              }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start rounded-md px-2"> {/* Simplified className */}
                  Profile
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start flex items-center gap-2 rounded-md px-2 text-destructive hover:text-destructive" // Simplified className
              >
                <LogOut className="w-4 h-4" />
                {tCommon('buttons.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex gap-2 items-center w-full mb-8">
          <Input
            placeholder="Search by Job or Worker..." // Enhanced placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-full flex-grow h-11"
          />
          <Button size="icon" className="rounded-full shrink-0 h-11 w-11">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <Card key={job._id} className="bg-card/80 border-border/50 backdrop-blur-lg overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        {job.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> {job.location?.address || tHired('notSpecified')}
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit text-sm py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                      {job.workers.length} Hired
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {job.workers.map((workerObj: any) => {
                      const worker = workerObj.workerId; // Access the populated worker object
                      return (
                        <Card key={worker._id} className="relative group bg-background border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                          <CardContent className="p-3 flex flex-col items-center text-center h-full">
                            <Avatar className="w-12 h-12 mb-2 border-2 border-primary/10 shadow-sm">
                              <AvatarImage src={worker.profilePicture} alt={worker.name} />
                              <AvatarFallback className="text-base font-bold bg-primary/5 text-primary">
                                {worker.name?.charAt(0) || "W"}
                              </AvatarFallback>
                            </Avatar>

                            <h4 className="text-sm font-bold text-foreground mb-0.5 line-clamp-1">{worker.name}</h4>
                            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">{worker.workerType || worker.skills?.[0] || "Worker"}</p>

                            <div className="w-full space-y-1 mb-2 text-[10px] text-muted-foreground text-left">
                              <div className="flex items-center gap-1.5 p-1 rounded-md bg-muted/30">
                                <Mail className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{worker.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1 rounded-md bg-muted/30">
                                <Phone className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{worker.mobile}</span>
                              </div>
                            </div>

                            <div className="mt-auto w-full space-y-1.5">
                              <Badge className={`w-full justify-center py-0.5 text-[10px] ${workerObj.status === 'completed'
                                ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20'
                                : 'bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-500/20'
                                } border shadow-none`}>
                                {workerObj.status?.replace(/-/g, ' ').toUpperCase()}
                              </Badge>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-[10px] rounded-md font-semibold hover:bg-primary hover:text-primary-foreground group-hover:border-primary/50 transition-colors"
                                onClick={() => {
                                  const targetUrl = `/dashboard/employer/hired-jobs/${job._id}?workerId=${worker._id}`

                                  const hasAccess = subscription && (
                                    subscription.planType === 'premium' ||
                                    (subscription.worklogAccessExpiry && new Date(subscription.worklogAccessExpiry) > new Date())
                                  );

                                  if (hasAccess) {
                                    router.push(targetUrl)
                                  } else {
                                    setPendingRedirectUrl(targetUrl)
                                    setShowAccessModal(true)
                                  }
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card/50 rounded-3xl border border-border/50 border-dashed">
              <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground">{tHired('noHired')}</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms.</p>
              <Button variant="link" onClick={() => setSearchTerm("")} className="mt-4 text-primary">Clear search</Button>
            </div>
          )}
        </div>
      </div>


      <WorklogAccessModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSuccess={() => {
          // Refresh subscription to confirm access (though we optimistically redirect)
          // Actually better to just redirect since backend will now allow it
          // But let's verify fetching again in background if needed
          if (pendingRedirectUrl) {
            router.push(pendingRedirectUrl)
          }
        }}
      />
    </div >
  )
}



