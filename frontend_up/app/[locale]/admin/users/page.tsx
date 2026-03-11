"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, CheckCircle, XCircle, Trash2, Eye, ChevronLeft, ChevronRight, Search, Filter, Calendar, User, Download } from "lucide-react"
import moment from "moment"
import { useTranslations } from 'next-intl'

export default function AdminUsersPage() {
  const t = useTranslations('Admin.users')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filter and Pagination States
  const [searchName, setSearchName] = useState("") // Live input value
  const [debouncedSearch, setDebouncedSearch] = useState("") // Debounced: triggers fetch
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [registrationStartDate, setRegistrationStartDate] = useState<string>("")
  const [registrationEndDate, setRegistrationEndDate] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const pageSize = 10

  // Debounce: apply search 500ms after user stops typing (matches payments page behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchName)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchName])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const data = await apiClient.getAllUsers({
        name: debouncedSearch || undefined,
        role: selectedRole !== "all" ? selectedRole : undefined,
        startDate: registrationStartDate || undefined,
        endDate: registrationEndDate || undefined,
        page: currentPage,
        pageSize: pageSize,
      });
      setUsers(data.users);
      setTotalPages(data.pages);
      setTotalUsers(data.totalUsers);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [debouncedSearch, selectedRole, registrationStartDate, registrationEndDate, currentPage]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login");
      return;
    }
    if (!authLoading) {
      fetchUsers();
    }
  }, [user, authLoading, router, fetchUsers]);

  const handleApproveUser = async (userId: string) => {
    if (window.confirm(t('confirmApprove'))) {
      setActionLoading(userId)
      try {
        await apiClient.approveUser(userId)
        fetchUsers()
      } catch (err: any) {
        setError(err.message || "Failed to approve user.")
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (window.confirm(t('confirmDelete'))) {
      setActionLoading(userId)
      try {
        await apiClient.deleteUser(userId)
        fetchUsers()
      } catch (err: any) {
        setError(err.message || "Failed to remove user.")
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

  const applySearch = () => {
    setDebouncedSearch(searchName)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchName("")
    setDebouncedSearch("")
    setSelectedRole("all")
    setRegistrationStartDate("")
    setRegistrationEndDate("")
    setCurrentPage(1)
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
            {tCommon('buttons.filter')}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Download className="h-4 w-4 mr-1" />
            {tCommon('buttons.upload')}
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Role Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <User className="h-3 w-3 md:h-4 md:w-4" />
                {t('role')}
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('allRoles')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allRoles')}</SelectItem>
                  <SelectItem value="worker">{t('worker')}</SelectItem>
                  <SelectItem value="employer">{t('employer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                {t('fromDate')}
              </label>
              <Input
                type="date"
                value={registrationStartDate}
                onChange={(e) => setRegistrationStartDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                {t('toDate')}
              </label>
              <Input
                type="date"
                value={registrationEndDate}
                onChange={(e) => setRegistrationEndDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium invisible">Actions</label>
              <div className="flex gap-2 h-9">
                <Button
                  onClick={applySearch}
                  className="flex-1"
                  size="sm"
                >
                  {t('apply')}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">{t('list')}</CardTitle>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t('totalUsers', { count: totalUsers })}</span>
              {totalPages > 1 && (
                <span> • {t('pageOf', { current: currentPage, total: totalPages })}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0">
          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3 p-3">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('noUsers')}</p>
              </div>
            ) : (
              users.map((u) => (
                <Card key={u._id} className="overflow-hidden">
                  <div className="p-3 space-y-3">
                    {/* User Header */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{u.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${u.isVerified
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-yellow-500/20 text-yellow-600'
                        }`}>
                        {u.isVerified ? '✓' : '⏳'}
                        {u.isVerified ? t('approved') : t('pending')}
                      </span>
                    </div>

                    {/* User Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{t('role')}</span>
                        <p className="font-medium capitalize">{t(u.role)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{t('registeredOn')}</span>
                        <p className="font-medium">{moment(u.createdAt).format("MMM D, YYYY")}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Link href={`/admin/users/${u._id}`}>
                        <Button variant="outline" size="sm" className="h-8 rounded-full gap-1">
                          <Eye className="h-3 w-3" />
                          {t('view')}
                        </Button>
                      </Link>
                      {!u.isVerified && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveUser(u._id)}
                          disabled={actionLoading === u._id}
                          className="h-8 rounded-full gap-1"
                        >
                          {actionLoading === u._id ? (
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
                        onClick={() => handleRemoveUser(u._id)}
                        disabled={actionLoading === u._id}
                        className="h-8 rounded-full gap-1"
                      >
                        {actionLoading === u._id ? (
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
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('noUsers')}</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">{t('name')}</TableHead>
                      <TableHead className="w-[200px]">{t('email')}</TableHead>
                      <TableHead className="w-[100px]">{t('role')}</TableHead>
                      <TableHead className="w-[140px]">{t('registeredOn')}</TableHead>
                      <TableHead className="w-[120px]">{t('status')}</TableHead>
                      <TableHead className="w-[180px] text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="truncate max-w-[120px]">{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="truncate max-w-[180px]">{u.email}</TableCell>
                        <TableCell className="capitalize">{t(u.role)}</TableCell>
                        <TableCell>{moment(u.createdAt).format("MMM D, YYYY")}</TableCell>
                        <TableCell>
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-600">
                              <CheckCircle className="h-3 w-3" /> {t('approved')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-600">
                              <XCircle className="h-3 w-3" /> {t('pending')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/admin/users/${u._id}`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {!u.isVerified && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveUser(u._id)}
                                disabled={actionLoading === u._id}
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                {actionLoading === u._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveUser(u._id)}
                              disabled={actionLoading === u._id}
                              className="h-8 w-8 p-0 rounded-full"
                            >
                              {actionLoading === u._id ? (
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
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
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