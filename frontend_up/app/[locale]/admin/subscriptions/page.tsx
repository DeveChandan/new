"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "@/navigation";
import { Eye, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

export default function AdminSubscriptionsPage() {
  const t = useTranslations('Admin.subscriptions')
  const tCommon = useTranslations('Common')
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getAllSubscriptions({ page, pageSize: 10 })
        setSubscriptions(data.subscriptions)
        setTotalPages(data.pages)
      } catch (err: any) {
        setError(err.message || "Failed to load subscriptions.")
      } finally {
        setLoading(false)
      }
    }
    fetchSubscriptions()
  }, [page])

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await apiClient.deleteSubscription(id)
        setSubscriptions(subscriptions.filter((sub) => sub._id !== id))
        toast.success(tCommon('messages.success'), {
          description: t('deleteSuccess'),
        })
      } catch (err: any) {
        setError(err.message || t('errors.deleteFailed'))
        toast.error(tCommon('messages.error'), {
          description: t('errors.deleteFailed'),
        })
      }
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]">{tCommon('messages.loading')}</div>
  if (error) return <div className="flex items-center justify-center min-h-[60vh] text-destructive">{tCommon('messages.error')}: {error}</div>

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">{t('employer')}</TableHead>
              <TableHead className="font-semibold">{t('plan')}</TableHead>
              <TableHead className="font-semibold">{t('status')}</TableHead>
              <TableHead className="font-semibold">{t('endDate')}</TableHead>
              <TableHead className="font-semibold text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {tCommon('messages.noData')}
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub._id}>
                  <TableCell className="font-medium">{sub.employer.companyName || sub.employer.name}</TableCell>
                  <TableCell>
                    <Badge variant={sub.plan === 'premium' ? 'default' : 'secondary'} className="capitalize">
                      {sub.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.status === 'active' ? 'success' : 'destructive'} className="capitalize">
                      {tCommon(`status.${sub.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => router.push(`/admin/subscriptions/${sub._id}/edit`)}
                        title={tCommon('buttons.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(sub._id)}
                        title={tCommon('buttons.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          {t('prev')}
        </Button>
        <span className="text-sm font-medium">
          {t('pageOf', { current: page, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          {t('next')}
        </Button>
      </div>
    </div>
  )
}