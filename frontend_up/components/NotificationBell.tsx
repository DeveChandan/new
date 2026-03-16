"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationDropdown } from "@/components/NotificationDropdown"
import { useNotification } from "@/contexts/NotificationContext"

export function NotificationBell() {
    const { unreadCount, fetchUnreadCount } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Initial fetch is handled in the provider, but we can refetch on mount if needed
        // fetchUnreadCount(); 
    }, []);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        // No fetchUnreadCount here; unreadCount is kept in sync globally via sockets
    }

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full hover:bg-accent"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <NotificationDropdown onClose={() => setIsOpen(false)} onUpdate={fetchUnreadCount} />
            </PopoverContent>
        </Popover>
    )
}
