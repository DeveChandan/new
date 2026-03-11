"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, Briefcase, FileText, Clock } from "lucide-react"
import { useTranslations } from "next-intl"

interface Application {
    applicationId?: string
    _id: string
    title: string
    status: string
    appliedDate?: string
}

interface ApplicationsListModalProps {
    isOpen: boolean
    onClose: () => void
    applications: Application[]
    title: string
    onSelectApplication: (app: any) => void
}

export function ApplicationsListModal({
    isOpen,
    onClose,
    applications,
    title,
    onSelectApplication,
}: ApplicationsListModalProps) {
    const t = useTranslations("Dashboard.worker")

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-card/80 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-2xl font-bold text-foreground">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4">
                            {applications.length > 0 ? (
                                applications.map((app) => (
                                    <div
                                        key={app.applicationId || app._id}
                                        onClick={() => onSelectApplication(app)}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/20 space-y-2 sm:space-y-0 cursor-pointer hover:bg-muted/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`p-2 rounded-full ${["hired", "offerAccepted", "offered"].includes(app.status)
                                                    ? "bg-green-500/10 text-green-500"
                                                    : "bg-primary/10 text-primary"
                                                    }`}
                                            >
                                                {["hired", "offerAccepted"].includes(app.status) ? (
                                                    <CheckCircle className="w-5 h-5" />
                                                ) : app.status === "offered" ? (
                                                    <Briefcase className="w-5 h-5" />
                                                ) : (
                                                    <FileText className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{app.title}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {t("appliedOn")}{" "}
                                                    {new Date(
                                                        app.appliedDate || Date.now()
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${app.status === "approved" ||
                                                app.status === "hired" ||
                                                app.status === "offerAccepted"
                                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                : app.status === "pending" || app.status === "offered"
                                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                                    : app.status === "rejected" || app.status === "offerRejected"
                                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                }`}
                                        >
                                            {app.status === "offerAccepted"
                                                ? "Hired"
                                                : app.status === "offered"
                                                    ? "Offer Received"
                                                    : app.status === "offerRejected"
                                                        ? "Offer Declined"
                                                        : app.status.charAt(0).toUpperCase() +
                                                        app.status.slice(1)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-8 h-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">No applications found.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
