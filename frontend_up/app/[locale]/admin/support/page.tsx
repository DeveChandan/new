"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "@/navigation"
import { useTranslations } from "next-intl"
import {
  Loader2,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  Clock,
  ExternalLink,
  XCircle,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import moment from "moment"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminSupportPage() {
  const t = useTranslations("Admin.support")
  const tCommon = useTranslations("Common")
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState("")
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getSupportMessages({
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        pageSize: 10
      })
      setMessages(data.messages)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err: any) {
      setError(err.message || "Failed to fetch support messages")
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }, [debouncedSearch, status, startDate, endDate, currentPage])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login")
      return
    }
    if (!authLoading) {
      fetchMessages()
    }
  }, [authLoading, user, fetchMessages, router])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoading(id)
      await apiClient.updateSupportMessageStatus(id, newStatus)
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus })
      }
      fetchMessages()
    } catch (err: any) {
      alert(err.message || "Failed to update status")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t("confirmDelete"))) {
      try {
        setActionLoading(id)
        await apiClient.deleteSupportMessage(id)
        if (selectedMessage && selectedMessage._id === id) {
          setIsDialogOpen(false)
        }
        fetchMessages()
      } catch (err: any) {
        alert(err.message || "Failed to delete message")
      } finally {
        setActionLoading(null)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500 hover:bg-blue-600">{t("new")}</Badge>
      case "read":
        return <Badge variant="secondary">{t("read")}</Badge>
      case "replied":
        return <Badge className="bg-green-500 hover:bg-green-600">{t("replied")}</Badge>
      case "closed":
        return <Badge variant="outline">{t("closed")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (authLoading || (loading && isInitialLoad)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                {t("search")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-48 space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {t("status")}
              </label>
              <Select value={status} onValueChange={(val) => { setStatus(val); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="new">{t("new")}</SelectItem>
                  <SelectItem value="read">{t("read")}</SelectItem>
                  <SelectItem value="replied">{t("replied")}</SelectItem>
                  <SelectItem value="closed">{t("closed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {tCommon("labels.from")}
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {tCommon("labels.to")}
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-40"
                />
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => { 
                setSearch(""); 
                setStatus("all"); 
                setStartDate(""); 
                setEndDate(""); 
                setCurrentPage(1); 
              }}
            >
              {tCommon("buttons.reset")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t("from")}</TableHead>
                  <TableHead className="max-w-[300px]">{t("subject")}</TableHead>
                  <TableHead className="w-[120px]">{t("status")}</TableHead>
                  <TableHead className="w-[150px]">{t("receivedAt")}</TableHead>
                  <TableHead className="w-[100px] text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      {t("noMessages")}
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((msg) => (
                    <TableRow key={msg._id} className={msg.status === "new" ? "bg-accent/50 font-medium" : ""}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{msg.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{msg.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {msg.subject}
                      </TableCell>
                      <TableCell>{getStatusBadge(msg.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {moment(msg.createdAt).fromNow()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMessage(msg);
                              setIsDialogOpen(true);
                              if (msg.status === "new") handleUpdateStatus(msg._id, "read");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateStatus(msg._id, "read")} disabled={msg.status === "read"}>
                                <CheckCircle className="h-4 w-4 mr-2" /> {t("markRead")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(msg._id, "replied")} disabled={msg.status === "replied"}>
                                <Mail className="h-4 w-4 mr-2" /> {t("markReplied")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(msg._id, "closed")} disabled={msg.status === "closed"}>
                                <XCircle className="h-4 w-4 mr-2" /> {t("markClosed")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(msg._id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {messages.length} of {total} messages
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {currentPage} / {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-xl">{t("details")}</DialogTitle>
                  {getStatusBadge(selectedMessage.status)}
                </div>
                <DialogDescription className="mt-2">
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("from")}</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{selectedMessage.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{selectedMessage.email}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("receivedAt")}</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{moment(selectedMessage.createdAt).format("MMMM Do YYYY, h:mm a")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">({moment(selectedMessage.createdAt).fromNow()})</p>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("subject")}</h3>
                  <p className="text-lg font-medium leading-tight">{selectedMessage.subject}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("message")}</h3>
                  <div className="p-4 rounded-lg border bg-card whitespace-pre-wrap text-sm min-h-[150px]">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                <div className="flex-1 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedMessage._id, "replied")}
                    disabled={selectedMessage.status === "replied"}
                  >
                    <Mail className="mr-2 h-4 w-4" /> {t("markReplied")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedMessage._id, "closed")}
                    disabled={selectedMessage.status === "closed"}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> {t("markClosed")}
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedMessage._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {t("delete")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
