"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "@/navigation";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  User,
  Calendar,
  Download,
  Eye
} from "lucide-react"
import moment from "moment"
import { useTranslations } from 'next-intl'

export default function AdminDocumentsPage() {
  const t = useTranslations('Admin.documents')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState("")
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter and Pagination States
  const [searchDocumentName, setSearchDocumentName] = useState("") // Live input
  const [debouncedDocName, setDebouncedDocName] = useState("")      // Debounced: triggers fetch
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [searchUserName, setSearchUserName] = useState("") // Live input
  const [debouncedUserName, setDebouncedUserName] = useState("")   // Debounced: triggers fetch
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const pageSize = 10

  // Debounce: apply search 500ms after user stops typing (matches payments page behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDocName(searchDocumentName)
      setDebouncedUserName(searchUserName)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchDocumentName, searchUserName])

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const data = await apiClient.getAllDocuments({
        documentName: debouncedDocName || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        type: selectedType !== "all" ? selectedType : undefined,
        userName: debouncedUserName || undefined,
        page: currentPage,
        pageSize: pageSize,
      });
      setDocuments(data.documents || []);
      setTotalPages(data.pages || 1);
      setTotalDocuments(data.totalDocuments || 0);
    } catch (err: any) {
      setError(err.message || t('errors.fetchFailed'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [debouncedDocName, selectedStatus, selectedType, debouncedUserName, currentPage]);

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUpdateStatus = async (documentId: string, status: "approved" | "rejected" | "pending") => {
    setUpdatingDocId(documentId)
    setError("")
    try {
      await apiClient.updateDocumentStatus(documentId, status)
      setDocuments((prevDocs) =>
        prevDocs.map((doc) => (doc._id === documentId ? { ...doc, status: status } : doc))
      )
    } catch (err: any) {
      setError(err.message || t('errors.updateFailed'))
    } finally {
      setUpdatingDocId(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const applySearch = () => {
    setDebouncedDocName(searchDocumentName)
    setDebouncedUserName(searchUserName)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchDocumentName("")
    setDebouncedDocName("")
    setSearchUserName("")
    setDebouncedUserName("")
    setSelectedStatus("all")
    setSelectedType("all")
    setCurrentPage(1)
  }

  if (loading && isInitialLoad) {
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
          {/* Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                {t('docName')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('searchPlaceholderDoc')}
                  value={searchDocumentName}
                  onChange={(e) => setSearchDocumentName(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <User className="h-3 w-3 md:h-4 md:w-4" />
                {t('userName')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('searchPlaceholderUser')}
                  value={searchUserName}
                  onChange={(e) => setSearchUserName(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                {t('status')}
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="approved">{t('approved')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                {t('type')}
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes')}</SelectItem>
                  <SelectItem value="biodata">Biodata</SelectItem>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                  <SelectItem value="adhaar_card">Adhaar Card</SelectItem>
                  <SelectItem value="voter_id">Voter ID</SelectItem>
                  <SelectItem value="skill_certificate">Skill Certificate</SelectItem>
                  <SelectItem value="experience_certificate">Experience Certificate</SelectItem>
                  <SelectItem value="business_registration">Business Registration</SelectItem>
                  <SelectItem value="gst_certificate">GST Certificate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Documents Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">
              {t('list')}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {t('totalDocs', { count: totalDocuments })}
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
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('noDocs')}</p>
              </div>
            ) : (
              documents.map((doc) => (
                <Card key={doc._id} className="overflow-hidden">
                  <div className="p-3 space-y-3">
                    {/* Document Header */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{doc.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize mt-1">
                          {doc.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${doc.status === "approved"
                          ? "bg-green-500/20 text-green-600"
                          : doc.status === "rejected"
                            ? "bg-red-500/20 text-red-600"
                            : "bg-yellow-500/20 text-yellow-600"
                          }`}
                      >
                        {doc.status === "approved" ? "✓" : doc.status === "rejected" ? "✗" : "⏳"}
                        {t(doc.status)}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{doc.user?.name || tCommon('na')}</p>
                          <p className="text-xs text-muted-foreground truncate">{doc.user?.email || tCommon('na')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{moment(doc.createdAt).format("MMM D, YYYY")}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 rounded-full gap-1"
                          asChild
                        >
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3" />
                            {t('view')}
                          </a>
                        </Button>
                      </div>

                      {/* Status Update */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={doc.status === "pending" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateStatus(doc._id, "pending")}
                          disabled={updatingDocId === doc._id}
                          className="h-8 text-xs rounded-full"
                        >
                          {updatingDocId === doc._id && doc.status === "pending" ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          {t('pending')}
                        </Button>
                        <Button
                          variant={doc.status === "approved" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateStatus(doc._id, "approved")}
                          disabled={updatingDocId === doc._id}
                          className="h-8 text-xs rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600"
                        >
                          {updatingDocId === doc._id && doc.status === "approved" ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          {t('approve')}
                        </Button>
                        <Button
                          variant={doc.status === "rejected" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateStatus(doc._id, "rejected")}
                          disabled={updatingDocId === doc._id}
                          className="h-8 text-xs rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600"
                        >
                          {updatingDocId === doc._id && doc.status === "rejected" ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          {t('reject')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('noDocs')}</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 text-xs md:text-sm font-medium text-muted-foreground w-[200px]">
                          {t('docName')}
                        </th>
                        <th className="text-left p-3 text-xs md:text-sm font-medium text-muted-foreground w-[120px]">
                          {t('type')}
                        </th>
                        <th className="text-left p-3 text-xs md:text-sm font-medium text-muted-foreground w-[200px]">
                          {t('userName')}
                        </th>
                        <th className="text-left p-3 text-xs md:text-sm font-medium text-muted-foreground w-[100px]">
                          {t('status')}
                        </th>
                        <th className="text-left p-3 text-xs md:text-sm font-medium text-muted-foreground w-[120px]">
                          {t('uploadedOn')}
                        </th>
                        <th className="text-right p-3 text-xs md:text-sm font-medium text-muted-foreground w-[180px]">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {documents.map((doc) => (
                        <tr key={doc._id} className="hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{doc.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm capitalize">
                            {doc.type.replace(/_/g, ' ')}
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <p className="text-sm truncate max-w-[180px]">{doc.user?.name || tCommon('na')}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{doc.user?.email || tCommon('na')}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${doc.status === "approved"
                                ? "bg-green-500/20 text-green-600"
                                : doc.status === "rejected"
                                  ? "bg-red-500/20 text-red-600"
                                  : "bg-yellow-500/20 text-yellow-600"
                                }`}
                            >
                              {doc.status === "approved" ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : doc.status === "rejected" ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <Loader2 className="h-3 w-3" />
                              )}
                              {t(doc.status)}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {moment(doc.createdAt).format("MMM D, YYYY")}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                              <Select
                                onValueChange={(value: "approved" | "rejected" | "pending") =>
                                  handleUpdateStatus(doc._id, value)
                                }
                                value={doc.status}
                                disabled={updatingDocId === doc._id}
                              >
                                <SelectTrigger className="h-8 min-w-[120px] rounded-full text-xs">
                                  <SelectValue placeholder={t('updateStatus')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{t('pending')}</SelectItem>
                                  <SelectItem value="approved">{t('approved')}</SelectItem>
                                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                                </SelectContent>
                              </Select>
                              {updatingDocId === doc._id && (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                    to: Math.min(currentPage * pageSize, totalDocuments),
                    total: totalDocuments
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