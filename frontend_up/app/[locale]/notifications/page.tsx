"use client"

import { useState, useEffect } from "react"
import { Link, useRouter } from "@/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import {
    Bell,
    Briefcase,
    Star,
    MessageSquare,
    FileText,
    DollarSign,
    Clock,
    Loader2,
    Trash2,
    CheckCheck,
    ArrowLeft,
} from "lucide-react"

interface Notification {
    _id: string
    type: string
    title: string
    message: string
    isRead: boolean
    actionUrl: string
    createdAt: string
    metadata?: any
}

const getNotificationIcon = (type: string) => {
    if (type.includes("application") || type.includes("hire")) return Briefcase
    if (type.includes("rating")) return Star
    if (type.includes("message")) return MessageSquare
    if (type.includes("document")) return FileText
    if (type.includes("payment")) return DollarSign
    if (type.includes("work")) return Clock
    return Bell
}

const getNotificationColor = (type: string) => {
    if (type.includes("approved") || type.includes("hired") || type.includes("accepted")) return "text-green-500 bg-green-50"
    if (type.includes("rejected") || type.includes("declined")) return "text-red-500 bg-red-50"
    if (type.includes("pending") || type.includes("prompt")) return "text-yellow-500 bg-yellow-50"
    return "text-blue-500 bg-blue-50"
}

export default function NotificationsPage() {
    const t = useTranslations('Notifications')
    const tCommon = useTranslations('Common')
    const router = useRouter()

    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "unread">("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchNotifications()
    }, [filter, page])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const params: any = { page, limit: 20 }
            if (filter === "unread") {
                params.isRead = false
            }

            const response: any = await apiClient.getNotifications(params)
            setNotifications(response.notifications || [])
            setTotalPages(response.totalPages || 1)
            setUnreadCount(response.unreadCount || 0)
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await apiClient.markNotificationAsRead(notificationId)
            setNotifications(prev =>
                prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.markAllNotificationsAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

    const handleDelete = async (notificationId: string) => {
        try {
            await apiClient.deleteNotification(notificationId)
            setNotifications(prev => prev.filter(n => n._id !== notificationId))
        } catch (error) {
            console.error("Error deleting notification:", error)
        }
    }

    const handleClearAll = async () => {
        try {
            await apiClient.clearReadNotifications()
            setNotifications(prev => prev.filter(n => !n.isRead))
        } catch (error) {
            console.error("Error clearing notifications:", error)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky header — sits at the top of the viewport scroll context */}
            <div className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 pb-3 gap-3">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="rounded-full shrink-0"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">{t('title')}</h1>
                                <p className="text-muted-foreground text-sm">
                                    {unreadCount > 0 ? t('unreadCount', { count: unreadCount }) : t('allCaughtUp')}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {unreadCount > 0 && (
                                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="flex-1 sm:flex-none">
                                    <CheckCheck className="h-4 w-4 mr-1" />
                                    {t('markAllAsRead')}
                                </Button>
                            )}
                            {notifications.some(n => n.isRead) && (
                                <Button variant="outline" size="sm" onClick={handleClearAll} className="flex-1 sm:flex-none">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {t('clearRead')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tab strip */}
                    <div className="flex gap-1 pb-0">
                        <button
                            onClick={() => { setFilter("all"); setPage(1); }}
                            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${filter === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                        >
                            {t('filters.all')}
                        </button>
                        <button
                            onClick={() => { setFilter("unread"); setPage(1); }}
                            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${filter === "unread" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                        >
                            {t('filters.unread')} {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="container mx-auto max-w-4xl px-4 py-6 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="p-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {filter === "unread" ? t('empty.unreadDescription') : t('empty.description')}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <>
                        {notifications.map((notification) => {
                            const Icon = getNotificationIcon(notification.type)
                            const colorClass = getNotificationColor(notification.type)

                            return (
                                <Card
                                    key={notification._id}
                                    className={`p-4 transition-all hover:shadow-md ${!notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-full ${colorClass} flex-shrink-0`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className={`font-semibold ${!notification.isRead ? "text-primary" : ""}`}>
                                                    {notification.title}
                                                </h3>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!notification.isRead && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAsRead(notification._id)}
                                                            className="h-7 text-xs px-2"
                                                        >
                                                            {t('actions.markAsRead')}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(notification._id)}
                                                        className="h-7 w-7"
                                                        title={t('actions.delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                                {notification.actionUrl && (
                                                    <Link href={notification.actionUrl}>
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="h-auto p-0 text-xs"
                                                            onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                                                        >
                                                            {t('actions.viewDetails')} →
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    {tCommon('buttons.previous')}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    {tCommon('buttons.next')}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

