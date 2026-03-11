"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import {
  Loader2,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  Download,
  Activity,
  Building,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import UserRegistrationsChart from "@/components/charts/UserRegistrationsChart"
import JobsByCategoryChart from "@/components/charts/JobsByCategoryChart"
import { useTranslations } from 'next-intl'

// Helper function to format relative time
const getRelativeTime = (timestamp: string | Date) => {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export default function AdminDashboardPage() {
  const t = useTranslations('Admin.dashboard')
  const tCommon = useTranslations('Common')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeRange, setTimeRange] = useState<string>("7d") // 7d, 30d, 90d

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [dashboard, analytics] = await Promise.all([
          apiClient.getAdminDashboard(),
          apiClient.getAnalytics(timeRange),
        ])
        setDashboardData(dashboard)
        setAnalyticsData(analytics)
      } catch (err: any) {
        setError(err.message || "Failed to fetch data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm bg-transparent border border-border rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7d">{t('timeRange.7d')}</option>
            <option value="30d">{t('timeRange.30d')}</option>
            <option value="90d">{t('timeRange.90d')}</option>
          </select>
          <Button variant="outline" size="sm" className="rounded-full">
            <Download className="h-4 w-4 mr-1" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Users Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.totalUsers')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {dashboardData?.totalUsers || 0}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-500" />
                    {dashboardData?.totalWorkers || 0} {t('stats.totalWorkers')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3 text-green-500" />
                    {dashboardData?.totalEmployers || 0} {t('stats.totalEmployers')}
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Jobs Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.totalJobs')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {dashboardData?.totalJobs || 0}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {dashboardData?.openJobs || 0} {t('stats.open')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    {dashboardData?.closedJobs || 0} {t('stats.closed')}
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-purple-500/10">
                <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.totalRevenue')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  ₹{dashboardData?.totalRevenue?.toLocaleString() || "0"}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {dashboardData?.revenueGrowthPercent !== undefined
                    ? t('stats.growth', { value: dashboardData.revenueGrowthPercent.toFixed(1) })
                    : t('stats.growth', { value: '0' })}
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Growth Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.userGrowth')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {dashboardData?.userGrowthPercent !== undefined
                    ? `${dashboardData.userGrowthPercent > 0 ? '+' : ''}${dashboardData.userGrowthPercent}%`
                    : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('stats.sinceLastMonth')}
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-orange-500/10">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Pending Approvals Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.pendingApprovals')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {dashboardData?.pendingApprovals || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('stats.pendingApprovalsSub')}
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.documents')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {dashboardData?.totalDocuments || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('stats.pendingDocs', { count: dashboardData?.pendingDocuments || 0 })}
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-indigo-500/10">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Worklogs Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.activeWorklogs')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {dashboardData?.activeWorklogs || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('stats.activeWorklogsSub')}
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-pink-500/10">
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verified Users Card */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('stats.verifiedUsers')}</p>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {dashboardData?.verifiedUsers || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('stats.verifiedPercent', { percent: Math.round(((dashboardData?.verifiedUsers || 0) / (dashboardData?.totalUsers || 1)) * 100) })}
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-teal-500/10">
                <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* User Registrations Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="px-4 pt-4 md:px-6 md:pt-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t('charts.registrations')}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {t('charts.daysData', { count: analyticsData?.userRegistrations?.length || 0 })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6 pt-0">
            <div className="h-[250px] md:h-[300px]">
              {analyticsData?.userRegistrations && (
                <UserRegistrationsChart data={analyticsData.userRegistrations} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Jobs by Category Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="px-4 pt-4 md:px-6 md:pt-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                {t('charts.categories')}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {t('charts.categoriesSub', { count: analyticsData?.jobPostings?.length || 0 })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6 pt-0">
            <div className="h-[250px] md:h-[300px]">
              {analyticsData?.jobPostings && (
                <JobsByCategoryChart data={analyticsData.jobPostings} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="bg-card border-border">
        <CardHeader className="px-4 pt-4 md:px-6 md:pt-6 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg md:text-xl font-semibold text-foreground">
              {t('recentActivity.title')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              {t('recentActivity.viewAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          <div className="space-y-3">
            {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity: any, index: number) => {
                // Determine icon and colors based on activity type
                let icon = <Activity className="h-4 w-4" />
                let bgColor = 'bg-gray-500/10'
                let iconColor = 'text-gray-500'
                let title = ''
                let description = ''

                switch (activity.type) {
                  case 'user_registration':
                    icon = <Users className="h-4 w-4 text-blue-500" />
                    bgColor = 'bg-blue-500/10'
                    iconColor = 'text-blue-500'
                    title = t('recentActivity.newRegistration')
                    description = t('recentActivity.workerRegistered', {
                      name: activity.user?.name || 'Unknown',
                      role: activity.user?.role || 'user'
                    })
                    break
                  case 'job_posted':
                    icon = <Briefcase className="h-4 w-4 text-green-500" />
                    bgColor = 'bg-green-500/10'
                    iconColor = 'text-green-500'
                    title = t('recentActivity.jobPosted')
                    description = t('recentActivity.jobPostedSub', {
                      employer: activity.job?.employer || 'Unknown',
                      title: activity.job?.title || 'Unknown Job'
                    })
                    break
                  case 'job_completed':
                    icon = <CheckCircle className="h-4 w-4 text-teal-500" />
                    bgColor = 'bg-teal-500/10'
                    iconColor = 'text-teal-500'
                    title = t('recentActivity.jobCompleted')
                    description = t('recentActivity.jobCompletedSub', {
                      title: activity.job?.title || 'Unknown Job'
                    })
                    break
                  case 'payment_received':
                    icon = <DollarSign className="h-4 w-4 text-purple-500" />
                    bgColor = 'bg-purple-500/10'
                    iconColor = 'text-purple-500'
                    title = t('recentActivity.paymentReceived')
                    description = t('recentActivity.paymentReceivedSub', {
                      amount: activity.payment?.amount?.toLocaleString() || '0',
                      plan: activity.payment?.plan || 'Subscription',
                      employer: activity.payment?.employer || 'Unknown'
                    })
                    break
                  case 'document_uploaded':
                    icon = <FileText className="h-4 w-4 text-indigo-500" />
                    bgColor = 'bg-indigo-500/10'
                    iconColor = 'text-indigo-500'
                    title = t('recentActivity.documentUploaded')
                    description = t('recentActivity.documentUploadedSub', {
                      user: activity.document?.user || 'Unknown',
                      docType: activity.document?.type || 'document'
                    })
                    break
                  case 'dispute_created':
                    icon = <Activity className="h-4 w-4 text-red-500" />
                    bgColor = 'bg-red-500/10'
                    iconColor = 'text-red-500'
                    title = t('recentActivity.disputeCreated')
                    description = t('recentActivity.disputeCreatedSub', {
                      job: activity.dispute?.job || 'Unknown Job'
                    })
                    break
                }

                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={`p-2 rounded-full ${bgColor}`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getRelativeTime(activity.timestamp)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">{t('recentActivity.noActivity')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}