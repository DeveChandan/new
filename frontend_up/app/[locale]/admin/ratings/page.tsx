"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { Loader2, Trash2, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'

export default function AdminRatingsPage() {
  const t = useTranslations('Admin.ratings')
  const tCommon = useTranslations('Common')
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingRatingId, setDeletingRatingId] = useState<string | null>(null)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRatings, setTotalRatings] = useState(0)
  const pageSize = 10

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAllRatings({ page: currentPage, pageSize })
      setRatings(data.ratings || [])
      setTotalPages(data.pages || 1)
      setTotalRatings(data.total || 0)
    } catch (err: any) {
      setError(err.message || t('errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, t])

  useEffect(() => {
    fetchRatings()
  }, [fetchRatings])

  const handleDeleteRating = async (ratingId: string) => {
    setDeletingRatingId(ratingId)
    setError("")
    try {
      await apiClient.deleteRating(ratingId)
      fetchRatings() // Refetch ratings after deletion
    } catch (err: any) {
      setError(err.message || t('errors.deleteFailed'))
    } finally {
      setDeletingRatingId(null)
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
          {ratings.length === 0 ? (
            <p className="text-muted-foreground">{t('noRatings')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50">
                  <thead>
                    <tr className="text-left text-sm font-medium text-muted-foreground">
                      <th scope="col" className="px-6 py-3">
                        {t('jobTitle')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('ratedUser')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('ratedBy')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('rating')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {t('review')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {ratings.map((rating) => (
                      <tr key={rating._id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-foreground">
                          {rating.job?.title || tCommon('na')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {rating.user?.name || tCommon('na')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {rating.ratedBy?.name || tCommon('na')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < rating.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                  }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                          {rating.review}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          <Button
                            onClick={() => handleDeleteRating(rating._id)}
                            disabled={deletingRatingId === rating._id}
                            size="icon"
                            variant="destructive"
                            className="rounded-full"
                          >
                            {deletingRatingId === rating._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
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
