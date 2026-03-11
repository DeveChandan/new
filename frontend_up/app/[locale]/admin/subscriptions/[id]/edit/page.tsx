"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "@/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

export default function AdminEditSubscriptionPage() {
  const t = useTranslations('Admin.subscriptions')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [subscription, setSubscription] = useState<any>(null)
  const [plan, setPlan] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      const fetchSubscription = async () => {
        try {
          setLoading(true)
          const sub = await apiClient.getSubscriptionById(id as string) as any
          setSubscription(sub)
          setPlan(sub.plan)
          setEndDate(new Date(sub.endDate).toISOString().split("T")[0])
        } catch (err: any) {
          setError(err.message || t('errors.loadFailed'))
        } finally {
          setLoading(false)
        }
      }
      fetchSubscription()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.updateSubscription(id as string, { plan, endDate })
      toast.success(tCommon('messages.success'), {
        description: t('updateSuccess'),
      })
      router.push("/admin/subscriptions")
    } catch (err: any) {
      setError(err.message || t('errors.updateFailed'))
      toast.error(tCommon('messages.error'), {
        description: t('errors.updateFailed'),
      })
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]">{tCommon('messages.loading')}</div>
  if (error) return <div className="flex items-center justify-center min-h-[60vh] text-destructive">{tCommon('messages.error')}: {error}</div>
  if (!subscription) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">{tCommon('messages.noData')}</div>

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl font-bold">{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employer" className="text-sm font-semibold">{t('employer')}</Label>
                <Input
                  id="employer"
                  value={subscription.employer.companyName || subscription.employer.name}
                  disabled
                  className="bg-muted/50 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan" className="text-sm font-semibold">{t('plan')}</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectPlan')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">{t('basic')}</SelectItem>
                    <SelectItem value="premium">{t('premium')}</SelectItem>
                    <SelectItem value="pro">{t('pro')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-semibold">{t('endDate')}</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 shadow-md hover:shadow-lg transition-all">
                {tCommon('buttons.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/admin/subscriptions")}
              >
                {tCommon('buttons.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
