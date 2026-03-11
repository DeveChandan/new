"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { Loader2, Gavel, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from 'next-intl'

export default function AdminDisputesPage() {
  const t = useTranslations('Admin.disputes')
  const tCommon = useTranslations('Common')
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState("")
  const [showResolutionInput, setShowResolutionInput] = useState<string | null>(null)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDisputes, setTotalDisputes] = useState(0)
  const pageSize = 10

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAllDisputes({ page: currentPage, pageSize })
      // Assuming data is an array or object with disputes
      if (Array.isArray(data)) {
        setDisputes(data)
        setTotalPages(1)
        setTotalDisputes(data.length)
      } else {
        setDisputes(data.disputes || [])
        setTotalPages(data.pages || 1)
        setTotalDisputes(data.total || 0)
      }
    } catch (err: any) {
      setError(err.message || t('errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, t])

  useEffect(() => {
    fetchDisputes()
  }, [fetchDisputes])

  const handleResolveDispute = async (disputeId: string) => {
    setResolvingDisputeId(disputeId)
    setError("")
    try {
      if (!resolutionText.trim()) {
        throw new Error(t('errors.provideResolution'))
      }
      await apiClient.resolveDispute(disputeId, resolutionText)
      fetchDisputes() // Refetch disputes
      setShowResolutionInput(null)
      setResolutionText("")
    } catch (err: any) {
      setError(err.message || t('errors.resolveFailed'))
    } finally {
      setResolvingDisputeId(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-foreground">{t('title')}</h1>
      <p className="text-muted-foreground">{t('subtitle')}</p>

      <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>{t('list')}</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <p className="text-muted-foreground">{t('noDisputes')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50">
                  <thead>
                    <tr className="text-left text-sm font-medium text-muted-foreground">
                      <th scope="col" className="px-6 py-3">
                        {t('job')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('reportedBy')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('reportedUser')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('reason')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('status')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {disputes.map((dispute) => (
                      <tr key={dispute._id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-foreground">
                          {dispute.job?.title || tCommon('na')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {dispute.reportedBy?.name || tCommon('na')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {dispute.reportedUser?.name || tCommon('na')}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                          {dispute.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dispute.status === "resolved"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                              }`}
                          >
                            {t(dispute.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          {dispute.status !== "resolved" && (
                            <>
                              {showResolutionInput === dispute._id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder={t('resolutionPlaceholder')}
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    className="bg-input/50 border-border text-foreground rounded-lg"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      onClick={() => handleResolveDispute(dispute._id)}
                                      disabled={resolvingDisputeId === dispute._id || !resolutionText.trim()}
                                      size="sm"
                                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                                    >
                                      {resolvingDisputeId === dispute._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        t('confirmResolve')
                                      )}
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setShowResolutionInput(null)
                                        setResolutionText("")
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full"
                                    >
                                      {t('cancel')}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => setShowResolutionInput(dispute._id)}
                                  disabled={resolvingDisputeId === dispute._id}
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                                >
                                  <Gavel className="w-4 h-4 mr-2" /> {t('resolve')}
                                </Button>
                              )}
                            </>
                          )}
                          {dispute.status === "resolved" && dispute.resolution && (
                            <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                              {t('resolvedMsg', { resolution: dispute.resolution })}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {t('pageOf', { current: currentPage, total: totalPages })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t('prev')}
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      {t('next')}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
