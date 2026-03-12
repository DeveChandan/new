"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, FileText, Send, Search } from "lucide-react"
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface Invoice {
  _id: string
  invoiceNumber: string
  employer: {
    _id: string
    name: string
    email: string
  }
  subscription: {
    planType: string
  }
  totalAmount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
  pdfUrl: string
}

export default function AdminPaymentsPage() {
  const t = useTranslations('Admin.payments')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login")
      return
    }

    if (!authLoading) {
      fetchInvoices()
    }
  }, [user, authLoading, router])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getAdminInvoices()
      setInvoices(data as Invoice[])
      setFilteredInvoices(data as Invoice[])
    } catch (err: any) {
      setError(err.message || t('errors.fetchFailed'))
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }

  useEffect(() => {
    let filtered = invoices

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.employer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.employer.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredInvoices(filtered)
  }, [statusFilter, searchQuery, invoices])

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdating(id)
      await apiClient.updateInvoiceStatus(id, newStatus)
      toast.success(`Invoice status updated to ${newStatus}`)
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const handleSendReminder = async (id: string) => {
    try {
      setSending(id)
      await apiClient.sendPaymentReminder(id)
      toast.success('Payment reminder sent successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reminder')
    } finally {
      setSending(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || (loading && isInitialLoad)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'pending', 'paid', 'overdue'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>{t('list')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <p className="text-muted-foreground">{t('noPayments')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoiceId')}</TableHead>
                    <TableHead>{t('employer')}</TableHead>
                    <TableHead>{t('plan')}</TableHead>
                    <TableHead>{t('amount')}</TableHead>
                    <TableHead>{t('dueDate')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{invoice.employer.name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.employer.email}</div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {invoice.subscription?.planType || tCommon('na')}
                      </TableCell>
                      <TableCell className="font-semibold">₹{invoice.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusUpdate(invoice._id, e.target.value)}
                          disabled={updating === invoice._id}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)} border-0 cursor-pointer`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={() => {
                              const url = invoice.pdfUrl.startsWith('http')
                                ? invoice.pdfUrl
                                : `http://localhost:5000${invoice.pdfUrl}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={() => handleSendReminder(invoice._id)}
                            disabled={sending === invoice._id}
                          >
                            {sending === invoice._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Invoices</div>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {invoices.filter(inv => inv.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Paid</div>
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter(inv => inv.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Overdue</div>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter(inv => inv.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
