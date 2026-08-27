"use client"

import React, { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import {
  Wrench,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sparkles,
  X,
  ExternalLink,
  Megaphone
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Announcement {
  _id: string
  title: string
  message: string
  type: "maintenance" | "info" | "warning" | "critical" | "success"
  targetAudience: "all" | "worker" | "employer"
  platform: "all" | "web" | "mobile"
  isActive: boolean
  isDismissible: boolean
  actionUrl?: string
  actionLabel?: string
  startDate?: string
  endDate?: string
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    // Load dismissed IDs from localStorage
    try {
      const saved = localStorage.getItem("shramik_dismissed_announcements")
      if (saved) {
        setDismissedIds(JSON.parse(saved))
      }
    } catch (e) {
      // ignore
    }

    const fetchActive = async () => {
      try {
        const res = await apiClient.getActiveAnnouncements({ platform: "web" })
        if (res.success && Array.isArray(res.announcements)) {
          setAnnouncements(res.announcements)
        }
      } catch (err) {
        // quiet fail on banner fetch
      }
    }

    fetchActive()

    // Listen to real-time socket announcement if socket available
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("shramik_dismissed_announcements")
        if (saved) {
          setDismissedIds(JSON.parse(saved))
        }
      } catch (e) {}
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id]
    setDismissedIds(updated)
    try {
      localStorage.setItem("shramik_dismissed_announcements", JSON.stringify(updated))
    } catch (e) {}
  }

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    (a) => !a.isDismissible || !dismissedIds.includes(a._id)
  )

  if (visibleAnnouncements.length === 0) {
    return null
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "maintenance":
        return {
          bg: "bg-amber-600 text-white shadow-amber-900/20",
          badge: "bg-amber-800/40 text-amber-100 border-amber-400/30",
          icon: <Wrench className="w-4 h-4 animate-bounce shrink-0 text-amber-200" />,
          label: "Maintenance Notice"
        }
      case "critical":
        return {
          bg: "bg-rose-600 text-white shadow-rose-900/20",
          badge: "bg-rose-800/40 text-rose-100 border-rose-400/30",
          icon: <ShieldAlert className="w-4 h-4 shrink-0 text-rose-200" />,
          label: "Critical Alert"
        }
      case "warning":
        return {
          bg: "bg-amber-500 text-slate-950 shadow-amber-900/20",
          badge: "bg-amber-900/20 text-slate-950 border-amber-600/30",
          icon: <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />,
          label: "Important Update"
        }
      case "success":
        return {
          bg: "bg-emerald-600 text-white shadow-emerald-900/20",
          badge: "bg-emerald-800/40 text-emerald-100 border-emerald-400/30",
          icon: <Sparkles className="w-4 h-4 shrink-0 text-emerald-200" />,
          label: "Announcement"
        }
      case "info":
      default:
        return {
          bg: "bg-indigo-600 text-white shadow-indigo-900/20",
          badge: "bg-indigo-800/40 text-indigo-100 border-indigo-400/30",
          icon: <Megaphone className="w-4 h-4 shrink-0 text-indigo-200" />,
          label: "Notice"
        }
    }
  }

  return (
    <div className="relative z-30 w-full flex flex-col space-y-1">
      {visibleAnnouncements.map((announcement) => {
        const theme = getTypeStyles(announcement.type)

        return (
          <div
            key={announcement._id}
            className={`w-full px-4 py-2.5 sm:py-3 transition-all duration-300 shadow-md ${theme.bg}`}
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {theme.icon}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${theme.badge}`}
                >
                  {theme.label}
                </span>
                <span className="font-semibold truncate sm:whitespace-normal">
                  {announcement.title}:
                </span>
                <span className="text-white/90 font-normal line-clamp-1 sm:line-clamp-none flex-1">
                  {announcement.message}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {announcement.actionUrl && (
                  <a
                    href={announcement.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white font-medium px-2.5 py-1 rounded-md text-xs transition-colors backdrop-blur-xs"
                  >
                    {announcement.actionLabel || "Learn More"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {announcement.isDismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(announcement._id)}
                    className="h-7 w-7 p-0 text-white hover:bg-white/20 hover:text-white rounded-full"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
