"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "@/navigation";
import { Eye, Trash2, Pencil, Settings, Loader2, Sparkles, Zap, Crown, ShieldCheck, Calendar, IndianRupee, Save, Lock } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const getPlanMeta = (planKey: string) => {
  switch (planKey.toLowerCase()) {
    case 'free':
      return {
        icon: ShieldCheck,
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        badgeText: 'Free Trial',
        accentColor: 'border-l-4 border-l-emerald-500',
      }
    case 'basic':
      return {
        icon: Zap,
        iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        badgeText: 'Standard Tier',
        accentColor: 'border-l-4 border-l-blue-500',
      }
    case 'pro':
      return {
        icon: Sparkles,
        iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        badgeText: 'Professional',
        accentColor: 'border-l-4 border-l-purple-500',
      }
    case 'premium':
      return {
        icon: Crown,
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        badgeText: 'Popular / Enterprise',
        accentColor: 'border-l-4 border-l-amber-500',
      }
    default:
      return {
        icon: Sparkles,
        iconBg: 'bg-primary/10 text-primary border-primary/20',
        badgeText: planKey,
        accentColor: 'border-l-4 border-l-primary',
      }
  }
}

export default function AdminSubscriptionsPage() {
  const t = useTranslations('Admin.subscriptions')
  const tCommon = useTranslations('Common')
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  // Plans Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [plansList, setPlansList] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [submittingPlans, setSubmittingPlans] = useState(false)

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

  const handleOpenPlansModal = async () => {
    setIsModalOpen(true)
    setPlansLoading(true)
    try {
      const data = await apiClient.getSubscriptionPlans()
      setPlansList(data as any[])
    } catch (err: any) {
      toast.error("Failed to load plans")
    } finally {
      setPlansLoading(false)
    }
  }

  const handleUpdatePlanField = (planKey: string, field: 'price' | 'duration', value: any) => {
    setPlansList(prev => prev.map(p => p.planKey === planKey ? { ...p, [field]: value } : p))
  }

  const handleSavePlans = async () => {
    setSubmittingPlans(true)
    try {
      const plansObj: any = {}
      plansList.forEach(p => {
        const { planKey, ...rest } = p
        // coerce price and duration to numbers when saving
        const normalized: any = { ...rest }
        if (typeof normalized.price === 'string') normalized.price = Number(normalized.price.replace(/[^0-9.-]+/g, '')) || 0
        else normalized.price = Number(normalized.price) || 0
        normalized.duration = Number(normalized.duration) || 0
        plansObj[planKey] = normalized
      })
      await apiClient.updateSubscriptionPlans(plansObj)
      toast.success("Subscription plans updated successfully!")
      setIsModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to update plans")
    } finally {
      setSubmittingPlans(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]">{tCommon('messages.loading')}</div>
  if (error) return <div className="flex items-center justify-center min-h-[60vh] text-destructive">{tCommon('messages.error')}: {error}</div>

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={handleOpenPlansModal} variant="outline" className="rounded-full gap-2">
          <Settings className="w-4 h-4" />
          Manage Plan Pricing
        </Button>
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

      {/* Plan Management Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden border border-border/50 bg-card rounded-2xl shadow-2xl [&>button[data-slot=dialog-close]]:text-white/80 [&>button[data-slot=dialog-close]]:hover:text-white [&>button[data-slot=dialog-close]]:hover:bg-white/15 [&>button[data-slot=dialog-close]]:top-4 [&>button[data-slot=dialog-close]]:right-4 [&>button[data-slot=dialog-close]]:z-50 [&>button[data-slot=dialog-close]]:rounded-full [&>button[data-slot=dialog-close]]:p-1.5 transition-colors">
          <DialogHeader className="p-6 bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-white flex-shrink-0 relative overflow-hidden shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md text-white shadow-inner">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white">
                  Manage Subscription Plans
                </DialogTitle>
                <DialogDescription className="text-sm text-white/85 mt-0.5">
                  Update the prices and durations of the subscription plans shown to employers.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {plansLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-9 h-9 animate-spin text-primary" />
                <span className="text-sm font-medium">Loading plan configurations...</span>
              </div>
            ) : (
              plansList.map((plan) => {
                const meta = getPlanMeta(plan.planKey)
                const IconComponent = meta.icon
                const isFree = plan.planKey === 'free'

                return (
                  <div
                    key={plan.planKey}
                    className={cn(
                      "p-5 border rounded-2xl bg-card/70 hover:bg-card/90 transition-all duration-200 space-y-4 shadow-xs hover:shadow-md",
                      meta.accentColor
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl border flex items-center justify-center", meta.iconBg)}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground leading-snug">{plan.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">Key: {plan.planKey}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 capitalize rounded-full">
                        {meta.badgeText}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <Label htmlFor={`price-${plan.planKey}`} className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <IndianRupee className="w-3.5 h-3.5 text-primary" /> Price (INR)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm select-none">₹</span>
                          <Input
                            id={`price-${plan.planKey}`}
                            type="text"
                            value={plan.price}
                            disabled={isFree}
                            onChange={(e) => handleUpdatePlanField(plan.planKey, 'price', e.target.value)}
                            className={cn(
                              "pl-8 font-semibold text-sm rounded-xl border-border/80 focus-visible:ring-primary/20",
                              isFree && "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-80"
                            )}
                          />
                          {isFree && (
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          )}
                        </div>
                        {isFree && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                            <Lock className="w-3 h-3" /> Free plan price is permanently ₹0
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`duration-${plan.planKey}`} className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> Duration (Days)
                        </Label>
                        <div className="relative">
                          <Input
                            id={`duration-${plan.planKey}`}
                            type="text"
                            value={plan.duration}
                            onChange={(e) => handleUpdatePlanField(plan.planKey, 'duration', e.target.value)}
                            className="pr-14 font-semibold text-sm rounded-xl border-border/80 focus-visible:ring-primary/20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground select-none">
                            days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <DialogFooter className="p-4 px-6 border-t border-border/60 bg-muted/40 backdrop-blur-md flex items-center justify-end gap-3 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl px-5 border-border/80 hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePlans}
              disabled={plansLoading || submittingPlans}
              className="rounded-xl px-6 gap-2 font-semibold shadow-md shadow-primary/20"
            >
              {submittingPlans ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}