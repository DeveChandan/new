"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import {
    Bell,
    Briefcase,
    Star,
    MessageSquare,
    FileText,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
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

interface NotificationDropdownProps {
    onClose: () => void
    onUpdate: () => void
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
    if (type.includes("approved") || type.includes("hired") || type.includes("accepted")) return "text-green-500"
    if (type.includes("rejected") || type.includes("declined")) return "text-red-500"
    if (type.includes("pending") || type.includes("prompt")) return "text-yellow-500"
    return "text-blue-500"
}

export function NotificationDropdown({ onClose, onUpdate }: NotificationDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response: any = await apiClient.getNotifications({ limit: 5 })
            setNotifications(response.notifications || [])
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
            onUpdate()
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.markAllNotificationsAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            onUpdate()
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification._id)
        }
        onClose()
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">Notifications</h3>
                {notifications.some(n => !n.isRead) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs"
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                        <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => {
                            const Icon = getNotificationIcon(notification.type)
                            const iconColor = getNotificationColor(notification.type)

                            return (
                                <Link
                                    key={notification._id}
                                    href={notification.actionUrl || "/notifications"}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="block"
                                >
                                    <div
                                        className={`p-4 hover:bg-muted/50 transition-colors ${!notification.isRead ? "bg-primary/5" : ""
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 ${iconColor}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm font-medium ${!notification.isRead ? "font-semibold" : ""}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </ScrollArea>

            <Separator />

            <div className="p-2">
                <Link href="/notifications" onClick={onClose}>
                    <Button variant="ghost" className="w-full justify-center text-sm">
                        View all notifications
                    </Button>
                </Link>
            </div>
        </div>
    )
}
