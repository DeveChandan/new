"use client"

import { useState, useEffect } from "react"
import { useRouter, Link } from "@/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Download, FileText, Loader2, Filter, AlertCircle, RefreshCw, Calendar, CreditCard } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface Invoice {
    _id: string
    invoiceNumber: string
    subtotal: number
    taxAmount: number
    totalAmount: number
    issueDate: string
    dueDate: string
    status: 'pending' | 'paid' | 'overdue' | 'refunded' | 'cancelled'
    pdfUrl?: string
    emailSent?: boolean
    subscription?: {
        planType: string
        endDate?: string
        startDate?: string
    }
}

export default function BillingPage() {
    const t = useTranslations('Billing')
    const tCommon = useTranslations('Common')
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [downloading, setDownloading] = useState<string | null>(null)
    const [viewing, setViewing] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) {
            return
        }

        if (!user) {
            router.push("/auth/login")
            return
        }

        if (user.role !== 'employer') {
            router.push("/dashboard/employer")
            return
        }

        fetchInvoices()
    }, [user, authLoading, router])

    const fetchInvoices = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await apiClient.getInvoices() as Invoice[]
            setInvoices(Array.isArray(data) ? data : [])
        } catch (err: any) {
            setError(err.message || t('fetchError') || "Failed to load invoices")
        } finally {
            setLoading(false)
        }
    }

    const handleView = async (invoiceId: string) => {
        try {
            setViewing(invoiceId)
            setError("")
            await apiClient.viewInvoice(invoiceId)
        } catch (err: any) {
            console.error('View invoice error:', err)
            setError(err.message || t('viewError') || "Failed to view invoice.")
        } finally {
            setViewing(null)
        }
    }

    const handleDownload = async (invoiceId: string) => {
        try {
            setDownloading(invoiceId)
            setError("")
            await apiClient.downloadInvoice(invoiceId)
        } catch (err: any) {
            console.error('Download error:', err)
            setError(err.message || t('downloadError') || "Failed to download invoice. Please try the View button instead.")
        } finally {
            setDownloading(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'text-green-600 bg-green-500/10 border-green-500/20'
            case 'pending':
                return 'text-amber-600 bg-amber-500/10 border-amber-500/20'
            case 'overdue':
                return 'text-red-600 bg-red-500/10 border-red-500/20'
            case 'refunded':
                return 'text-purple-600 bg-purple-500/10 border-purple-500/20'
            default:
                return 'text-muted-foreground bg-muted border-border'
        }
    }

    const filteredInvoices = filterStatus === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === filterStatus)

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton className="h-6 w-36" />
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-4 w-96 max-w-full" />
                    </div>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Back Navigation */}
                <div className="mb-6">
                    <Link
                        href="/dashboard/employer"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('backToDashboard') || "Back to Dashboard"}
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {t('title') || "Billing & Invoices"}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('subtitle') || "View and download your subscription invoices"}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchInvoices}
                        className="self-start sm:self-auto rounded-full gap-2 text-xs"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {tCommon('buttons.refresh') || "Refresh"}
                    </Button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium">{error}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError("")}
                            className="h-7 text-xs text-destructive hover:bg-destructive/20"
                        >
                            {tCommon('buttons.dismiss') || "Dismiss"}
                        </Button>
                    </div>
                )}

                {/* Status Filter Buttons */}
                <div className="mb-6 flex gap-2 flex-wrap items-center">
                    <Button
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                        className="rounded-full text-xs h-8"
                    >
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        {t('filterAll') || "All"}
                        <span className="ml-1.5 opacity-70">({invoices.length})</span>
                    </Button>
                    <Button
                        variant={filterStatus === 'paid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('paid')}
                        className="rounded-full text-xs h-8"
                    >
                        {t('filterPaid') || "Paid"}
                        <span className="ml-1.5 opacity-70">
                            ({invoices.filter(i => i.status === 'paid').length})
                        </span>
                    </Button>
                    <Button
                        variant={filterStatus === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('pending')}
                        className="rounded-full text-xs h-8"
                    >
                        {t('filterPending') || "Pending"}
                        <span className="ml-1.5 opacity-70">
                            ({invoices.filter(i => i.status === 'pending').length})
                        </span>
                    </Button>
                    <Button
                        variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('overdue')}
                        className="rounded-full text-xs h-8"
                    >
                        {t('filterOverdue') || "Overdue"}
                        <span className="ml-1.5 opacity-70">
                            ({invoices.filter(i => i.status === 'overdue').length})
                        </span>
                    </Button>
                </div>

                {/* Invoices Card */}
                <Card className="border border-border/70 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20 py-4 px-6">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            {t('cardTitle') || "Your Invoices"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredInvoices.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="text-base font-medium text-foreground">
                                    {filterStatus === 'all'
                                        ? (t('noInvoices') || 'No invoices found')
                                        : (t('noStatusInvoices', { status: filterStatus }) || `No ${filterStatus} invoices found`)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Invoices are generated automatically when you subscribe to a hiring plan.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Cards View */}
                                <div className="md:hidden divide-y divide-border/60">
                                    {filteredInvoices.map((invoice) => (
                                        <div key={invoice._id} className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono text-sm font-semibold text-foreground">
                                                        {invoice.invoiceNumber || 'INV-DRAFT'}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                                        {invoice.subscription?.planType || 'Subscription'} Plan
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(invoice.status)}`}
                                                >
                                                    {t(`filter${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`) || invoice.status}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-muted/20 rounded-lg p-2.5">
                                                <div>
                                                    <span className="text-muted-foreground block">{t('date') || "Date"}</span>
                                                    <span className="font-medium text-foreground">
                                                        {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">{t('amount') || "Amount"}</span>
                                                    <span className="font-bold text-foreground text-sm">
                                                        ₹{typeof invoice.totalAmount === 'number' ? invoice.totalAmount.toFixed(2) : '0.00'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 h-9 rounded-xl text-xs gap-1.5"
                                                    onClick={() => handleView(invoice._id)}
                                                    disabled={viewing === invoice._id}
                                                >
                                                    {viewing === invoice._id ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            {t('viewing') || "Opening..."}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="w-3.5 h-3.5 text-primary" />
                                                            {t('view') || "View"}
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 h-9 rounded-xl text-xs gap-1.5"
                                                    onClick={() => handleDownload(invoice._id)}
                                                    disabled={downloading === invoice._id}
                                                >
                                                    {downloading === invoice._id ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            {t('downloading') || "Downloading..."}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-3.5 h-3.5 text-primary" />
                                                            {t('download') || "Download"}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/10">
                                                <th className="text-left py-3.5 px-5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                    {t('invoiceNumber') || "Invoice #"}
                                                </th>
                                                <th className="text-left py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                    {t('plan') || "Plan"}
                                                </th>
                                                <th className="text-left py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                    {t('date') || "Date"}
                                                </th>
                                                <th className="text-left py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                    {t('dueDate') || "Due Date"}
                                                </th>
                                                <th className="text-left py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                    {t('amount') || "Amount"}
                                                </th>
                                                <th className="text-left py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                    {t('status') || "Status"}
                                                </th>
                                                <th className="text-right py-3.5 px-5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                    {t('action') || "Action"}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {filteredInvoices.map((invoice) => (
                                                <tr
                                                    key={invoice._id}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="py-4 px-5">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                                            <span className="font-mono text-sm font-medium text-foreground">
                                                                {invoice.invoiceNumber || 'INV-DRAFT'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="capitalize text-sm font-medium text-foreground">
                                                            {invoice.subscription?.planType || 'Standard'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-muted-foreground">
                                                        {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-muted-foreground">
                                                        {invoice.subscription?.endDate
                                                            ? new Date(invoice.subscription.endDate).toLocaleDateString()
                                                            : invoice.dueDate
                                                                ? new Date(invoice.dueDate).toLocaleDateString()
                                                                : 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="font-semibold text-foreground text-sm">
                                                            ₹{typeof invoice.totalAmount === 'number' ? invoice.totalAmount.toFixed(2) : '0.00'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge
                                                            variant="outline"
                                                            className={`capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(invoice.status)}`}
                                                        >
                                                            {t(`filter${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`) || invoice.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-5 text-right">
                                                        <div className="flex gap-2 justify-end items-center">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 rounded-lg text-xs gap-1.5"
                                                                onClick={() => handleView(invoice._id)}
                                                                disabled={viewing === invoice._id}
                                                                title="View Invoice PDF"
                                                            >
                                                                {viewing === invoice._id ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                        {t('viewing') || "Opening..."}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FileText className="w-3.5 h-3.5 text-primary" />
                                                                        {t('view') || "View"}
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 rounded-lg text-xs gap-1.5"
                                                                onClick={() => handleDownload(invoice._id)}
                                                                disabled={downloading === invoice._id}
                                                                title="Download Invoice PDF"
                                                            >
                                                                {downloading === invoice._id ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                        {t('downloading') || "Downloading..."}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Download className="w-3.5 h-3.5 text-primary" />
                                                                        {t('download') || "Download"}
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
