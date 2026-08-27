"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import {
  Loader2,
  Activity,
  Users,
  Smartphone,
  Monitor,
  Search,
  RefreshCw,
  Download,
  Key,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Eye,
  Sliders,
  Save,
  RotateCcw,
  ShieldAlert,
  Zap,
  Lock,
  Briefcase,
  UploadCloud,
  MessageSquare,
  Globe,
  Plus,
  Trash,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from "lucide-react"
import moment from "moment"

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedPlatform, setSelectedPlatform] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const pageSize = 20

  // Modal State for inspecting metadata
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  // Rate Limit Settings State
  const [rateLimits, setRateLimits] = useState({
    otpMax: 4,
    authMax: 10,
    jobMax: 20,
    uploadMax: 25,
    messageMax: 100,
    apiMax: 300,
  })
  const [defaultLimits, setDefaultLimits] = useState<any>(null)
  const [limitsLoading, setLimitsLoading] = useState(true)
  const [savingLimits, setSavingLimits] = useState(false)
  const [resettingLimits, setResettingLimits] = useState(false)

  // App Version & Play Store Update Settings State
  const [versionSettings, setVersionSettings] = useState<any>({
    android: {
      latestVersion: '1.0.1',
      latestVersionCode: 4,
      minRequiredVersion: '1.0.0',
      minRequiredVersionCode: 3,
      forceUpdate: false,
      storeUrl: 'https://play.google.com/store/apps/details?id=com.shramikseva.app',
      marketUrl: 'market://details?id=com.shramikseva.app',
      title: 'New Update Available 🎉',
      message: 'A newer, faster version of Shramik Seva is available on the Google Play Store.',
      releaseNotes: [
        'Dynamic rate limit & security controls',
        'Instant subscription payment reconciliation',
        'Performance improvements and smoother navigation',
        'Stability and bug fixes'
      ]
    },
    ios: {
      latestVersion: '1.0.1',
      latestVersionCode: 4,
      minRequiredVersion: '1.0.0',
      minRequiredVersionCode: 3,
      forceUpdate: false,
      storeUrl: 'https://apps.apple.com/app/shramik-seva/id000000000',
      marketUrl: 'itms-apps://itunes.apple.com/app/id000000000',
      title: 'New Update Available 🎉',
      message: 'A newer version of Shramik Seva is available on the App Store.',
      releaseNotes: ['Performance improvements', 'Bug fixes and enhancements']
    }
  })
  const [versionLoading, setVersionLoading] = useState(true)
  const [savingVersion, setSavingVersion] = useState(false)
  const [newReleaseNote, setNewReleaseNote] = useState("")

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const data = await apiClient.getActivityLogs({
        page: currentPage,
        pageSize,
        role: selectedRole !== "all" ? selectedRole : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        platform: selectedPlatform !== "all" ? selectedPlatform : undefined,
        search: debouncedSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setLogs(data.logs || [])
      setTotalPages(data.pages || 1)
      setTotalLogs(data.total || 0)
    } catch (err: any) {
      setError(err.message || "Failed to load activity logs.")
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedRole, selectedCategory, selectedPlatform, debouncedSearch, startDate, endDate])

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const data = await apiClient.getActivityAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      console.error("Failed to load analytics summary:", err)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const fetchRateLimits = useCallback(async () => {
    try {
      setLimitsLoading(true)
      const data = await apiClient.getRateLimitSettings()
      if (data?.limits) {
        setRateLimits({
          otpMax: data.limits.otpMax ?? 4,
          authMax: data.limits.authMax ?? 10,
          jobMax: data.limits.jobMax ?? 20,
          uploadMax: data.limits.uploadMax ?? 25,
          messageMax: data.limits.messageMax ?? 100,
          apiMax: data.limits.apiMax ?? 300,
        })
      }
      if (data?.defaults) {
        setDefaultLimits(data.defaults)
      }
    } catch (err: any) {
      console.error("Failed to load rate limit settings:", err)
    } finally {
      setLimitsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const fetchVersionSettings = useCallback(async () => {
    try {
      setVersionLoading(true)
      const res = await apiClient.getAppVersionSettings()
      if (res.success && res.config) {
        setVersionSettings(res.config)
      }
    } catch (err: any) {
      console.error("Failed to fetch app version settings:", err)
    } finally {
      setVersionLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    fetchRateLimits()
    fetchVersionSettings()
  }, [fetchAnalytics, fetchRateLimits, fetchVersionSettings])

  const handleRefresh = () => {
    fetchLogs()
    fetchAnalytics()
    fetchRateLimits()
    fetchVersionSettings()
  }

  const handleSaveRateLimits = async () => {
    try {
      setSavingLimits(true)
      const res = await apiClient.updateRateLimitSettings(rateLimits)
      toast.success(res?.message || "Rate limits updated in real-time!")
      fetchRateLimits()
    } catch (err: any) {
      toast.error(err.message || "Failed to update rate limits.")
    } finally {
      setSavingLimits(false)
    }
  }

  const handleResetRateLimits = async () => {
    try {
      setResettingLimits(true)
      const res = await apiClient.resetRateLimitSettings()
      toast.success(res?.message || "Rate limits restored to factory defaults.")
      fetchRateLimits()
    } catch (err: any) {
      toast.error(err.message || "Failed to reset rate limits.")
    } finally {
      setResettingLimits(false)
    }
  }

  const handleSaveVersionSettings = async () => {
    try {
      setSavingVersion(true)
      const res = await apiClient.updateAppVersionSettings(versionSettings)
      if (res.success) {
        toast.success(res.message || "Mobile App & Play Store settings updated!")
        fetchVersionSettings()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update app version settings.")
    } finally {
      setSavingVersion(false)
    }
  }

  const handleAddReleaseNote = () => {
    if (!newReleaseNote.trim()) return
    const currentNotes = versionSettings?.android?.releaseNotes || []
    setVersionSettings({
      ...versionSettings,
      android: {
        ...versionSettings.android,
        releaseNotes: [...currentNotes, newReleaseNote.trim()]
      }
    })
    setNewReleaseNote("")
  }

  const handleRemoveReleaseNote = (index: number) => {
    const currentNotes = versionSettings?.android?.releaseNotes || []
    setVersionSettings({
      ...versionSettings,
      android: {
        ...versionSettings.android,
        releaseNotes: currentNotes.filter((_: any, i: number) => i !== index)
      }
    })
  }

  const exportCSV = () => {
    if (logs.length === 0) return
    const headers = ["Timestamp", "User", "Role", "Action", "Category", "Platform", "IP", "Description"]
    const rows = logs.map(log => [
      moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      log.userName || log.user?.name || "Guest",
      log.role,
      log.action,
      log.category,
      log.platform,
      log.ip || "N/A",
      `"${(log.description || "").replace(/"/g, '""')}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `shramik_activity_logs_${moment().format("YYYYMMDD_HHmm")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadge = (action: string) => {
    if (action.includes("LOGIN")) return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Login</Badge>
    if (action.includes("REGISTER")) return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Register</Badge>
    if (action.includes("LOGOUT")) return <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30">Logout</Badge>
    if (action.includes("JOB")) return <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">Job</Badge>
    if (action.includes("WORKER") || action.includes("PROFILE")) return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Profile</Badge>
    if (action.includes("WORK") || action.includes("WORKLOG")) return <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">Attendance</Badge>
    if (action.includes("SUBSCRIPTION") || action.includes("PAYMENT")) return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">Revenue</Badge>
    if (action.includes("RATE_LIMIT")) return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">Security Config</Badge>
    return <Badge variant="outline">{action}</Badge>
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "employer":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Employer</Badge>
      case "worker":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Worker</Badge>
      case "admin":
        return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Admin</Badge>
      default:
        return <Badge variant="secondary">Guest</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">User Activity & Logins</h1>
            <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/30 text-primary">
              Live Audit Trail
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time tracking of visitor logins, actions, and engagement analytics across web and mobile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || analyticsLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${(loading || analyticsLoading) ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={exportCSV} disabled={logs.length === 0} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Active Users (DAU)</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics?.metrics?.dau ?? (analyticsLoading ? "..." : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">Last 24 hours</span> active unique users
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Active Users (MAU)</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics?.metrics?.mau ?? (analyticsLoading ? "..." : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              WAU: <span className="font-semibold text-foreground">{analytics?.metrics?.wau ?? 0}</span> (last 7 days)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Distribution</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mobile: {analytics?.platformBreakdown?.find((p: any) => p.platform === "mobile")?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Monitor className="w-3.5 h-3.5 text-cyan-500" />
                <span>Web: {analytics?.platformBreakdown?.find((p: any) => p.platform === "web")?.count || 0}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden flex">
              {(() => {
                const mob = analytics?.platformBreakdown?.find((p: any) => p.platform === "mobile")?.count || 0;
                const web = analytics?.platformBreakdown?.find((p: any) => p.platform === "web")?.count || 0;
                const total = (mob + web) || 1;
                const mobPct = Math.round((mob / total) * 100);
                return (
                  <>
                    <div className="bg-indigo-500 h-full" style={{ width: `${mobPct}%` }} title={`Mobile ${mobPct}%`} />
                    <div className="bg-cyan-500 h-full" style={{ width: `${100 - mobPct}%` }} title={`Web ${100 - mobPct}%`} />
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Logged Events (24h)</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics?.metrics?.totalEvents24h ?? (analyticsLoading ? "..." : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              7-Day Volume: <span className="font-semibold text-foreground">{analytics?.metrics?.totalEvents7d ?? 0}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="stream" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="stream" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity Log Stream
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics & Insights
          </TabsTrigger>
          <TabsTrigger value="limits" className="gap-2">
            <Sliders className="w-4 h-4 text-rose-500" />
            Rate Limit Configuration
          </TabsTrigger>
          <TabsTrigger value="app-version" className="gap-2">
            <Smartphone className="w-4 h-4 text-emerald-500" />
            Mobile App & Play Store Updates
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Activity Log Stream */}
        <TabsContent value="stream" className="space-y-4">
          {/* Filter Bar */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search user, mobile, IP, action..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background/50"
                  />
                </div>

                {/* Role */}
                <Select value={selectedRole} onValueChange={(val) => { setSelectedRole(val); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category */}
                <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="auth">Auth & Logins</SelectItem>
                    <SelectItem value="job">Jobs</SelectItem>
                    <SelectItem value="application">Applications</SelectItem>
                    <SelectItem value="worklog">Worklogs & OTP</SelectItem>
                    <SelectItem value="profile">Profile Unlocks</SelectItem>
                    <SelectItem value="payment">Subscriptions & Billing</SelectItem>
                    <SelectItem value="system">Security & System</SelectItem>
                  </SelectContent>
                </Select>

                {/* Platform */}
                <Select value={selectedPlatform} onValueChange={(val) => { setSelectedPlatform(val); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="web">Web Portal</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                    className="bg-background/50 text-xs px-2"
                    title="Start Date"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                    className="bg-background/50 text-xs px-2"
                    title="End Date"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Loading activity logs...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">{error}</div>
              ) : logs.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-base font-medium">No activity records found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[180px]">User & Role</TableHead>
                        <TableHead className="w-[130px]">Action</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px]">Platform</TableHead>
                        <TableHead className="w-[140px]">IP Address</TableHead>
                        <TableHead className="w-[160px]">Time</TableHead>
                        <TableHead className="w-[70px] text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log._id} className="hover:bg-muted/30 transition-colors">
                          {/* User */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                                {log.userName || log.user?.name || "Guest Visitor"}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {getRoleBadge(log.role)}
                                {log.userMobile && (
                                  <span className="text-[11px] text-muted-foreground">{log.userMobile}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Action */}
                          <TableCell>
                            {getActionBadge(log.action)}
                          </TableCell>

                          {/* Description */}
                          <TableCell>
                            <div className="text-sm text-foreground/90 max-w-md truncate" title={log.description}>
                              {log.description}
                            </div>
                            <span className="text-[11px] text-muted-foreground capitalize">
                              Category: {log.category}
                            </span>
                          </TableCell>

                          {/* Platform */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {log.platform === "mobile" ? (
                                <>
                                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Mobile App</span>
                                </>
                              ) : (
                                <>
                                  <Monitor className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Web Portal</span>
                                </>
                              )}
                            </div>
                          </TableCell>

                          {/* IP */}
                          <TableCell>
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {log.ip || "Direct/Internal"}
                            </code>
                          </TableCell>

                          {/* Time */}
                          <TableCell>
                            <div className="text-xs text-foreground">
                              {moment(log.createdAt).format("MMM DD, YYYY")}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {moment(log.createdAt).fromNow()} ({moment(log.createdAt).format("hh:mm A")})
                            </div>
                          </TableCell>

                          {/* Inspect */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedLog(log)}
                              title="View Event Details"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  Showing page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                  <span className="font-semibold text-foreground">{totalPages}</span> ({totalLogs} total events)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="h-8 px-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Analytics & Insights */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 10 Actions */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Top Actions (Last 30 Days)
                </CardTitle>
                <CardDescription>Most frequent user and employer activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics?.topActions?.length ? (
                  analytics.topActions.map((item: any) => {
                    const maxCount = analytics.topActions[0]?.count || 1;
                    const pct = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={item.action} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-foreground">{item.action}</span>
                          <span className="text-muted-foreground">{item.count} events</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">No action data recorded yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Activity by Category
                </CardTitle>
                <CardDescription>Distribution of events across platform modules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics?.topCategories?.length ? (
                  analytics.topCategories.map((item: any) => {
                    const totalCat = analytics.topCategories.reduce((acc: number, cur: any) => acc + cur.count, 0) || 1;
                    const pct = Math.round((item.count / totalCat) * 100);
                    return (
                      <div key={item.category} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs">
                        <div className="capitalize font-medium text-foreground">{item.category}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[11px]">{item.count}</Badge>
                          <span className="text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">No category data recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 14-Day Timeline */}
          {analytics?.dailyTimeline && analytics.dailyTimeline.length > 0 && (
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  14-Day Activity Trend
                </CardTitle>
                <CardDescription>Daily volume of logged platform events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-36 pt-4 pb-2 px-2 overflow-x-auto">
                  {analytics.dailyTimeline.map((day: any) => {
                    const maxDaily = Math.max(...analytics.dailyTimeline.map((d: any) => d.count), 1);
                    const barHeight = Math.max(8, Math.round((day.count / maxDaily) * 100));
                    return (
                      <div key={day.date} className="flex-1 min-w-[36px] flex flex-col items-center gap-1 group">
                        <span className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.count}
                        </span>
                        <div className="w-full bg-muted rounded-t relative flex items-end h-24 overflow-hidden">
                          <div
                            className="w-full bg-primary/80 group-hover:bg-primary transition-all rounded-t"
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {moment(day.date).format("DD/MM")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Milestones */}
          {analytics?.recentMilestones && analytics.recentMilestones.length > 0 && (
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-500" />
                  Recent High-Value Milestones
                </CardTitle>
                <CardDescription>Key registrations, jobs, and subscription updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {analytics.recentMilestones.map((m: any) => (
                    <div key={m._id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/40 text-xs">
                      <div className="flex items-center gap-2.5">
                        {getActionBadge(m.action)}
                        <span className="text-foreground font-medium">{m.description}</span>
                      </div>
                      <span className="text-muted-foreground text-[11px] whitespace-nowrap">
                        {moment(m.createdAt).fromNow()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Rate Limit Settings */}
        <TabsContent value="limits" className="space-y-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-rose-500" />
                  Dynamic Rate Limit Controls
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Fine-tune API thresholds in real time without restarting your server. Changes persist to database and reload instantaneously in active memory.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetRateLimits}
                  disabled={limitsLoading || resettingLimits || savingLimits}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resettingLimits ? "animate-spin" : ""}`} />
                  Reset to Defaults
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveRateLimits}
                  disabled={limitsLoading || savingLimits || resettingLimits}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className={`w-3.5 h-3.5 ${savingLimits ? "animate-spin" : ""}`} />
                  Save Changes
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              {limitsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Loading active rate limits...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. OTP Requests */}
                  <Card className="border-border/50 bg-background/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        OTP Requests
                      </div>
                      <Badge variant="outline" className="text-[10px]">10 min window</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max OTP requests allowed per mobile number before 10-minute lockout. Protects Fast2SMS wallet.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Allowed Requests:</span>
                        <span className="font-bold text-foreground">{rateLimits.otpMax}</span>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={rateLimits.otpMax}
                        onChange={(e) => setRateLimits({ ...rateLimits, otpMax: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="h-9"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Default: {defaultLimits?.otpMax ?? 4} req / 10 min
                      </span>
                    </div>
                  </Card>

                  {/* 2. Failed Logins & Auth */}
                  <Card className="border-border/50 bg-background/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <div className="p-1.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        Failed Logins (Auth)
                      </div>
                      <Badge variant="outline" className="text-[10px]">15 min window</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max failed password or OTP login attempts before temporary 15-minute lock. Prevents brute-force.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Failed Attempts:</span>
                        <span className="font-bold text-foreground">{rateLimits.authMax}</span>
                      </div>
                      <Input
                        type="number"
                        min={2}
                        max={100}
                        value={rateLimits.authMax}
                        onChange={(e) => setRateLimits({ ...rateLimits, authMax: Math.max(2, parseInt(e.target.value) || 2) })}
                        className="h-9"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Default: {defaultLimits?.authMax ?? 10} attempts (successful logins exempt)
                      </span>
                    </div>
                  </Card>

                  {/* 3. Job Creation */}
                  <Card className="border-border/50 bg-background/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <div className="p-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        Job Postings
                      </div>
                      <Badge variant="outline" className="text-[10px]">1 hour window</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max new job vacancies an employer can post per hour. Prevents spam posting.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Jobs per Hour:</span>
                        <span className="font-bold text-foreground">{rateLimits.jobMax}</span>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        value={rateLimits.jobMax}
                        onChange={(e) => setRateLimits({ ...rateLimits, jobMax: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="h-9"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Default: {defaultLimits?.jobMax ?? 20} jobs / hr
                      </span>
                    </div>
                  </Card>

                  {/* 4. File Uploads */}
                  <Card className="border-border/50 bg-background/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <div className="p-1.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                        File Uploads
                      </div>
                      <Badge variant="outline" className="text-[10px]">1 hour window</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max file & photo uploads allowed per user per hour. Conserves VPS disk space.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Uploads per Hour:</span>
                        <span className="font-bold text-foreground">{rateLimits.uploadMax}</span>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        value={rateLimits.uploadMax}
                        onChange={(e) => setRateLimits({ ...rateLimits, uploadMax: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="h-9"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Default: {defaultLimits?.uploadMax ?? 25} uploads / hr
                      </span>
                    </div>
                  </Card>

                  {/* 5. Chat Messaging */}
                  <Card className="border-border/50 bg-background/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        Chat & Messaging
                      </div>
                      <Badge variant="outline" className="text-[10px]">15 min window</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max chat messages allowed per user across active conversations in a 15-minute period.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Messages per 15 min:</span>
                        <span className="font-bold text-foreground">{rateLimits.messageMax}</span>
                      </div>
                      <Input
                        type="number"
                        min={10}
                        max={1000}
                        value={rateLimits.messageMax}
                        onChange={(e) => setRateLimits({ ...rateLimits, messageMax: Math.max(10, parseInt(e.target.value) || 10) })}
                        className="h-9"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Default: {defaultLimits?.messageMax ?? 100} msgs / 15 min
                      </span>
                    </div>
                  </Card>

                  {/* 6. Global API Protection */}
                  <Card className="border-border/50 bg-background/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <div className="p-1.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <Globe className="w-4 h-4" />
                        </div>
                        Global API Protection
                      </div>
                      <Badge variant="outline" className="text-[10px]">15 min window</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Umbrella cap on all API requests per IP address to safeguard against scraping and DDoS.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Requests per 15 min:</span>
                        <span className="font-bold text-foreground">{rateLimits.apiMax}</span>
                      </div>
                      <Input
                        type="number"
                        min={50}
                        max={10000}
                        value={rateLimits.apiMax}
                        onChange={(e) => setRateLimits({ ...rateLimits, apiMax: Math.max(50, parseInt(e.target.value) || 50) })}
                        className="h-9"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Default: {defaultLimits?.apiMax ?? 300} req / 15 min
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Mobile App & Play Store Updates */}
        <TabsContent value="app-version" className="space-y-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                  Google Play Store & Mobile Version Control
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Manage the active Play Store version, update prompts, release notes, and mandatory force update locks for the Android/iOS apps.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleSaveVersionSettings}
                disabled={savingVersion || versionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
              >
                {savingVersion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Publish Version Settings
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {versionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Version & Store Parameters (2 cols) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* 1. Android Play Store Version Card */}
                    <Card className="border-border/50 bg-background/50 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          Android App Version Parameters
                        </div>
                        <Badge variant={versionSettings?.android?.forceUpdate ? "destructive" : "secondary"}>
                          {versionSettings?.android?.forceUpdate ? "Mandatory Update Active" : "Flexible Update"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Latest Play Store Version</label>
                          <Input
                            placeholder="e.g. 1.0.1"
                            value={versionSettings?.android?.latestVersion || ""}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, latestVersion: e.target.value }
                            })}
                          />
                          <span className="text-[10px] text-muted-foreground">Version string shown in Play Store</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Latest Version Code (Build)</label>
                          <Input
                            type="number"
                            placeholder="e.g. 4"
                            value={versionSettings?.android?.latestVersionCode || 0}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, latestVersionCode: parseInt(e.target.value) || 0 }
                            })}
                          />
                          <span className="text-[10px] text-muted-foreground">Android versionCode integer from build.gradle</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Minimum Required Version</label>
                          <Input
                            placeholder="e.g. 1.0.0"
                            value={versionSettings?.android?.minRequiredVersion || ""}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, minRequiredVersion: e.target.value }
                            })}
                          />
                          <span className="text-[10px] text-muted-foreground">Older versions will be forced to update</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Minimum Version Code</label>
                          <Input
                            type="number"
                            placeholder="e.g. 3"
                            value={versionSettings?.android?.minRequiredVersionCode || 0}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, minRequiredVersionCode: parseInt(e.target.value) || 0 }
                            })}
                          />
                          <span className="text-[10px] text-muted-foreground">Build codes below this trigger force update</span>
                        </div>
                      </div>

                      {/* Force Update Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            Force Update (All Users)
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            If enabled, users on any older version cannot dismiss the dialog until they update.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!versionSettings?.android?.forceUpdate}
                          onChange={(e) => setVersionSettings({
                            ...versionSettings,
                            android: { ...versionSettings.android, forceUpdate: e.target.checked }
                          })}
                          className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                        />
                      </div>

                      {/* Store URLs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Google Play Store URL</label>
                          <Input
                            value={versionSettings?.android?.storeUrl || ""}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, storeUrl: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Native Market Protocol URL</label>
                          <Input
                            value={versionSettings?.android?.marketUrl || ""}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, marketUrl: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* 2. In-App Dialog Content & What's New */}
                    <Card className="border-border/50 bg-background/50 p-5 space-y-4">
                      <div className="flex items-center gap-2 font-semibold text-sm border-b border-border/40 pb-3">
                        <div className="p-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        In-App Update Prompt Customization
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Dialog Title</label>
                          <Input
                            value={versionSettings?.android?.title || ""}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, title: e.target.value }
                            })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground">Dialog Message / Description</label>
                          <Input
                            value={versionSettings?.android?.message || ""}
                            onChange={(e) => setVersionSettings({
                              ...versionSettings,
                              android: { ...versionSettings.android, message: e.target.value }
                            })}
                          />
                        </div>

                        {/* Release Notes List */}
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-medium text-foreground">What's New (Release Notes Bullet Points)</label>
                          <div className="space-y-2">
                            {(versionSettings?.android?.releaseNotes || []).map((note: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 bg-muted/40 p-2 rounded-md text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="flex-1 text-foreground">{note}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveReleaseNote(idx)}
                                  className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}

                            <div className="flex gap-2 pt-1">
                              <Input
                                placeholder="Add a new release note bullet point..."
                                value={newReleaseNote}
                                onChange={(e) => setNewReleaseNote(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddReleaseNote()}
                                className="h-8 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleAddReleaseNote}
                                className="h-8 gap-1 text-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: Live Mobile Dialog Simulator (1 col) */}
                  <div className="space-y-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Live Mobile App Preview
                    </div>

                    {/* Phone Frame Simulator */}
                    <div className="rounded-3xl border-2 border-border bg-card p-4 shadow-xl space-y-4 max-w-sm mx-auto">
                      {/* Modal Banner Preview */}
                      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white p-4 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center mx-auto shadow-md">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-sm">
                          {versionSettings?.android?.title || "New Update Available 🎉"}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[10px]">
                          <span className="bg-white/20 px-2 py-0.5 rounded-full font-medium">
                            Current: v1.0.0
                          </span>
                          <span>→</span>
                          <span className="bg-white text-blue-800 px-2 py-0.5 rounded-full font-bold">
                            Latest: v{versionSettings?.android?.latestVersion || "1.0.1"}
                          </span>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        {versionSettings?.android?.message || "A newer version of Shramik Seva is available."}
                      </p>

                      {/* Release Notes */}
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 space-y-2">
                        <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          What's New in This Version
                        </div>
                        <div className="space-y-1.5">
                          {(versionSettings?.android?.releaseNotes || []).slice(0, 4).map((note: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{note}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Buttons Preview */}
                      <div className="space-y-2 pt-2">
                        <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md">
                          <Smartphone className="w-3.5 h-3.5" />
                          Update on Google Play
                        </div>
                        {!versionSettings?.android?.forceUpdate && (
                          <div className="w-full py-1 text-center text-[11px] font-semibold text-muted-foreground">
                            Remind Me Later
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Inspector Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Event Details
              {selectedLog && getActionBadge(selectedLog.action)}
            </DialogTitle>
            <DialogDescription>
              Raw audit metadata and device telemetry for this event.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg">
                <div>
                  <span className="text-muted-foreground block">User:</span>
                  <span className="font-semibold text-foreground">{selectedLog.userName || selectedLog.user?.name || "Guest"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Role:</span>
                  <span className="font-semibold text-foreground capitalize">{selectedLog.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">IP Address:</span>
                  <span className="font-mono text-foreground">{selectedLog.ip || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Platform:</span>
                  <span className="font-semibold text-foreground capitalize">{selectedLog.platform}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block">Timestamp:</span>
                  <span className="font-mono text-foreground">{moment(selectedLog.createdAt).format("YYYY-MM-DD HH:mm:ss (Z)")}</span>
                </div>
                {selectedLog.userAgent && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">User Agent:</span>
                    <span className="font-mono text-[11px] text-muted-foreground break-all">{selectedLog.userAgent}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-medium text-foreground block mb-1.5">Event Metadata Payload:</span>
                <pre className="p-3 rounded-lg bg-muted/60 font-mono text-[11px] overflow-x-auto max-h-48 border border-border/40">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
