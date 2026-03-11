"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Clock, MessageSquare, Briefcase, XCircle, FileText } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/navigation"
import { Badge } from "@/components/ui/badge"

interface ApplicationStatusModalProps {
    isOpen: boolean
    onClose: () => void
    application: {
        _id: string // Job ID
        applicationId: string
        title: string
        employer: {
            _id: string
            name: string
            companyName?: string
        }
        status: string
        appliedDate: string
        // Add more fields if needed
    } | null
}

export function ApplicationStatusModal({ isOpen, onClose, application }: ApplicationStatusModalProps) {
    const t = useTranslations("Common") // Use Common translations
    const router = useRouter()

    if (!application) return null

    const isHireRequest = ['offered', 'offerAccepted', 'offerRejected'].includes(application.status)

    const steps = [
        {
            id: 'initiation',
            label: isHireRequest ? t('ApplicationStatus.offerReceived') : t('ApplicationStatus.applied'),
            date: new Date(application.appliedDate).toLocaleDateString(),
            icon: isHireRequest ? Briefcase : FileText,
            active: true,
            completed: true
        },
        {
            id: 'review',
            label: isHireRequest ? t('ApplicationStatus.youAccepted') : t('ApplicationStatus.inReview'),
            date: isHireRequest ? (application.status === 'offerAccepted' ? t('ApplicationStatus.offerAccepted') : t('ApplicationStatus.pendingAction')) : (application.status !== 'pending' ? t('ApplicationStatus.viewedByEmployer') : t('ApplicationStatus.pending')),
            icon: isHireRequest ? CheckCircle2 : Clock,
            active: isHireRequest ? application.status === 'offerAccepted' : application.status !== 'pending',
            completed: isHireRequest ? application.status === 'offerAccepted' : application.status !== 'pending'
        },
        {
            id: 'decision',
            label: application.status === 'hired' || application.status === 'offerAccepted' ? t('ApplicationStatus.hired') :
                application.status === 'offered' ? t('ApplicationStatus.responseNeeded') :
                    application.status === 'rejected' || application.status === 'offerRejected' ? t('ApplicationStatus.notSelected') : t('ApplicationStatus.decision'),
            date: application.status === 'pending' || application.status === 'offered' ? t('ApplicationStatus.inProgress') :
                (application.status === 'approved' ? t('ApplicationStatus.shortlisted') :
                    application.status === 'hired' || application.status === 'offerAccepted' ? t('ApplicationStatus.congratulations') : t('ApplicationStatus.closed')),
            icon: application.status === 'hired' || application.status === 'offerAccepted' ? CheckCircle2 :
                application.status === 'rejected' || application.status === 'offerRejected' ? XCircle :
                    application.status === 'offered' ? Briefcase : Circle,
            active: ['hired', 'rejected', 'offerAccepted', 'offerRejected'].includes(application.status),
            completed: ['hired', 'rejected', 'offerAccepted', 'offerRejected'].includes(application.status),
            color: application.status === 'hired' || application.status === 'offerAccepted' ? "text-green-500" :
                application.status === 'rejected' || application.status === 'offerRejected' ? "text-red-500" :
                    application.status === 'offered' ? "text-blue-500" : "text-muted-foreground"
        }
    ]

    const handleMessage = () => {
        router.push(`/messages?userId=${application.employer._id}`)
        onClose()
    }

    const handleViewJob = () => {
        if (application.status === 'offered') {
            router.push(`/dashboard/worker/hiring-requests`)
        } else {
            router.push(`/jobs/${application._id}`)
        }
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex flex-col gap-1">
                        <span>{application.title}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {application.employer.companyName || application.employer.name}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6">
                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-24px)] before:w-[2px] before:bg-border">
                        {steps.map((step, index) => (
                            <div key={step.id} className="relative">
                                <span className={`absolute -left-[32px] top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background ${step.active
                                    ? step.color || "border-primary text-primary"
                                    : "border-muted text-muted-foreground"
                                    }`}>
                                    <step.icon className="h-3 w-3" />
                                </span>
                                <div className="flex flex-col gap-1">
                                    <span className={`text-sm font-medium ${step.active ? "text-foreground" : "text-muted-foreground"}`}>
                                        {step.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {step.date}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button onClick={handleMessage} variant="outline" className="w-full justify-start gap-2 h-12 rounded-xl">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        {t('ApplicationStatus.chatWithEmployer')}
                    </Button>
                    <Button onClick={handleViewJob} className="w-full justify-start gap-2 h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border-0">
                        {application.status === 'offered' ? (
                            <>
                                <Briefcase className="w-4 h-4" />
                                {t('ApplicationStatus.viewJobOffer')}
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                {t('ApplicationStatus.viewJobDetails')}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
