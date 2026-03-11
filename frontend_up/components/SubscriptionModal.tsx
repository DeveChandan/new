"use client"
// Force HMR update

import { useState, useEffect } from "react"
import { useRouter } from "@/navigation"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Sparkles, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

interface SubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
}

interface SubscriptionPlan {
    id: string
    name: string
    price: string
    duration: string
    jobs: string
    features: string[]
    excludedFeatures?: string[]
    tag?: string
    color: string
    border: string
    text: string
    hover: string
}

const plans: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: '30 Days Plan',
        price: '₹2350',
        duration: '30 Days',
        jobs: '1 Job Post',
        features: ['100 Database Unlocks', 'Unlimited Calls', '3-5 times can change post job location', 'Valid for 30 days'],
        excludedFeatures: ['View Worker Worklogs'],
        color: 'bg-blue-50/50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        hover: 'hover:border-blue-400'
    },
    {
        id: 'pro',
        name: '90 Days Plan',
        tag: 'Most Popular',
        price: '₹4999',
        duration: '90 Days',
        jobs: '1 Job Post',
        features: ['300 Database Unlocks', 'Unlimited Calls', '3-5 times can change post job location', 'Valid for 90 days'],
        excludedFeatures: ['View Worker Worklogs'],
        color: 'bg-purple-50/50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        hover: 'hover:border-purple-400'
    },
    {
        id: 'premium',
        name: '365 Days Plan',
        tag: 'Best Value',
        price: '₹11000',
        duration: '365 Days',
        jobs: '1 Job Post',
        features: ['800 Database Unlocks', 'View Worker Worklogs', 'Unlimited Calls', '3-5 times can change post job location', 'Valid for 365 days'],
        color: 'bg-amber-50/50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        hover: 'hover:border-amber-400'
    },
]

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    const router = useRouter()
    const t = useTranslations('Subscriptions')
    const [selectedPlan, setSelectedPlan] = useState<string>('pro')
    const [subscribing, setSubscribing] = useState(false)

    const handleSubscribe = async () => {
        setSubscribing(true)
        try {
            await apiClient.createSubscription(selectedPlan as "basic" | "premium" | "pro")
            onClose()
            router.push('/subscriptions')
        } catch (error) {
            console.error('Subscription error:', error)
            router.push('/subscriptions')
        } finally {
            setSubscribing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl">{t('subscriptionRequired')}</DialogTitle>
                    <p className="text-center text-sm text-muted-foreground pt-2">
                        {t('subscriptionRequiredMessage')}
                    </p>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 transform ${selectedPlan === plan.id
                                    ? `${plan.border} ${plan.color} shadow-xl scale-[1.02] ring-2 ring-primary ring-offset-2`
                                    : `border-border bg-white ${plan.hover} hover:shadow-lg`
                                    }`}
                            >
                                {plan.tag && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[inherit]">
                                        {plan.tag}
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-3 mt-2">
                                    <div className="pr-6">
                                        <h3 className={`font-black text-base ${plan.text}`}>{plan.name}</h3>
                                        <div className="flex items-baseline gap-x-1 mt-1">
                                            <p className="text-2xl font-black text-foreground">{plan.price}</p>
                                            <span className="text-xs font-medium text-muted-foreground">/ {plan.duration}</span>
                                        </div>
                                    </div>
                                    {selectedPlan === plan.id ? (
                                        <div className="bg-primary text-white p-1.5 rounded-full shadow-md shrink-0">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className={`w-7 h-7 rounded-full border-2 ${plan.border} flex items-center justify-center shrink-0`}></div>
                                    )}
                                </div>
                                <div className="space-y-2 pt-2 border-t border-black/5">
                                    <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                                        <BriefcaseIcon className="w-4 h-4 text-primary" />
                                        {plan.jobs}
                                    </div>
                                    {plan.features.map((f, i) => (
                                        <div key={`feat-${i}`} className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                    {plan.excludedFeatures?.map((f, i) => (
                                        <div key={`ex-feat-${i}`} className="flex items-start gap-2 text-xs text-muted-foreground/70">
                                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={subscribing}
                        >
                            {t('maybeLater')}
                        </Button>
                        <Button
                            onClick={handleSubscribe}
                            className="flex-1 bg-primary hover:bg-primary/90"
                            disabled={subscribing}
                        >
                            {subscribing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('subscribing')}
                                </>
                            ) : (
                                t('viewPlans')
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function BriefcaseIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}
