"use client"

import { useState, useEffect } from "react"
import { useRouter, Link } from "@/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Download, FileText, Loader2, Filter } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Skeleton } from "@/components/ui/skeleton"

interface Invoice {
    _id: string
    invoiceNumber: string
    subtotal: number
    taxAmount: number
    totalAmount: number
    issueDate: string
    dueDate: string
    status: 'pending' | 'paid' | 'overdue'
    pdfUrl: string
    emailSent: boolean
    subscription: {
        planType: string
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

    useEffect(() => {
        if (authLoading) {
            // Still loading, don't do anything yet
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
            setInvoices(data)
        } catch (err: any) {
            setError(err.message || "Failed to load invoices")
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (invoiceId: string) => {
        try {
            setDownloading(invoiceId)
            setError("") // Clear previous errors
            await apiClient.downloadInvoice(invoiceId)
        } catch (err: any) {
            console.error('Download error:', err)
            setError(err.message || "Failed to download invoice. Please try the View button instead.")
        } finally {
            setDownloading(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'text-green-500 bg-green-500/10'
            case 'pending':
                return 'text-yellow-500 bg-yellow-500/10'
            case 'overdue':
                return 'text-red-500 bg-red-500/10'
            default:
                return 'text-gray-500 bg-gray-500/10'
        }
    }

    const filteredInvoices = filterStatus === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === filterStatus)

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-10 w-48 mb-8" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
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
                {/* Back Button */}
                <div className="mb-6">
                    <Link
                        href="/dashboard/employer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Invoices</h1>
                    <p className="text-muted-foreground">View and download your subscription invoices</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 flex gap-2 flex-wrap">
                    <Button
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        All
                    </Button>
                    <Button
                        variant={filterStatus === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filterStatus === 'paid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('paid')}
                    >
                        Paid
                    </Button>
                    <Button
                        variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('overdue')}
                    >
                        Overdue
                    </Button>
                </div>

                {/* Invoices List */}
                <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="text-xl">Your Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredInvoices.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {filterStatus === 'all' ? 'No invoices found' : `No ${filterStatus} invoices`}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice #</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Plan</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Due Date</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                                            <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.map((invoice) => (
                                            <tr key={invoice._id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="capitalize">{invoice.subscription?.planType || 'N/A'}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-sm">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="font-semibold">₹{invoice.totalAmount.toFixed(2)}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                        {invoice.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                // Check if pdfUrl is already a full URL or just a path
                                                                const url = invoice.pdfUrl.startsWith('http')
                                                                    ? invoice.pdfUrl
                                                                    : `http://localhost:5000${invoice.pdfUrl}`;
                                                                console.log('Opening PDF:', url);
                                                                window.open(url, '_blank');
                                                            }}
                                                        >
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDownload(invoice._id)}
                                                            disabled={downloading === invoice._id}
                                                        >
                                                            {downloading === invoice._id ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Downloading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Download className="w-4 h-4 mr-2" />
                                                                    Download
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
