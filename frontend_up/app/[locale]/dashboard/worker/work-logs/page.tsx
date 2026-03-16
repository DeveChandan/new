"use client"

import { useState, useEffect, useMemo } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { ArrowLeft, Loader2, Search, Briefcase, Building2, CalendarDays, Clock, CheckCircle, XCircle, Camera, LogOut, Menu, User, X } from "lucide-react"
import { useTranslations } from 'next-intl'
import { NotificationBell } from "@/components/NotificationBell"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/theme-toggle"

interface WorkLog {
  _id: string;
  workDate: string;
  job: {
    _id: string;
    title: string;
    employer: {
      name?: string;
      companyName?: string;
    };
  };
  startTime?: string;
  endTime?: string;
  status: string;
  startPhoto?: string;
  endPhoto?: string;
  startPhotoLocation?: { latitude: number; longitude: number };
  endPhotoLocation?: { latitude: number; longitude: number };
  startPhotoAddress?: string;
  endPhotoAddress?: string;
}

export default function WorkerWorkLogsPage() {
  const t = useTranslations('Dashboard.worker')
  const tLogs = useTranslations('Dashboard.worker.workLogs')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "worker")) {
      router.push("/auth/login")
      return
    }

    const fetchWorkLogs = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        setLoading(true)
        const data = (await apiClient.getWorkLogsForWorker()) as any
        setWorkLogs(data)
      } catch (err: any) {
        setError(err.message || "Failed to fetch work logs.")
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user && user.role === "worker") {
      fetchWorkLogs()
    }
  }, [user, authLoading, router])

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  const filteredAndGroupedLogs = useMemo(() => {
    let filtered = workLogs.filter(log => {
      const searchLower = searchTerm.toLowerCase();
      const jobTitle = log.job?.title?.toLowerCase() || "";
      const employerName = log.job?.employer?.name?.toLowerCase() || "";
      const companyName = log.job?.employer?.companyName?.toLowerCase() || "";
      const status = log.status?.toLowerCase() || "";

      return jobTitle.includes(searchLower) ||
        employerName.includes(searchLower) ||
        companyName.includes(searchLower) ||
        status.includes(searchLower);
    });

    // Date filtering
    if (startDate) {
      const startFilterDate = new Date(startDate);
      startFilterDate.setHours(0, 0, 0, 0); // Set to start of the day
      filtered = filtered.filter(log => {
        if (!log.startTime) return false;
        const logDate = new Date(log.startTime);
        return logDate >= startFilterDate;
      });
    }

    if (endDate) {
      const endFilterDate = new Date(endDate);
      endFilterDate.setHours(23, 59, 59, 999); // Set to end of the day
      filtered = filtered.filter(log => {
        if (!log.startTime) return false;
        const logDate = new Date(log.startTime);
        return logDate <= endFilterDate;
      });
    }

    const grouped: { [key: string]: WorkLog[] } = {};
    filtered.forEach(log => {
      if (log.workDate) {
        const date = new Date(log.workDate).toLocaleDateString('en-CA'); // YYYY-MM-DD
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(log);
      }
    });

    // Sort dates in descending order
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const sortedGrouped: { [key: string]: WorkLog[] } = {};
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date].sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    });

    return sortedGrouped;
  }, [workLogs, searchTerm, startDate, endDate]);

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return "N/A";
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const durationMs = end - start;

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 && parts.length < 2) parts.push(`${seconds % 60}s`); // Only show seconds if duration is short

    return parts.length > 0 ? parts.join(' ') : '0s';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== "worker") {
    return null // Should be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/worker" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                {tLogs('backToDashboard')}
              </span>
              <span className="text-lg font-black text-foreground leading-none">
                Activity Logs
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" className="text-foreground hover:bg-accent font-bold rounded-xl px-6">
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 border-border/50 bg-background text-foreground rounded-xl font-bold px-6 h-11 hover:bg-accent transition-all"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('buttons.logout')}
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <NotificationBell />
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl sm:hidden border-border/50"
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
            <Link href="/profile" onClick={() => setIsMobileNavOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto font-bold">
                <User className="w-5 h-5 mr-3" />
                {tCommon('navigation.profile')}
              </Button>
            </Link>
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-sm font-bold text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
            {tLogs('title')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto sm:mx-0 font-medium leading-relaxed">
            Review your past work activities, durations, and verification photos.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm font-bold text-destructive animate-shake">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
          <div className="md:col-span-6 relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-full h-full" />
            </div>
            <Input
              type="text"
              placeholder={tLogs('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-6 rounded-[1.25rem] bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-14 px-6 rounded-[1.25rem] bg-card/50 border-border/50 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-14 px-6 rounded-[1.25rem] bg-card/50 border-border/50 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all"
            />
          </div>
        </div>

        {Object.keys(filteredAndGroupedLogs).length > 0 ? (
          <div className="space-y-12">
            {Object.keys(filteredAndGroupedLogs).map(date => (
              <div key={date} className="relative">
                <div className="sticky top-[86px] z-30 py-4 mb-6 -mx-4 px-4 bg-background/80 backdrop-blur-xl border-b border-border/50 rounded-b-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">
                      {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                  </div>
                </div>
                <div className="space-y-6">
                  {filteredAndGroupedLogs[date].map(log => (
                    <Card key={log._id} className="p-0 border-border/50 bg-card/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-primary/5 overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="text-xl font-bold text-foreground leading-none group-hover:text-primary transition-colors">
                              {log.job?.title || tLogs('unknownJob')}
                            </h3>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${log.status === "completed" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                              log.status === "in-progress" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              }`}>
                              {log.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-sm truncate">
                                {log.job?.employer?.companyName || log.job?.employer?.name || tLogs('unknownEmployer')}
                              </span>
                            </div>
                            {log.startTime && (
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-sm truncate">
                                  {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {log.endTime ? ` - ${new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : " (Active)"}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3 pt-2">
                            {log.startTime && log.endTime && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 text-green-600 rounded-xl border border-green-500/10 text-xs font-bold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Duration: {formatDuration(log.startTime, log.endTime)}
                              </div>
                            )}
                            <Link href={`/dashboard/worker/assigned-jobs/${log.job._id}`}>
                              <Button variant="ghost" className="h-8 px-4 rounded-xl text-primary font-bold hover:bg-primary/10 text-xs uppercase tracking-wider transition-colors">
                                {tCommon('buttons.viewDetails')}
                                <ArrowLeft className="w-3 h-3 ml-2 rotate-180" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {(log.startPhoto || log.endPhoto) && (
                          <div className="flex sm:flex-col gap-3 shrink-0">
                            {log.startPhoto && (
                              <a href={log.startPhoto} target="_blank" rel="noopener noreferrer" className="group/photo relative block w-full sm:w-24 h-24 rounded-2xl overflow-hidden border-2 border-background shadow-lg rotate-2 hover:rotate-0 transition-all">
                                <img
                                  src={log.startPhoto}
                                  alt="Start"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute top-1 left-1 bg-white/90 text-[8px] font-black px-1.5 py-0.5 rounded text-black uppercase tracking-tighter">Start</div>
                              </a>
                            )}
                            {log.endPhoto && (
                              <a href={log.endPhoto} target="_blank" rel="noopener noreferrer" className="group/photo relative block w-full sm:w-24 h-24 rounded-2xl overflow-hidden border-2 border-background shadow-lg -rotate-2 hover:rotate-0 transition-all">
                                <img src={log.endPhoto} alt="End" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute top-1 left-1 bg-white/90 text-[8px] font-black px-1.5 py-0.5 rounded text-black uppercase tracking-tighter">End</div>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center bg-card/30 rounded-[2.5rem] border-2 border-dashed border-border/50">
            <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-border/50 text-muted-foreground/30 shadow-inner">
              <Briefcase className="w-12 h-12" />
            </div>
            <p className="text-xl font-black text-foreground mb-2">
              {searchTerm ? "No Logs Found" : "No Logs Yet"}
            </p>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto">
              {searchTerm ? "Try adjusting your filters or search keywords." : "When you start working on jobs, your activity logs will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}