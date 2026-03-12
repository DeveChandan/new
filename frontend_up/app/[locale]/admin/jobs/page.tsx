"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import {
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Building,
  Calendar,
  Briefcase,
  Download,
  Clock,
  User
} from "lucide-react"
import moment from "moment"
import { useTranslations } from 'next-intl'

export default function AdminJobsPage() {
  const t = useTranslations('Admin.jobs')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter and Pagination States
  const [searchTitle, setSearchTitle] = useState("") // Live input value
  const [debouncedSearch, setDebouncedSearch] = useState("") // Debounced: triggers fetch
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedWorkType, setSelectedWorkType] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const pageSize = 10

  // Debounce: apply search 500ms after user stops typing (matches payments page behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTitle)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTitle])

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const data = await apiClient.getAllJobs({
        title: debouncedSearch || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        workType: selectedWorkType !== "all" ? selectedWorkType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        pageSize: pageSize,
      });
      setJobs(data.jobs);
      setTotalPages(data.pages);
      setTotalJobs(data.totalJobs);
    } catch (err: any) {
      setError(err.message || t('errors.fetchFailed'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [debouncedSearch, selectedStatus, selectedWorkType, startDate, endDate, currentPage]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login");
      return;
    }
    if (!authLoading) {
      fetchJobs();
    }
  }, [user, authLoading, router, fetchJobs]);

  const handleApproveJob = async (jobId: string) => {
    if (window.confirm(t('confirmApprove'))) {
      setActionLoading(jobId)
      try {
        await apiClient.approveJob(jobId)
        fetchJobs()
      } catch (err: any) {
        setError(err.message || t('errors.approveFailed'))
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleRemoveJob = async (jobId: string) => {
    if (window.confirm(t('confirmDelete'))) {
      setActionLoading(jobId)
      try {
        await apiClient.deleteJob(jobId)
        fetchJobs()
      } catch (err: any) {
        setError(err.message || t('errors.deleteFailed'))
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    setSearchTitle("")
    setDebouncedSearch("")
    setSelectedStatus("all")
    setSelectedWorkType("all")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (!isApproved) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          {t('pendingApproval')}
        </Badge>
      )
    }

    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      "open": { variant: "default", className: "bg-green-500/10 text-green-600 border-green-200" },
      "in-progress": { variant: "default", className: "bg-blue-500/10 text-blue-600 border-blue-200" },
      "completed": { variant: "secondary", className: "bg-gray-500/10 text-gray-600 border-gray-200" },
      "cancelled": { variant: "destructive", className: "bg-red-500/10 text-red-600 border-red-200" },
    }

    const config = statusConfig[status] || { variant: "outline", className: "" }

    return (
      <Badge variant={config.variant} className={config.className}>
        {t(status)}
      </Badge>
    )
  }

  const getWorkTypeBadge = (workType: string) => {
    const typeConfig: Record<string, { className: string }> = {
      "temporary": { className: "bg-purple-500/10 text-purple-600 border-purple-200" },
      "permanent": { className: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
    }

    const config = typeConfig[workType] || { className: "" }

    return (
      <Badge variant="outline" className={config.className}>
        {t(workType)}
      </Badge>
    )
  }

  if (authLoading || (loading && isInitialLoad)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden rounded-full"
          >
            <Filter className="h-4 w-4 mr-1" />
            {tCommon('filters')}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Download className="h-4 w-4 mr-1" />
            {tCommon('export')}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 md:p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <Card className={`bg-card border-border ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Search className="h-4 w-4 md:h-5 md:w-5" />
              {t('search')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              {t('clearAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-3 w-3 md:h-4 md:w-4" />
              {t('jobTitle')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                {t('status')}
              </label>
              <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="open">{t('open')}</SelectItem>
                  <SelectItem value="in-progress">{t('inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Work Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-3 w-3 md:h-4 md:w-4" />
                {t('workType')}
              </label>
              <Select value={selectedWorkType} onValueChange={(val) => { setSelectedWorkType(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes')}</SelectItem>
                  <SelectItem value="temporary">{t('temporary')}</SelectItem>
                  <SelectItem value="permanent">{t('permanent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                {tCommon("labels.from")}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="h-9"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                {tCommon("labels.to")}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="h-9"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1"
              size="sm"
            >
              {tCommon('buttons.reset')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(false)}
              className="sm:hidden flex-1"
              size="sm"
            >
              {t('close')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">
              {t('list')}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {t('totalJobs', { count: totalJobs })}
              </span>
            </CardTitle>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                {t('pageOf', { current: currentPage, total: totalPages })}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0">
          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3 p-3">
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No jobs found matching your criteria.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job._id} className="overflow-hidden">
                  <div className="p-3 space-y-3">
                    {/* Job Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            {getStatusBadge(job.status, job.isApproved)}
                            {!job.isApproved && (
                              <Badge variant="outline" className="ml-1">
                                {t('needsApproval')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getWorkTypeBadge(job.workType)}
                        </div>
                      </div>

                      {/* Employer Info */}
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{job.employer?.name || tCommon('na')}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {job.employer?.email || ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">Work Type</span>
                        <p className="font-medium capitalize">{job.workType}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">Created</span>
                        <p className="font-medium">{moment(job.createdAt).format("MMM D, YYYY")}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Link href={`/admin/jobs/${job._id}`}>
                        <Button variant="outline" size="sm" className="h-8 rounded-full gap-1">
                          <Eye className="h-3 w-3" />
                          {t('view')}
                        </Button>
                      </Link>
                      {!job.isApproved && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveJob(job._id)}
                          disabled={actionLoading === job._id}
                          className="h-8 rounded-full gap-1"
                        >
                          {actionLoading === job._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {t('approve')}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveJob(job._id)}
                        disabled={actionLoading === job._id}
                        className="h-8 rounded-full gap-1"
                      >
                        {actionLoading === job._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No jobs found matching your criteria.</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">{t('jobTitle')}</TableHead>
                      <TableHead className="w-[180px]">{t('employer')}</TableHead>
                      <TableHead className="w-[120px]">{t('status')}</TableHead>
                      <TableHead className="w-[100px]">{t('workType')}</TableHead>
                      <TableHead className="w-[120px]">{t('createdOn')}</TableHead>
                      <TableHead className="w-[180px] text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[180px]">{job.title}</p>
                              {!job.isApproved && (
                                <p className="text-xs text-yellow-600">{t('needsApproval')}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate max-w-[150px]">{job.employer?.name || tCommon('na')}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {job.employer?.email || ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status, job.isApproved)}
                        </TableCell>
                        <TableCell>
                          {getWorkTypeBadge(job.workType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {moment(job.createdAt).format("MMM D, YYYY")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/admin/jobs/${job._id}`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {!job.isApproved && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveJob(job._id)}
                                disabled={actionLoading === job._id}
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                {actionLoading === job._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveJob(job._id)}
                              disabled={actionLoading === job._id}
                              className="h-8 w-8 p-0 rounded-full"
                            >
                              {actionLoading === job._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {tCommon('showing', {
                    from: (currentPage - 1) * pageSize + 1,
                    to: Math.min(currentPage * pageSize, totalJobs),
                    total: totalJobs
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 3 && currentPage < totalPages - 1 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}