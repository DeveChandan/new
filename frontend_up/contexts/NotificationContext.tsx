"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { useRouter } from "@/navigation"
import { useAuth } from "@/hooks/use-auth"
import { isAuthenticated } from "@/lib/auth"
import { io, Socket } from "socket.io-client"
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { toast } from "sonner"

export type NotificationType =
    | "success"
    | "error"
    | "info"
    | "warning"
    // Custom types
    | "new_application"
    | "hire_request_received"
    | "hire_request_accepted"
    | "hire_request_rejected"
    | "worker_hired"
    | "application_rejected"
    | "new_message"
    | "dispute_opened"
    | "dispute_resolved"
    | "subscription_created"
    | "invoice_generated"
    | "new_rating";

export interface Toast {
    id: string
    type: NotificationType
    title: string
    message: string
    duration?: number
    actionUrl?: string
}

interface NotificationContextType {
    showToast: (toast: Omit<Toast, "id">) => void;
    unreadCount: number;
    fetchUnreadCount: () => Promise<void>;
    activeWorkLog: any;
    fetchActiveWorkLog: () => Promise<void>;
    socket: Socket | null;
    isUserOnline: (userId: string) => boolean;
    checkOnlineStatus: (userId: string) => void;
    isTabVisible: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeWorkLog, setActiveWorkLog] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [isTabVisible, setIsTabVisible] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    // Visibility Listener
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated() || document.visibilityState !== 'visible') return;
        try {
            const response: any = await apiClient.getUnreadNotificationCount();
            setUnreadCount(response.count || 0);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, [user]);

    const fetchActiveWorkLog = useCallback(async () => {
        if (!isAuthenticated() || user?.role !== 'worker' || document.visibilityState !== 'visible') return;
        try {
            const data: any = await apiClient.getWorkLogsForWorker();
            // Assuming the API returns an array, find the one that is in-progress
            const active = data.find((log: any) => log.status === 'in-progress' || log.status === 'pending');
            setActiveWorkLog(active || null);
        } catch (error) {
            console.error("Error fetching active work log:", error);
        }
    }, [user]);

    const showToast = useCallback((toastData: Omit<Toast, "id">) => {
        // Map abstract types to sonner functions
        switch (toastData.type) {
            case 'success':
            case 'hire_request_accepted':
            case 'worker_hired':
            case 'dispute_resolved':
                toast.success(toastData.title, {
                    description: toastData.message,
                    action: toastData.actionUrl ? {
                        label: 'View',
                        onClick: () => router.push(toastData.actionUrl!)
                    } : undefined
                });
                break;
            case 'error':
            case 'hire_request_rejected':
            case 'application_rejected':
                toast.error(toastData.title, {
                    description: toastData.message,
                    action: toastData.actionUrl ? {
                        label: 'View',
                        onClick: () => router.push(toastData.actionUrl!)
                    } : undefined
                });
                break;
            case 'warning':
            case 'dispute_opened':
                toast.warning(toastData.title, {
                    description: toastData.message,
                    action: toastData.actionUrl ? {
                        label: 'View',
                        onClick: () => router.push(toastData.actionUrl!)
                    } : undefined
                });
                break;
            case 'info':
            default:
                // For other types like 'new_application', 'new_message', etc. use default or info
                toast.message(toastData.title, {
                    description: toastData.message,
                    icon: getIconForType(toastData.type),
                    action: toastData.actionUrl ? {
                        label: 'View',
                        onClick: () => router.push(toastData.actionUrl!)
                    } : undefined
                });
                break;
        }
    }, [router]);

    const handleNavigate = useCallback((url: string) => {
        router.push(url);
    }, [router]);

    useEffect(() => {
        if (!user?._id) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Fetch initial count on login
        fetchUnreadCount();

        const socketUrl = API_ROOT_URL;
        const newSocket: Socket = io(socketUrl, {
            path: '/api/socket.io',
            withCredentials: true, // Crucial for cookies
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Global Socket connected:', newSocket.id);
            // Join user's personal room with the correct prefix matching backend
            newSocket.emit('joinUserRoom', `user:${user._id}`);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Global Socket disconnected');
        });

        newSocket.on('receiveMessage', (message: { _id: string; conversationId: string; sender: string }) => {
            console.log('📩 Global Message Received (ReceiveMessage):', message);
            // Emit delivered event back to sender
            if (message.sender !== user._id) {
                newSocket.emit('message:delivered', { 
                    messageId: message._id, 
                    conversationId: message.conversationId 
                });
            }
        });

        newSocket.on('message:new', (message: { _id: string; conversationId: string; sender: string }) => {
            console.log('📩 Global Message Received (Message:New):', message);
            // Emit delivered event back to sender
            if (message.sender !== user._id) {
                newSocket.emit('message:delivered', { 
                    messageId: message._id, 
                    conversationId: message.conversationId 
                });
            }
        });

        newSocket.on('notification:new', (notification: { title: string; message: string; actionUrl: string; type: NotificationType }) => {
            console.log('📬 Received notification:', notification);
            // Always show toast if it's high priority, but maybe only update count if visible?
            // Actually, unread count should update in background, but data refresh should be guarded.
            showToast({
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
                type: notification.type,
            });
            setUnreadCount(prevCount => prevCount + 1);
        });

        newSocket.on('notification:read', () => {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        });

        newSocket.on('notification:allRead', () => {
            setUnreadCount(0);
        });

        newSocket.on('workLogUpdated', () => {
            if (document.visibilityState === 'visible') {
                fetchActiveWorkLog();
            }
        });

        // Online status listeners
        newSocket.on('user:online', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => new Set(prev).add(userId));
        });

        newSocket.on('user:offline', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        });

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [user, showToast, fetchUnreadCount, fetchActiveWorkLog]);

    const checkOnlineStatus = useCallback((userId: string) => {
        if (socket) {
            socket.emit('users:getOnlineStatus', { userIds: [userId] }, (status: Record<string, boolean>) => {
                if (status[userId]) {
                    setOnlineUsers(prev => new Set(prev).add(userId));
                } else {
                    setOnlineUsers(prev => {
                        const next = new Set(prev);
                        next.delete(userId);
                        return next;
                    });
                }
            });
        }
    }, [socket]);

    const isUserOnline = useCallback((userId: string) => {
        return onlineUsers.has(userId);
    }, [onlineUsers]);

    // Handle API rate limit events globally
    useEffect(() => {
        const handleRateLimit = (event: any) => {
            toast.warning(event.detail?.title || "Too many requests", {
                description: event.detail?.message || "Please slow down and try again in a few minutes.",
                id: "rate-limit-toast",
            });
        };

        window.addEventListener('api-rate-limit', handleRateLimit);
        return () => window.removeEventListener('api-rate-limit', handleRateLimit);
    }, []);

    return (
        <NotificationContext.Provider value={{
            showToast,
            unreadCount,
            fetchUnreadCount,
            activeWorkLog,
            fetchActiveWorkLog,
            socket,
            isUserOnline,
            checkOnlineStatus,
            isTabVisible
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

// Helper to get icons for custom types
function getIconForType(type: NotificationType) {
    // You can import icons from lucide-react and return them here
    // For now returning undefined to let Sonner use default info icon or we can add specific ones
    return undefined;
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within NotificationProvider");
    }
    return context;
}
